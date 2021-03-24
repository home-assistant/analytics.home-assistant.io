// Receive data from a Home Assistant installation
import {
  allowedPayloadKeys,
  InstallationTypes,
  SanitizedPayload,
} from '../data'
import { daysToSeconds } from '../utils'

const updateThreshold = daysToSeconds(30) // 7 days in seconds
const expirationTtl = daysToSeconds(60) // 8 days in seconds

export async function handlePost(request: Request): Promise<Response> {
  const payload = await request.json()
  if (!payload.huuid) {
    return new Response(null, { status: 400 })
  }

  const storageKey = `huuid:${payload.huuid}`

  const sanitizedPayload = sanitizePayload(payload)

  if (sanitizedPayload instanceof Response) {
    // Sanitize failed, return the prepared response
    return sanitizedPayload
  }

  const currentTimestamp = new Date().getTime()

  // Get the current stored data for the storageKey if any
  const stored = JSON.parse(await KV.get(storageKey))

  if (!stored) {
    // First contact for HUUID, store payload
    await storePayload(storageKey, sanitizedPayload, currentTimestamp)
    return new Response()
  }

  const lastWrite = stored.last_write
  delete stored.last_write

  if (JSON.stringify(stored) !== JSON.stringify(sanitizedPayload)) {
    // Payload changed, update stored data
    await storePayload(storageKey, sanitizedPayload, currentTimestamp)
  } else if (currentTimestamp - lastWrite > updateThreshold) {
    // Threshold has passed, update stored data
    await storePayload(storageKey, sanitizedPayload, currentTimestamp)
  }

  return new Response()
}

async function storePayload(
  huuid: string,
  payload: SanitizedPayload,
  currentTimestamp: number,
) {
  await KV.put(
    huuid,
    JSON.stringify({ ...payload, last_write: currentTimestamp }),
    { expirationTtl },
  )
}

const sanitizePayload = (payload: any): SanitizedPayload | Response => {
  if (!payload.installation_type || !payload.version) {
    return new Response('Missing required keys in the payload', { status: 400 })
  }

  if (!InstallationTypes.includes(payload.installation_type)) {
    return new Response(
      `${String(payload.installation_type)} is not a valid instalaltion type`,
      { status: 400 },
    )
  }

  for (const entry of Object.keys(payload)) {
    if (!allowedPayloadKeys.includes(entry)) {
      // Because versions of core can differ we just remove the unkown payload entries instead of hard failing
      delete payload[entry]
    }

    if (entry === 'integrations') {
      for (const integration of payload.integrations) {
        if (typeof integration === 'string' || integration instanceof String) {
          continue
        } else {
          return new Response(
            `${String(integration)} is not a valid integration`,
            {
              status: 400,
            },
          )
        }
      }
    }
  }

  return payload
}
