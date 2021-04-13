// Receive data from a Home Assistant installation
import {
  AllowedPayloadKeys,
  InstallationTypes,
  KV_PREFIX_UUID,
  SanitizedPayload,
  generateMetadata,
  UuidMetadataKey,
  UuidMetadata,
} from "../data";
import { daysToSeconds } from "../utils/date";
import { deepEqual } from "../utils/deep-equal";

const updateThreshold = daysToSeconds(30);
const expirationTtl = daysToSeconds(60);

export async function handlePost(request: Request): Promise<Response> {
  const payload = await request.json();
  if (!payload.uuid) {
    return new Response(null, { status: 400 });
  }

  payload.uuid = String(payload.uuid);

  const storageKey = `${KV_PREFIX_UUID}:${payload.uuid}`;
  const country = request.headers.get("cf-ipcountry");

  let sanitizedPayload: SanitizedPayload;

  try {
    sanitizedPayload = sanitizePayload(payload, country);
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  const currentTimestamp = new Date().getTime();

  // Get the current stored data for the storageKey if any
  const stored: {
    value?: SanitizedPayload | null;
    metadata?: UuidMetadata | null;
  } = await KV.getWithMetadata(storageKey, "json");

  if (!stored || !stored.value) {
    // First contact for UUID, store payload
    await storePayload(storageKey, sanitizedPayload, currentTimestamp);
    return new Response();
  }

  const lastWrite = stored.metadata
    ? stored.metadata[UuidMetadataKey.UPDATED]
    : stored.value.last_write;

  delete stored.value.last_write;

  if (!deepEqual(stored.value, sanitizedPayload)) {
    // Payload changed, update stored data
    await storePayload(
      storageKey,
      sanitizedPayload,
      currentTimestamp,
      stored.metadata
    );
  } else if (!lastWrite || currentTimestamp - lastWrite > updateThreshold) {
    // Threshold has passed, update stored data
    await storePayload(
      storageKey,
      sanitizedPayload,
      currentTimestamp,
      stored.metadata
    );
  }

  return new Response();
}

async function storePayload(
  storageKey: string,
  payload: SanitizedPayload,
  currentTimestamp: number,
  metadata?: UuidMetadata | null
) {
  await KV.put(storageKey, JSON.stringify(payload), {
    expirationTtl,
    metadata: generateMetadata(payload, currentTimestamp, metadata),
  });
}

const sanitizePayload = (
  payload: any,
  country: string | null
): SanitizedPayload => {
  if (!payload.installation_type || !payload.version) {
    throw new Error("Missing required keys in the payload");
  }

  if (payload.uuid.length !== 32) {
    throw new Error("Wrong UUID format");
  }

  const vs = payload.version.split(".");

  if (
    payload.version.length > 24 ||
    vs.length < 3 ||
    vs[0].length !== 4 ||
    vs[1].length > 2
  ) {
    throw new Error("Wrong version format");
  }

  if (!(payload.installation_type in InstallationTypes)) {
    throw new Error(
      `${String(payload.installation_type)} is not a valid instalaltion type`
    );
  }

  for (const entry of Object.keys(payload)) {
    if (!AllowedPayloadKeys.includes(entry)) {
      // Because versions of core can differ we just remove the unkown payload entries instead of hard failing
      delete payload[entry];
    }

    if (entry === "integrations") {
      for (const integration of payload.integrations) {
        if (typeof integration === "string" || integration instanceof String) {
          continue;
        } else {
          throw new Error(`${String(integration)} is not a valid integration`);
        }
      }
    }
  }

  if (country && country.length == 2) {
    payload.country = country;
  }
  return payload;
};
