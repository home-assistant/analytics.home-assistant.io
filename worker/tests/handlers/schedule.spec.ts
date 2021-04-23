import {
  createQueueDefaults,
  KV_KEY_QUEUE,
  ScheduledTask,
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
  beforeEach(() => {
    MockSentry = MockedSentry();
    (global as any).KV = MockKV = MockedKV();
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
});
