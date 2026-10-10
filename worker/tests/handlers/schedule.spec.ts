import {
  BRANDS_DOMAINS_URL,
  createQueueData,
  createQueueDefaults,
  FETCH_TIMEOUT,
  HACS_DOMAINS_MAX_AGE,
  HACS_DOMAINS_RETRY_DELAY,
  HACS_INTEGRATIONS_URL,
  KV_KEY_ADDONS,
  KV_KEY_CORE_ANALYTICS,
  KV_KEY_CUSTOM_INTEGRATIONS,
  KV_KEY_HACS_DOMAINS,
  KV_KEY_QUEUE,
  ScheduledTask,
  SCHEMA_VERSION_ANALYTICS,
  SCHEMA_VERSION_QUEUE,
  VERSION_URL,
} from "../../src/data";
import { handleSchedule } from "../../src/handlers/schedule";
import { MockedConsole, MockedScheduledEvent, MockedSentry } from "../mock";

const nothingCached = { value: null, metadata: null };

const cachedList = (cache: { refresh_after: number; domains: string[] }) => ({
  value: JSON.stringify(cache.domains),
  metadata: { refresh_after: cache.refresh_after },
});

const hacsCacheWrites = (event) =>
  (event.env.KV.put as jest.Mock).mock.calls.filter(
    ([key]) => key === KV_KEY_HACS_DOMAINS
  );

const storedHacsCache = (event) => {
  const writes = hacsCacheWrites(event);
  expect(writes).toHaveLength(1);
  const [, value, options] = writes[0];
  return {
    refresh_after: options?.metadata?.refresh_after,
    domains: JSON.parse(value),
  };
};

