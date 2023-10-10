import { handlePost } from "../../src/handlers/post";
import {
  BASE_PAYLOAD,
  MockedConsole,
  MockedFetchEvent,
  MockedSentry,
} from "../mock";

class MockResponse {}

describe("post handler", function () {
  let MockSentry;

  beforeEach(() => {
    MockSentry = MockedSentry();
    (global as any).console = MockedConsole();
    (global as any).Response = MockResponse;
  });

  it("First interaction", async () => {
    const event = MockedFetchEvent({});
    await handlePost(event, MockSentry);
    expect(event.env.KV.getWithMetadata).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      "json"
    );
    expect(MockSentry.addBreadcrumb).toBeCalledWith({
      message: "First contact for UUID, store payload",
    });
    expect(event.env.KV.put).toBeCalledTimes(1);
  });

  it("Time has passed", async () => {
    const event = MockedFetchEvent({});

    (event.env.KV.getWithMetadata as jest.Mock).mockImplementation(
      async () => ({
        value: { ...BASE_PAYLOAD, country: "XX" },
        metadata: { u: 161892932 },
      })
    );

    await handlePost(event, MockSentry);
    expect(event.env.KV.getWithMetadata).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      "json"
    );
    expect(MockSentry.addBreadcrumb).toBeCalledWith(
      expect.objectContaining({
        message: "Threshold has passed, update stored data",
      })
    );
    expect(event.env.KV.put).toBeCalledTimes(1);
  });

  it("Data changed", async () => {
    const event = MockedFetchEvent({
      payload: {
        installation_type: "Home Assistant OS",
        integrations: ["awesome"],
        integration_count: 1,
        addons: [
          {
            slug: "test_addon",
            version: "1970.1.1",
            protected: true,
            auto_update: false,
          },
        ],
      },
    });

    (event.env.KV.getWithMetadata as jest.Mock).mockImplementation(
      async () => ({
        value: { ...BASE_PAYLOAD },
      })
    );

    await handlePost(event, MockSentry);
    expect(event.env.KV.getWithMetadata).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      "json"
    );
    expect(MockSentry.addBreadcrumb).toBeCalledWith({
      message: "Payload changed, update stored data",
    });
    expect(event.env.KV.put).toBeCalledTimes(1);
    expect(event.env.KV.put).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      expect.any(String),
      expect.objectContaining({
        metadata: expect.objectContaining({
          v: BASE_PAYLOAD.version,
          c: "XX",
          i: "o",
          e: ["i", "a", "s"],
        }),
      })
    );
  });

  it("Nothing changed, time has not passed", async () => {
    const event = MockedFetchEvent({});
    (event.env.KV.getWithMetadata as jest.Mock).mockImplementation(
      async () => ({
        value: { ...BASE_PAYLOAD, country: "XX" },
        metadata: { u: new Date().getTime() },
      })
    );

    await handlePost(event, MockSentry);
    expect(event.env.KV.getWithMetadata).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      "json"
    );

    expect(event.env.KV.put).toBeCalledTimes(0);
  });
});
