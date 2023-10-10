import { Toucan } from "toucan-js";
import { handlePostWrapper } from "./handlers/post";
import { handleSchedule } from "./handlers/schedule";
import { FetchWorkerEvent, ScheduledWorkerEvent } from "./data";

const sentryClient = (
  event: FetchWorkerEvent | ScheduledWorkerEvent,
  handler: string
) => {
  const client = new Toucan({
    dsn: event.env.SENTRY_DSN,
    requestDataOptions: {
      allowedHeaders: ["user-agent", "cf-ray"],
    },
    // request does not exist on ScheduledEvent
    request: "request" in event ? event.request : undefined,
    context: event.ctx,
    environment: event.env.WORKER_ENV,
    initialScope: {
      tags: {
        handler,
      },
    },
  });

  return client;
};

export default {
  fetch: async (
    request: FetchWorkerEvent["request"],
    env: FetchWorkerEvent["env"],
    ctx: FetchWorkerEvent["ctx"]
  ) => {
    const event: FetchWorkerEvent = { request, env, ctx };
    if (request.method === "POST") {
      return await handlePostWrapper(event, sentryClient(event, "post"));
    } else {
      return new Response(null, { status: 405 });
    }
  },
  scheduled: async (
    controller: ScheduledWorkerEvent["controller"],
    env: ScheduledWorkerEvent["env"],
    ctx: ScheduledWorkerEvent["ctx"]
  ) => {
    const event: ScheduledWorkerEvent = { controller, env, ctx };
    await handleSchedule(event, sentryClient(event, "schedule"));
  },
} as ExportedHandler;
