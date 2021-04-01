// Receive data from a Home Assistant installation
import {
  AllowedPayloadKeys,
  InstallationTypes,
  SanitizedPayload,
} from "../data";
import { daysToSeconds } from "../utils/date";
import { deepEqual } from "../utils/deep-equal";

const updateThreshold = daysToSeconds(30);
const expirationTtl = daysToSeconds(60);

export async function handlePost(request: Request): Promise<Response> {
  const payload = await request.json();
  if (!payload.huuid) {
    return new Response(null, { status: 400 });
  }

  const storageKey = `huuid:${payload.huuid}`;

  let sanitizedPayload: SanitizedPayload;

  try {
    sanitizedPayload = sanitizePayload(payload);
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  const currentTimestamp = new Date().getTime();

  // Get the current stored data for the storageKey if any
  const stored = await KV.get<SanitizedPayload>(storageKey, "json");

  if (!stored) {
    // First contact for HUUID, store payload
    await storePayload(storageKey, sanitizedPayload, currentTimestamp);
    return new Response();
  }

  const lastWrite = stored.last_write!;
  delete stored.last_write;

  if (deepEqual(stored, sanitizedPayload)) {
    // Payload changed, update stored data
    await storePayload(storageKey, sanitizedPayload, currentTimestamp);
  } else if (currentTimestamp - lastWrite > updateThreshold) {
    // Threshold has passed, update stored data
    await storePayload(storageKey, sanitizedPayload, currentTimestamp);
  }

  return new Response();
}

async function storePayload(
  huuid: string,
  payload: SanitizedPayload,
  currentTimestamp: number
) {
  await KV.put(
    huuid,
    JSON.stringify({ ...payload, last_write: currentTimestamp }),
    { expirationTtl }
  );
}

const sanitizePayload = (payload: any): SanitizedPayload => {
  if (!payload.installation_type || !payload.version) {
    throw new Error("Missing required keys in the payload");
  }

  if (!InstallationTypes.includes(payload.installation_type)) {
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

  return payload;
};
