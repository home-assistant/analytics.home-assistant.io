import { KV_KEY_QUEUE, ScheduledTask } from "../../src/data";
import { handleSchedule } from "../../src/handlers/schedule";

const BaseEvent = {
  type: "cron",
  scheduledTime: 0,
  waitUntil: () => ({}),
};

describe("schedule handler", function () {
  let MockSentry;
  let MockKV;

  beforeEach(() => {
    MockSentry = {
      addBreadcrumb: jest.fn(),
      setUser: jest.fn(),
      setTag: jest.fn(),
      setExtra: jest.fn(),
      captureException: jest.fn(),
    };
    MockKV = {
      put: jest.fn(async () => {}),
      get: jest.fn(async () => {}),
      list: jest.fn(async () => {}),
      getWithMetadata: jest.fn(async () => {}),
    };
    (global as any).KV = MockKV;
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
  });
});
