import { ScheduledWorkerEvent, FetchWorkerEvent } from "../src/data";

export const MockedKV = () =>
  ({
    put: jest.fn(async () => {}),
    get: jest.fn(async () => ""),
    list: jest.fn(async () => {}),
    delete: jest.fn(async () => {}),
    getWithMetadata: jest.fn(async () => {}),
  } as unknown as KVNamespace);

export const MockedConsole = () => ({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

export const MockedSentry = () => ({
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  setExtras: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
});

export const BASE_PAYLOAD = {
  uuid: "12345678901234567890123456789012",
  installation_type: "Unknown",
  version: "1970.1.1",
};

export const MockedFetchEvent = (options: {
  request?: Partial<FetchWorkerEvent["request"]>;
  env?: Partial<FetchWorkerEvent["env"]>;
  ctx?: Partial<FetchWorkerEvent["ctx"]>;
  payload?: Record<string, any>;
}): FetchWorkerEvent => ({
  request: {
    cf: {
      country: "XX",
      ...options.request?.cf,
    } as IncomingRequestCfProperties,
    json: async () => ({
      ...BASE_PAYLOAD,
      ...options.payload,
    }),
    ...options.request,
  } as FetchWorkerEvent["request"],
  env: {
    SENTRY_DSN: "",
    WORKER_ENV: "testing",
    NETLIFY_BUILD_HOOK: "https://somesite/hook",
    KV: MockedKV(),
    ...options.env,
  },
  ctx: {
    waitUntil: () => {},
    passThroughOnException: () => {},
    ...options.ctx,
  },
});

export const MockedScheduledEvent = (options: {
  controller?: Partial<ScheduledWorkerEvent["controller"]>;
  env?: Partial<ScheduledWorkerEvent["env"]>;
  ctx?: Partial<ScheduledWorkerEvent["ctx"]>;
}): ScheduledWorkerEvent => ({
  controller: {
    scheduledTime: 1234,
    cron: "",
    noRetry: () => {},
    ...options.controller,
  },
  env: {
    SENTRY_DSN: "",
    WORKER_ENV: "testing",
    NETLIFY_BUILD_HOOK: "https://somesite/hook",
    KV: MockedKV(),
    ...options.env,
  },
  ctx: {
    waitUntil: () => {},
    passThroughOnException: () => {},
    ...options.ctx,
  },
});
