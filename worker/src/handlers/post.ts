// Receive data from a Home Assistant installation
import {
  generateUuidMetadata,
  IncomingPayload,
  KV_PREFIX_UUID,
  UuidMetadata,
  UuidMetadataKey,
} from "../data";
import { daysToSeconds } from "../utils/date";
import { deepEqual } from "../utils/deep-equal";
import { assertIncomingPayload } from "../utils/validate";

const updateThreshold = daysToSeconds(30);
const expirationTtl = daysToSeconds(60);

export async function handlePost(request: Request): Promise<Response> {
  const incomingPayload = await request.json();
  incomingPayload.country = request.cf.country;

  try {
    assertIncomingPayload(incomingPayload);
  } catch (e) {
    console.error(JSON.stringify(e));
    return new Response(null, { status: 400 });
  }

  const storageKey = `${KV_PREFIX_UUID}:${incomingPayload.uuid}`;

  const currentTimestamp = new Date().getTime();

  // Get the current stored data for the storageKey if any
  const stored: {
    value?: IncomingPayload | null;
    metadata?: UuidMetadata | null;
  } = await KV.getWithMetadata(storageKey, "json");

  if (!stored || !stored.value) {
    // First contact for UUID, store payload
    await storePayload(storageKey, incomingPayload, currentTimestamp);
    return new Response();
  }

  const lastWrite = stored.metadata
    ? stored.metadata[UuidMetadataKey.UPDATED]
    : stored.value.last_write;

  delete stored.value.last_write;

  if (!deepEqual(stored.value, incomingPayload)) {
    // Payload changed, update stored data
    await storePayload(
      storageKey,
      incomingPayload,
      currentTimestamp,
      stored.metadata
    );
  } else if (!lastWrite || currentTimestamp - lastWrite > updateThreshold) {
    // Threshold has passed, update stored data
    await storePayload(
      storageKey,
      incomingPayload,
      currentTimestamp,
      stored.metadata
    );
  }

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
