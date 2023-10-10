import {
  createQueueData,
  createQueueDefaults,
  KV_KEY_ADDONS,
  KV_KEY_CORE_ANALYTICS,
  KV_KEY_CUSTOM_INTEGRATIONS,
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
    (global as any).fetch = MockFetch = jest.fn(async () => ({
      ok: true,
      json: jest.fn(async () => ({
        core: ["core_valid"],
        custom: ["custom_valid"],
        hassos: { rpi: "" },
      })),
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
      expect(event.env.KV.put).toBeCalledTimes(1);
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
      expect(event.env.KV.put).toBeCalledTimes(1);
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
        '{"custom_valid":{"total":500,"versions":{"1.2.3":500}}}'
      );
      expect(event.env.KV.put).toBeCalledWith(
        expect.stringContaining("history:"),
        expect.any(String)
      );
      expect(MockFetch).toBeCalledTimes(3);
      expect(event.env.KV.put).toBeCalledTimes(5);
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
