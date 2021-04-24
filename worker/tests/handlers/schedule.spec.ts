import {
  createQueueData,
  createQueueDefaults,
  KV_KEY_CORE_ANALYTICS,
  KV_KEY_QUEUE,
  ScheduledTask,
  SCHEMA_VERSION_ANALYTICS,
  SCHEMA_VERSION_QUEUE,
} from "../../src/data";
import { handleSchedule } from "../../src/handlers/schedule";
import { MockedKV, MockedSentry } from "../mock";

const BaseEvent = {
  type: "cron",
  scheduledTime: 0,
  waitUntil: () => ({}),
};

describe("schedule handler", function () {
  let MockSentry;
  let MockKV;
  let MockFetch;

  beforeEach(() => {
    MockSentry = MockedSentry();
    (global as any).KV = MockKV = MockedKV();
    (global as any).fetch = MockFetch = jest.fn(async () => ({ ok: true }));
    (global as any).NETLIFY_BUILD_HOOK = "";
  });

  describe("Unexpected task", function () {
    const event = { ...BaseEvent, cron: "test" };
    it("Unexpected cron trigger", async () => {
      await handleSchedule(event, MockSentry);
      expect(MockSentry.captureException).toBeCalledWith(
        Error("Unexpected schedule task: test")
      );
    });
  });

  describe("RESET_QUEUE", function () {
    const event = { ...BaseEvent, cron: ScheduledTask.RESET_QUEUE };
    it("Not ready to reset", async () => {
      MockKV.get = jest.fn(async () => ({
        process_complete: false,
        entries: [],
      }));

      await handleSchedule(event, MockSentry);

      expect(MockKV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(MockSentry.setTag).toBeCalledWith("scheduled-task", "RESET_QUEUE");
      expect(MockKV.put).toBeCalledTimes(0);
    });

    it("Queue handing is done, reset queue", async () => {
      MockKV.get = jest.fn(async () => ({
        process_complete: true,
        entries: [],
      }));

      await handleSchedule(event, MockSentry);
      expect(MockKV.put).toBeCalledTimes(1);
      expect(MockKV.put).toBeCalledWith(
        KV_KEY_QUEUE,
        JSON.stringify(createQueueDefaults())
      );
    });
  });

  describe("UPDATE_HISTORY", function () {
    const event = { ...BaseEvent, cron: ScheduledTask.UPDATE_HISTORY };
    it("With migration", async () => {
      MockKV.get = jest.fn(async () => ({
        "1234": { active_installations: 3 },
      }));

      MockKV.list = jest.fn(async () => ({
        list_complete: true,
        keys: [
          { name: "uuid:1", metadata: { v: "2021.1.1", i: "o" } },
          { name: "uuid:2", metadata: { v: "2021.1.2", i: "c" } },
        ],
      }));

      await handleSchedule(event, MockSentry);

      expect(MockKV.get).toBeCalledWith(KV_KEY_CORE_ANALYTICS, "json");
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "UPDATE_HISTORY"
      );
      expect(MockKV.put).toBeCalledTimes(1);
      expect(MockKV.put).toBeCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining('"extended_data_from":3')
      );
    });

    it("Update history and partial current", async () => {
      MockKV.get = jest.fn(async () => ({
        current: { extended_data_from: 3 },
        history: [],
        schema_version: SCHEMA_VERSION_ANALYTICS,
      }));

      MockKV.list = jest.fn(async () => ({
        list_complete: true,
        keys: [
          { name: "uuid:1", metadata: { v: "2021.1.1", i: "o" } },
          { name: "uuid:2", metadata: { v: "2021.1.2", i: "c" } },
          { name: "uuid:3", metadata: { v: "2021.1.2", i: "c" } },
          { name: "uuid:4", metadata: { v: "2021.1.2", i: "c" } },
        ],
      }));

      await handleSchedule(event, MockSentry);

      expect(MockKV.get).toBeCalledWith(KV_KEY_CORE_ANALYTICS, "json");
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "UPDATE_HISTORY"
      );
      expect(MockKV.put).toBeCalledTimes(1);
      expect(MockKV.put).toBeCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining('"extended_data_from":3')
      );
      expect(MockKV.put).toBeCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.stringContaining('"active_installations":4')
      );
    });
  });

  describe("PROCESS_QUEUE", function () {
    const event = { ...BaseEvent, cron: ScheduledTask.PROCESS_QUEUE };
    it("No queue - list 2000 (with pagination)", async () => {
      MockKV.get = jest.fn(async () => createQueueDefaults());

      MockKV.list = jest.fn(
        async (data: { prefix: string; cursor?: string }) => ({
          keys: Array.from({ length: 1000 }, (_, i) => ({ name: `uuid:${i}` })),
          cursor: "abc",
          list_complete: data.cursor !== undefined,
        })
      );

      await handleSchedule(event, MockSentry);

      expect(MockKV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(MockKV.list).toBeCalledTimes(2);
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(MockKV.put).toBeCalledWith(KV_KEY_QUEUE, expect.any(String));
      expect(MockKV.put).toBeCalledTimes(1);
    });

    it("Continue queue - 2000 entries left", async () => {
      MockKV.get = jest.fn(async (key: string) => {
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
      });

      await handleSchedule(event, MockSentry);

      expect(MockKV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(MockKV.list).not.toBeCalled();
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(MockKV.put).toBeCalledWith(
        KV_KEY_QUEUE,
        expect.stringContaining('"process_complete":false')
      );
      expect(MockKV.put).toBeCalledTimes(1);
    });

    it("Continue queue - 500 entries left", async () => {
      MockKV.get = jest.fn(async (key: string) => {
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

        return {};
      });

      await handleSchedule(event, MockSentry);

      expect(MockKV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(MockKV.list).not.toBeCalled();
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(MockKV.put).toBeCalledWith(
        KV_KEY_QUEUE,
        expect.stringContaining('"process_complete":true')
      );
      expect(MockKV.put).toBeCalledWith(
        KV_KEY_CORE_ANALYTICS,
        expect.any(String)
      );
      expect(MockKV.put).toBeCalledWith(
        expect.stringContaining("history:"),
        expect.any(String)
      );
      expect(MockFetch).toBeCalledTimes(1);
      expect(MockKV.put).toBeCalledTimes(3);
    });

    it("Wait for reset", async () => {
      MockKV.get = jest.fn(async () => ({
        entries: [],
        process_complete: true,
        schema_version: SCHEMA_VERSION_QUEUE,
      }));

      await handleSchedule(event, MockSentry);

      expect(MockKV.get).toBeCalledWith(KV_KEY_QUEUE, "json");
      expect(MockSentry.setTag).toBeCalledWith(
        "scheduled-task",
        "PROCESS_QUEUE"
      );

      expect(MockKV.put).not.toBeCalled();
      expect(MockKV.list).not.toBeCalled();

      expect(MockSentry.addBreadcrumb).toBeCalledWith({
        message: "Process complete, waiting for reset",
      });
    });
  });
});
