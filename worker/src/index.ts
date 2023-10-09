import { Toucan } from "toucan-js";
import { handlePostWrapper } from "./handlers/post";
import { handleSchedule } from "./handlers/schedule";

declare global {
  const KV: KVNamespace;
  const NETLIFY_BUILD_HOOK: string;
  const SENTRY_DSN: string;
  const WORKER_ENV: string;
}

const sentryClient = (event: FetchEvent | ScheduledEvent, handler: string) => {
  const client = new Toucan({
    dsn: SENTRY_DSN,
    requestDataOptions: {
      allowedHeaders: ["user-agent"],
    },
    // request does not exist on ScheduledEvent
    request: "request" in event ? event.request : undefined,
    environment: WORKER_ENV,
  });
  client.setTag("handler", handler);

  return client;
};

addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method === "POST") {
    event.respondWith(
      handlePostWrapper(event.request, sentryClient(event, "post"))
    );
  } else {
    event.respondWith(new Response(null, { status: 405 }));
  }
});

addEventListener("scheduled", (event) => {
  event.waitUntil(handleSchedule(event, sentryClient(event, "schedule")));
});
