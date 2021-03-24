import { CloudflareWorkerKV } from 'types-cloudflare-worker'
import { handleGet } from './handlers/get'
import { handlePost } from './handlers/post'
import { handleSchedule } from './handlers/schedule'

declare global {
  const KV: CloudflareWorkerKV
}

addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method === 'POST') {
    event.respondWith(handlePost(event.request))
  } else if (event.request.method === 'GET') {
    event.respondWith(handleGet(event.request))
  }
})

addEventListener('scheduled', (event) => {
  event.waitUntil(handleSchedule(event))
})
