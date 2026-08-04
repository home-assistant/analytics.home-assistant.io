import {
  createQueueData,
  createQueueDefaults,
  HACS_DOMAINS_MAX_AGE,
  HACS_INTEGRATIONS_URL,
  KV_KEY_ADDONS,
  KV_KEY_CORE_ANALYTICS,
  KV_KEY_CUSTOM_INTEGRATIONS,
  KV_KEY_HACS_DOMAINS,
  KV_KEY_QUEUE,
  ScheduledTask,
  SCHEMA_VERSION_ANALYTICS,
  SCHEMA_VERSION_QUEUE,
} from "../../src/data";
import { handleSchedule } from "../../src/handlers/schedule";
import { MockedConsole, MockedScheduledEvent, MockedSentry } from "../mock";

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
      expect(MockSentry.captureException).toBeCalledWith(
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

      expect(event.env.KV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(MockSentry.setTag).toBeCalledWith("scheduled-task", "RESET_QUEUE");
      expect(event.env.KV.put).toBeCalledTimes(0);
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
      expect(event.env.KV.put).toBeCalledTimes(1);
      expect(event.env.KV.put).toBeCalledWith(
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

      expect(event.env.KV.get).toBeCalledWith(KV_KEY_CORE_ANALYTICS, "json");
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "UPDATE_HISTORY"
      );
      expect(event.env.KV.put).toBeCalledTimes(1);
      expect(event.env.KV.put).toBeCalledWith(
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

      expect(event.env.KV.get).toBeCalledWith(KV_KEY_CORE_ANALYTICS, "json");
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "UPDATE_HISTORY"
      );

      expect(event.env.KV.put).toBeCalledTimes(1);
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining('"extended_data_from":3')
      );
      expect(event.env.KV.put).toBeCalledWith(
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
      expect(MockFetch).not.toBeCalled();
      expect(event.env.KV.get).toBeCalledWith(KV_KEY_CORE_ANALYTICS, "json");
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "UPDATE_HISTORY"
      );
      expect(event.env.KV.put).toBeCalledWith(
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

      expect(event.env.KV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(event.env.KV.list).toBeCalledTimes(2);
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(event.env.KV.put).toBeCalledWith(KV_KEY_QUEUE, expect.any(String));
      // The queue, plus the refreshed HACS domain cache.
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_HACS_DOMAINS,
        expect.any(String)
      );
      expect(event.env.KV.put).toBeCalledTimes(2);
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

      expect(event.env.KV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(event.env.KV.list).not.toBeCalled();
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_QUEUE,
        expect.stringContaining('"process_complete":false')
      );
      // The queue, plus the refreshed HACS domain cache.
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_HACS_DOMAINS,
        expect.any(String)
      );
      expect(event.env.KV.put).toBeCalledTimes(2);
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
          if (key === KV_KEY_HACS_DOMAINS) {
            return null;
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

      await handleSchedule(event, MockSentry);

      expect(event.env.KV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(event.env.KV.list).not.toBeCalled();
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_QUEUE,
        expect.stringContaining('"process_complete":true')
      );
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining("core_valid")
      );
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.not.stringContaining("invalid_board")
      );
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_ADDONS,
        expect.any(String)
      );
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        '{"custom_valid":{"total":500,"versions":{"1.2.3":500}},' +
          '"hacs_valid":{"total":500,"versions":{"1.2.3":500}}}'
      );
      expect(event.env.KV.put).toBeCalledWith(
        expect.stringContaining("history:"),
        expect.any(String)
      );
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_HACS_DOMAINS,
        expect.stringContaining('"domains":["hacs_valid"]')
      );
      expect(MockFetch).toBeCalledTimes(4);
      expect(event.env.KV.put).toBeCalledTimes(6);
    });

    // The HACS domain list is refreshed at most once a day and cached in KV,
    // so these cover the cache being fresh, and HACS being unreachable with
    // and without something cached to fall back on.
    const hacsCacheEvent = (hacsCache: any) => {
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
          if (key === KV_KEY_HACS_DOMAINS) {
            return hacsCache;
          }

          return {
            custom_integrations: [
              { domain: "custom_valid", version: "1.2.3" },
              { domain: "hacs_valid", version: "1.2.3" },
            ],
          };
        }
      );
      return event;
    };

    const bothCounted =
      '{"custom_valid":{"total":1,"versions":{"1.2.3":1}},' +
      '"hacs_valid":{"total":1,"versions":{"1.2.3":1}}}';

    it("Cached HACS domains are still fresh - no refetch", async () => {
      const event = hacsCacheEvent({
        last_updated: new Date().getTime(),
        domains: ["hacs_valid"],
      });

      await handleSchedule(event, MockSentry);

      expect(MockFetch).not.toBeCalledWith(HACS_INTEGRATIONS_URL);
      expect(event.env.KV.put).not.toBeCalledWith(
        KV_KEY_HACS_DOMAINS,
        expect.any(String)
      );
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        bothCounted
      );
    });

    it("Cached HACS domains are stale and HACS is down - use the cache", async () => {
      const event = hacsCacheEvent({
        last_updated: new Date().getTime() - HACS_DOMAINS_MAX_AGE - 1,
        domains: ["hacs_valid"],
      });
      (global as any).fetch = MockFetch = jest.fn(async (url: string) => ({
        ok: url !== HACS_INTEGRATIONS_URL,
        json: jest.fn(async () => ({
          core: ["core_valid"],
          custom: ["custom_valid"],
          hassos: { rpi: "" },
        })),
      }));

      await handleSchedule(event, MockSentry);

      expect(MockFetch).toBeCalledWith(HACS_INTEGRATIONS_URL);
      expect(MockSentry.captureException).not.toBeCalled();
      expect(MockSentry.captureMessage).toBeCalledWith(
        "Could not get integration list from HACS (using the cached list)",
        "warning"
      );
      // The stale cache is kept rather than overwritten with a worse one.
      expect(event.env.KV.put).not.toBeCalledWith(
        KV_KEY_HACS_DOMAINS,
        expect.any(String)
      );
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        bothCounted
      );
    });

    it("HACS is down with nothing cached - keep processing on brands", async () => {
      const event = hacsCacheEvent(null);
      (global as any).fetch = MockFetch = jest.fn(async (url: string) => ({
        ok: url !== HACS_INTEGRATIONS_URL,
        json: jest.fn(async () => ({
          core: ["core_valid"],
          custom: ["custom_valid"],
          hassos: { rpi: "" },
        })),
      }));

      await handleSchedule(event, MockSentry);

      expect(MockSentry.captureException).not.toBeCalled();
      expect(MockSentry.captureMessage).toBeCalledWith(
        "Could not get integration list from HACS (using brands only)",
        "warning"
      );
      expect(event.env.KV.put).toBeCalledWith(
        KV_KEY_CUSTOM_INTEGRATIONS,
        '{"custom_valid":{"total":1,"versions":{"1.2.3":1}}}'
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

      expect(event.env.KV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(event.env.KV.put).not.toBeCalled();
      expect(event.env.KV.list).not.toBeCalled();

      expect(MockSentry.addBreadcrumb).toBeCalledWith({
        message: "Process complete, waiting for reset",
      });
    });
  });
});
