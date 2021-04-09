import { handlePost } from "./handlers/post";
import { handleSchedule } from "./handlers/schedule";

declare global {
  const KV: KVNamespace;
  const NETLIFY_BUILD_HOOK: string;
}

addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method === "POST") {
    event.respondWith(handlePost(event.request));
  } else {
    event.respondWith(new Response(null, { status: 405 }));
  }
});

addEventListener("scheduled", (event) => {
  event.waitUntil(handleSchedule(event));
});