describe("schedule handler", function () {
  let MockSentry;
  let MockFetch;

  beforeEach(() => {
    MockSentry = MockedSentry();
    (global as any).console = MockedConsole();
    (global as any).fetch = MockFetch = jest.fn(async (url: string) => ({
      ok: true,
      json: jest.fn(async () =>
        url === HACS_INTEGRATIONS_URL
          ? {
              "1234": { domain: "hacs_valid" },
              "5678": { domain: null },
              "9012": { domain: "hacs_valid" },
            }
          : {
              core: ["core_valid"],
              custom: ["custom_valid"],
              hassos: { rpi: "" },
            }
      ),
    }));
    (global as any).NETLIFY_BUILD_HOOK = "";
    (global as any).WORKER_ENV = "production";
  });

  describe("Unexpected task", function () {
    const event = MockedScheduledEvent({
      controller: { cron: "test" },
    });
    it("Unexpected cron trigger", async () => {
      await handleSchedule(event, MockSentry);
      expect(MockSentry.captureException).toHaveBeenCalledWith(
        Error("Unexpected schedule task: test")
      );
    });
  });

  describe("RESET_QUEUE", function () {
    it("Not ready to reset", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.RESET_QUEUE },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(async () => ({
        process_complete: false,
        entries: [],
      }));

      await handleSchedule(event, MockSentry);

      expect(event.env.KV.get).toHaveBeenCalledWith(KV_KEY_QUEUE, "json");
      expect(MockSentry.setTag).toHaveBeenCalledWith("scheduled-task", "RESET_QUEUE");
      expect(event.env.KV.put).toHaveBeenCalledTimes(0);
    });

    it("Queue handing is done, reset queue", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.RESET_QUEUE },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(async () => ({
        process_complete: true,
        entries: [],
      }));

      await handleSchedule(event, MockSentry);
      expect(event.env.KV.put).toHaveBeenCalledTimes(1);
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_QUEUE,
        JSON.stringify(createQueueDefaults())
      );
    });
  });

  describe("UPDATE_HISTORY", function () {
    it("With migration", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.UPDATE_HISTORY },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(async () => ({
        "1234": { active_installations: 3 },
      }));
      (event.env.KV.list as jest.Mock).mockImplementation(async () => ({
        list_complete: true,
        keys: [
          { name: "uuid:1", metadata: { v: "2021.1.1", i: "o" } },
          { name: "uuid:2", metadata: { v: "2021.1.2", i: "c" } },
        ],
      }));

      await handleSchedule(event, MockSentry);

      expect(event.env.KV.get).toHaveBeenCalledWith(KV_KEY_CORE_ANALYTICS, "json");
      expect(MockSentry.setTag).toHaveBeenCalledWith(
        "scheduled-task",
        "UPDATE_HISTORY"
      );
      expect(event.env.KV.put).toHaveBeenCalledTimes(1);
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining('"extended_data_from":3')
      );
    });

    it("Update history and partial current", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.UPDATE_HISTORY },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(async () => ({
        current: { extended_data_from: 3 },
        history: [],
        schema_version: SCHEMA_VERSION_ANALYTICS,
      }));

      (event.env.KV.list as jest.Mock).mockImplementation(async () => ({
        list_complete: true,
        keys: [
          { name: "uuid:1", metadata: { v: "2021.1.1", i: "o" } },
          { name: "uuid:2", metadata: { v: "2021.1.2", i: "c" } },
          { name: "uuid:3", metadata: { v: "2021.1.2", i: "c" } },
          { name: "uuid:4", metadata: { v: "2021.1.2", i: "c" } },
        ],
      }));

      await handleSchedule(event, MockSentry);

      expect(event.env.KV.get).toHaveBeenCalledWith(KV_KEY_CORE_ANALYTICS, "json");
      expect(MockSentry.setTag).toHaveBeenCalledWith(
        "scheduled-task",
        "UPDATE_HISTORY"
      );

      expect(event.env.KV.put).toHaveBeenCalledTimes(1);
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining('"extended_data_from":3')
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining('"active_installations":4')
      );
    });

    it("Entries with missing metadata", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.UPDATE_HISTORY },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(
        async (key: string) => {
          const KV_DATA = {
            [KV_KEY_CORE_ANALYTICS]: { "1234": { active_installations: 3 } },
            "uuid:1": { version: "123456" },
          };

          return KV_DATA[key];
        }
      );

      (event.env.KV.list as jest.Mock).mockImplementation(async () => ({
        list_complete: true,
        keys: [
          { name: "uuid:1", expiration: 1234567 },
          { name: "uuid:2", metadata: { v: "2021.1.2", i: "c" } },
        ],
      }));

      await handleSchedule(event, MockSentry);
      expect(MockFetch).not.toHaveBeenCalled();
      expect(event.env.KV.get).toHaveBeenCalledWith(KV_KEY_CORE_ANALYTICS, "json");
      expect(MockSentry.setTag).toHaveBeenCalledWith(
        "scheduled-task",
        "UPDATE_HISTORY"
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        "uuid:1",
        expect.any(String),
        expect.objectContaining({
          metadata: expect.objectContaining({ v: "123456" }),
        })
      );
    });
  });

  describe("PROCESS_QUEUE", function () {
    it("No queue - list 2000 (with pagination)", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.PROCESS_QUEUE },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(async () =>
        createQueueDefaults()
      );

      (event.env.KV.list as jest.Mock).mockImplementation(
        async (data: { prefix: string; cursor?: string }) => ({
          keys: Array.from({ length: 1000 }, (_, i) => ({ name: `uuid:${i}` })),
          cursor: "abc",
          list_complete: data.cursor !== undefined,
        })
      );

      await handleSchedule(event, MockSentry);

      expect(event.env.KV.get).toHaveBeenCalledWith(KV_KEY_QUEUE, "json");
      expect(event.env.KV.list).toHaveBeenCalledTimes(2);
      expect(MockSentry.setTag).toHaveBeenCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(event.env.KV.put).toHaveBeenCalledWith(KV_KEY_QUEUE, expect.any(String));
      // The queue, plus the refreshed HACS domain cache.
      expect(hacsCacheWrites(event)).toHaveLength(1);
      expect(event.env.KV.put).toHaveBeenCalledTimes(2);
    });

    it("Continue queue - 2000 entries left", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.PROCESS_QUEUE },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(
        async (key: string) => {
          if (key === KV_KEY_QUEUE) {
            return {
              schema_version: SCHEMA_VERSION_QUEUE,
              process_complete: false,
              entries: Array.from({ length: 2000 }, (_, i) => ({
                name: `uuid:${i}`,
              })),
              data: createQueueData(),
            };
          }

          return {};
        }
      );

      await handleSchedule(event, MockSentry);

      expect(event.env.KV.get).toHaveBeenCalledWith(KV_KEY_QUEUE, "json");
      expect(event.env.KV.list).not.toHaveBeenCalled();
      expect(MockSentry.setTag).toHaveBeenCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_QUEUE,
        expect.stringContaining('"process_complete":false')
      );
      // The queue, plus the refreshed HACS domain cache.
      expect(hacsCacheWrites(event)).toHaveLength(1);
      expect(event.env.KV.put).toHaveBeenCalledTimes(2);
    });

    it("Continue queue - 500 entries left", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.PROCESS_QUEUE },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(
        async (key: string) => {
          if (key === KV_KEY_QUEUE) {
            return {
              schema_version: SCHEMA_VERSION_QUEUE,
              process_complete: false,
              entries: Array.from({ length: 500 }, (_, i) => ({
                name: `uuid:${i}`,
              })),
              data: createQueueData(),
            };
          }

          return {
            integrations: ["core_valid"],
            custom_integrations: [
              { domain: "custom_invalid", version: "1.2.3" },
              { domain: "custom_valid", version: "1.2.3" },
              { domain: "hacs_valid", version: "1.2.3" },
            ],
            operating_system: {
              board: "invalid_board",
              version: "1.2.3",
            },
          };
        }
      );

      (event.env.KV.getWithMetadata as jest.Mock).mockResolvedValue(
        nothingCached
      );

      await handleSchedule(event, MockSentry);

      expect(event.env.KV.get).toHaveBeenCalledWith(KV_KEY_QUEUE, "json");
      expect(event.env.KV.list).not.toHaveBeenCalled();
      expect(MockSentry.setTag).toHaveBeenCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_QUEUE,
        expect.stringContaining('"process_complete":true')
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining("core_valid")
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.not.stringContaining("invalid_board")
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_ADDONS,
        expect.any(String)
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        '{"custom_valid":{"total":500,"versions":{"1.2.3":500}},' +
          '"hacs_valid":{"total":500,"versions":{"1.2.3":500}}}'
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        expect.stringContaining("history:"),
        expect.any(String)
      );
      const before = new Date().getTime();
      expect(storedHacsCache(event)).toEqual({
        refresh_after: expect.any(Number),
        domains: ["hacs_valid"],
      });
      expect(storedHacsCache(event).refresh_after).toBeGreaterThan(
        before + HACS_DOMAINS_MAX_AGE - 60_000
      );
      expect(MockFetch).toHaveBeenCalledTimes(4);
      expect(event.env.KV.put).toHaveBeenCalledTimes(6);
    });

    const hacsCacheEvent = (stored: {
      value: string | null;
      metadata: { refresh_after: number } | null;
    }) => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.PROCESS_QUEUE },
      });
      (event.env.KV.get as jest.Mock).mockImplementation(
        async (key: string) => {
          if (key === KV_KEY_QUEUE) {
            return {
              schema_version: SCHEMA_VERSION_QUEUE,
              process_complete: false,
              entries: [{ name: "uuid:1" }],
              data: createQueueData(),
            };
          }
          return {
            custom_integrations: [
              { domain: "custom_valid", version: "1.2.3" },
              { domain: "hacs_valid", version: "1.2.3" },
            ],
          };
        }
      );
      (event.env.KV.getWithMetadata as jest.Mock).mockImplementation(
        async (key: string) => {
          if (key === KV_KEY_HACS_DOMAINS) {
            return stored;
          }
          throw Error(`unexpected read of ${key}`);
        }
      );
      return event;
    };

    const fetchedUrls = () =>
      MockFetch.mock.calls.map(([url]: [string]) => url);

    const hacsDown = () => {
      (global as any).fetch = MockFetch = jest.fn(async (url: string) => ({
        ok: url !== HACS_INTEGRATIONS_URL,
        json: jest.fn(async () => ({
          core: ["core_valid"],
          custom: ["custom_valid"],
          hassos: { rpi: "" },
        })),
      }));
    };

    const expectRetryInAnHour = (event, domains: string[]) => {
      const now = new Date().getTime();
      const cache = storedHacsCache(event);
      expect(cache.domains).toEqual(domains);
      expect(cache.refresh_after).toBeGreaterThan(
        now + HACS_DOMAINS_RETRY_DELAY - 60_000
      );
      expect(cache.refresh_after).toBeLessThanOrEqual(
        now + HACS_DOMAINS_RETRY_DELAY
      );
    };

    const bothCounted =
      '{"custom_valid":{"total":1,"versions":{"1.2.3":1}},' +
      '"hacs_valid":{"total":1,"versions":{"1.2.3":1}}}';

    it("Cached HACS domains are still fresh - no refetch", async () => {
      const event = hacsCacheEvent(
        cachedList({
          refresh_after: new Date().getTime() + 60_000,
          domains: ["hacs_valid"],
        })
      );

      await handleSchedule(event, MockSentry);

      expect(fetchedUrls()).not.toContain(HACS_INTEGRATIONS_URL);
      expect(hacsCacheWrites(event)).toHaveLength(0);
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        bothCounted
      );
    });

    it("Cached HACS domains are stale and HACS is down - use the cache", async () => {
      const event = hacsCacheEvent(
        cachedList({
          refresh_after: new Date().getTime() - 1,
          domains: ["hacs_valid"],
        })
      );
      hacsDown();

      await handleSchedule(event, MockSentry);

      expect(fetchedUrls()).toContain(HACS_INTEGRATIONS_URL);
      expect(MockSentry.captureException).not.toHaveBeenCalled();
      expect(MockSentry.captureMessage).toHaveBeenCalledWith(
        "Could not get integration list from HACS (using the cached list)",
        "warning"
      );
      // The stale list is kept rather than overwritten with a worse one.
      expectRetryInAnHour(event, ["hacs_valid"]);
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        bothCounted
      );
    });

    it("HACS is down with nothing cached - keep processing on brands", async () => {
      const event = hacsCacheEvent(nothingCached);
      hacsDown();

      await handleSchedule(event, MockSentry);

      expect(MockSentry.captureException).not.toHaveBeenCalled();
      expect(MockSentry.captureMessage).toHaveBeenCalledWith(
        "Could not get integration list from HACS (using brands only)",
        "warning"
      );
      expectRetryInAnHour(event, []);
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        '{"custom_valid":{"total":1,"versions":{"1.2.3":1}}}'
      );
    });

    const malformedCaches = [
      ["not JSON", "{not json"],
      ["not a list", '{"refresh_after":1,"domains":["hacs_valid"]}'],
      ["not a list of domains", '["hacs_valid",1]'],
    ];

    it.each(malformedCaches)(
      "Cached HACS domains are malformed (%s) - refresh from HACS straight away",
      async (_, value) => {
        const event = hacsCacheEvent({
          value,
          metadata: { refresh_after: new Date().getTime() + 60_000 },
        });

        await handleSchedule(event, MockSentry);

        expect(event.env.KV.getWithMetadata).toHaveBeenCalledWith(
          KV_KEY_HACS_DOMAINS,
          "text"
        );
        expect(MockSentry.captureException).not.toHaveBeenCalled();
        expect(MockSentry.captureMessage).toHaveBeenCalledWith(
          "The cached HACS domains are malformed (refreshing from HACS)",
          "warning"
        );
        expect(fetchedUrls()).toContain(HACS_INTEGRATIONS_URL);
        expect(storedHacsCache(event).domains).toEqual(["hacs_valid"]);
        expect(event.env.KV.put).toHaveBeenCalledWith(
          KV_KEY_CUSTOM_INTEGRATIONS,
          bothCounted
        );
      }
    );

    it.each(malformedCaches)(
      "Cached HACS domains are malformed (%s) and HACS is down - replace them and retry in an hour",
      async (_, value) => {
        const event = hacsCacheEvent({
          value,
          metadata: { refresh_after: new Date().getTime() - 1 },
        });
        hacsDown();

        await handleSchedule(event, MockSentry);

        expect(MockSentry.captureException).not.toHaveBeenCalled();
        expect(MockSentry.captureMessage).toHaveBeenCalledWith(
          "Could not get integration list from HACS (using brands only)",
          "warning"
        );
        expectRetryInAnHour(event, []);
        expect(event.env.KV.put).toHaveBeenCalledWith(
          KV_KEY_CUSTOM_INTEGRATIONS,
          '{"custom_valid":{"total":1,"versions":{"1.2.3":1}}}'
        );
      }
    );

    it("Cached HACS domains have no retry time - refresh from HACS", async () => {
      const event = hacsCacheEvent({
        value: JSON.stringify(["hacs_valid"]),
        metadata: null,
      });

      await handleSchedule(event, MockSentry);

      expect(fetchedUrls()).toContain(HACS_INTEGRATIONS_URL);
      expect(MockSentry.captureMessage).not.toHaveBeenCalled();
      expect(storedHacsCache(event).domains).toEqual(["hacs_valid"]);
    });

    const hacsCacheWriteFails = (event) => {
      (event.env.KV.put as jest.Mock).mockImplementation(async (key: string) => {
        if (key === KV_KEY_HACS_DOMAINS) {
          throw Error("KV write failed");
        }
      });
    };

    it("Saving refreshed HACS domains fails - count them anyway", async () => {
      const event = hacsCacheEvent(
        cachedList({
          refresh_after: new Date().getTime() - 1,
          domains: [],
        })
      );
      hacsCacheWriteFails(event);

      await handleSchedule(event, MockSentry);

      expect(MockSentry.captureException).not.toHaveBeenCalled();
      expect(MockSentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(MockSentry.captureMessage).toHaveBeenCalledWith(
        "Could not cache the HACS domains: KV write failed",
        "warning"
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        bothCounted
      );
    });

    it("HACS is down and saving the retry time fails - keep processing", async () => {
      const event = hacsCacheEvent(
        cachedList({
          refresh_after: new Date().getTime() - 1,
          domains: ["hacs_valid"],
        })
      );
      hacsDown();
      hacsCacheWriteFails(event);

      await handleSchedule(event, MockSentry);

      expect(MockSentry.captureException).not.toHaveBeenCalled();
      expect(MockSentry.captureMessage).toHaveBeenCalledWith(
        "Could not cache the HACS domains: KV write failed",
        "warning"
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        bothCounted
      );
    });

    const hacsCacheReadFails = (event) => {
      (event.env.KV.getWithMetadata as jest.Mock).mockRejectedValue(
        Error("KV read failed")
      );
    };

    it("Reading the cached HACS domains fails - refresh from HACS and keep processing", async () => {
      const event = hacsCacheEvent(nothingCached);
      hacsCacheReadFails(event);

      await handleSchedule(event, MockSentry);

      expect(MockSentry.captureException).not.toHaveBeenCalled();
      expect(MockSentry.captureMessage).toHaveBeenCalledTimes(1);
      expect(MockSentry.captureMessage).toHaveBeenCalledWith(
        "Could not read the cached HACS domains: KV read failed",
        "warning"
      );
      expect(storedHacsCache(event).domains).toEqual(["hacs_valid"]);
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        bothCounted
      );
    });

    it("Reading the cached HACS domains fails and HACS is down - keep the cache as it is", async () => {
      const event = hacsCacheEvent(nothingCached);
      hacsCacheReadFails(event);
      hacsDown();

      await handleSchedule(event, MockSentry);

      expect(MockSentry.captureException).not.toHaveBeenCalled();
      expect(hacsCacheWrites(event)).toHaveLength(0);
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        '{"custom_valid":{"total":1,"versions":{"1.2.3":1}}}'
      );
    });

    // The time limit runs out straight away rather than after the real delay.
    const neverAnswers = (silentUrl: string) => {
      (global as any).fetch = MockFetch = jest.fn(
        (url: string, init?: RequestInit) =>
          url === silentUrl
            ? new Promise((_, reject) => {
                const signal = init?.signal;
                if (signal?.aborted) reject(signal.reason);
                signal?.addEventListener("abort", () => reject(signal.reason));
              })
            : Promise.resolve({
                ok: true,
                json: jest.fn(async () =>
                  url === HACS_INTEGRATIONS_URL
                    ? { "1234": { domain: "hacs_valid" } }
                    : {
                        core: ["core_valid"],
                        custom: ["custom_valid"],
                        hassos: { rpi: "" },
                      }
                ),
              })
      );
      return jest
        .spyOn(AbortSignal, "timeout")
        .mockImplementation(() => AbortSignal.abort());
    };

    it("HACS never answers - give up on it and use the cache", async () => {
      const event = hacsCacheEvent(
        cachedList({
          refresh_after: new Date().getTime() - 1,
          domains: ["hacs_valid"],
        })
      );
      const timeout = neverAnswers(HACS_INTEGRATIONS_URL);

      try {
        await handleSchedule(event, MockSentry);
        expect(timeout).toHaveBeenCalledWith(FETCH_TIMEOUT);
      } finally {
        timeout.mockRestore();
      }

      expect(MockSentry.captureException).not.toHaveBeenCalled();
      expect(MockSentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("(using the cached list)"),
        "warning"
      );
      expect(event.env.KV.put).toHaveBeenCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        bothCounted
      );
    });

    it("Brands never answers - give up and fail the run", async () => {
      const event = hacsCacheEvent(
        cachedList({
          refresh_after: new Date().getTime() + 60_000,
          domains: ["hacs_valid"],
        })
      );
      const timeout = neverAnswers(BRANDS_DOMAINS_URL);

      try {
        await handleSchedule(event, MockSentry);
      } finally {
        timeout.mockRestore();
      }

      expect(MockSentry.captureException).toHaveBeenCalledTimes(1);
      expect(event.env.KV.put).not.toHaveBeenCalledWith(
        KV_KEY_QUEUE,
        expect.any(String)
      );
    });

    it("Version is down - fail the run", async () => {
      const event = hacsCacheEvent(
        cachedList({
          refresh_after: new Date().getTime() + 60_000,
          domains: ["hacs_valid"],
        })
      );
      (global as any).fetch = MockFetch = jest.fn(async (url: string) => ({
        ok: url !== VERSION_URL,
        json: jest.fn(async () => ({
          core: ["core_valid"],
          custom: ["custom_valid"],
          hassos: { rpi: "" },
        })),
      }));

      await handleSchedule(event, MockSentry);

      expect(MockSentry.captureException).toHaveBeenCalledWith(
        Error("Could not get board list from version")
      );
      expect(event.env.KV.put).not.toHaveBeenCalledWith(
        KV_KEY_QUEUE,
        expect.any(String)
      );
    });

    it("Wait for reset", async () => {
      const event = MockedScheduledEvent({
        controller: { cron: ScheduledTask.PROCESS_QUEUE },
      });

      (event.env.KV.get as jest.Mock).mockImplementation(async () => ({
        entries: [],
        process_complete: true,
        schema_version: SCHEMA_VERSION_QUEUE,
      }));

      await handleSchedule(event, MockSentry);

      expect(event.env.KV.get).toHaveBeenCalledWith(KV_KEY_QUEUE, "json");
      expect(MockSentry.setTag).toHaveBeenCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(event.env.KV.put).not.toHaveBeenCalled();
      expect(event.env.KV.list).not.toHaveBeenCalled();

      expect(MockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: "Process complete, waiting for reset",
      });
    });
  });
});
