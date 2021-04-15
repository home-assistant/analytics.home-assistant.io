// Receive data from a Home Assistant installation
import Toucan from "toucan-js";
import {
  generateUuidMetadata,
  IncomingPayload,
  KV_PREFIX_UUID,
  UuidMetadata,
  UuidMetadataKey,
} from "../data";
import { daysToMs } from "../utils/date";
import { deepEqual } from "../utils/deep-equal";
import { assertIncomingPayload } from "../utils/validate";

const updateThreshold = daysToMs(30);
const expirationTtl = daysToMs(60);
const withRegion = new Set(["US"]);

export async function handlePostWrapper(
  request: Request,
  sentry: Toucan
): Promise<Response> {
  try {
    return await handlePost(request, sentry);
  } catch (e) {
    sentry.captureException(e);
    return new Response(null, { status: 500 });
  }
}

async function handlePost(request: Request, sentry: Toucan): Promise<Response> {
  sentry.addBreadcrumb({ message: "Prosess started" });
  const incomingPayload = await request.json();
  incomingPayload.country = request.cf.country;
  if (incomingPayload.country in withRegion) {
    incomingPayload.region = request.cf.regionCode;
  }

  sentry.setUser({ id: incomingPayload.uuid });
  sentry.setExtras(incomingPayload);

  try {
    sentry.addBreadcrumb({ message: "Validate payload" });
    assertIncomingPayload(incomingPayload);
  } catch (e) {
    sentry.captureException(e);
    return new Response(null, { status: 400 });
  }

  const storageKey = `${KV_PREFIX_UUID}:${incomingPayload.uuid}`;

  const currentTimestamp = new Date().getTime();

  sentry.addBreadcrumb({
    message: "Get the current stored data for the storageKey if any",
  });
  const stored: {
    value?: IncomingPayload | null;
    metadata?: UuidMetadata | null;
  } = await KV.getWithMetadata(storageKey, "json");

  if (!stored || !stored.value) {
    sentry.addBreadcrumb({ message: "First contact for UUID, store payload" });
    await storePayload(storageKey, incomingPayload, currentTimestamp);
    return new Response();
  }

  const lastWrite = stored.metadata
    ? stored.metadata[UuidMetadataKey.UPDATED]
    : stored.value.last_write;

  delete stored.value.last_write;

  if (!deepEqual(stored.value, incomingPayload)) {
    sentry.addBreadcrumb({ message: "Payload changed, update stored data" });
    await storePayload(
      storageKey,
      incomingPayload,
      currentTimestamp,
      stored.metadata
    );
  } else if (!lastWrite || currentTimestamp - lastWrite > updateThreshold) {
    sentry.addBreadcrumb({
      message: "Threshold has passed, update stored data",
      data: {
        sinceLastWrite: !lastWrite || currentTimestamp - lastWrite,
        lastWrite,
        currentTimestamp,
        target: updateThreshold,
      },
    });
    await storePayload(
      storageKey,
      incomingPayload,
      currentTimestamp,
      stored.metadata
    );
  }

  sentry.addBreadcrumb({ message: "Prosess complete" });
  return new Response();
}

async function storePayload(
  storageKey: string,
  payload: IncomingPayload,
  currentTimestamp: number,
  metadata?: UuidMetadata | null
) {
  await KV.put(storageKey, JSON.stringify(payload), {
    expirationTtl,
    metadata: generateUuidMetadata(payload, currentTimestamp, metadata),
  });
}
