import { handlePost } from "../../src/handlers/post";

class MockResponse {}

const BASE_PAYLOAD = {
  uuid: "12345678901234567890123456789012",
  installation_type: "Unknown",
  version: "1970.1.1",
};

describe("post handler", function () {
  let MockRequest;
  let MockSentry;
  let MockKV;

  beforeEach(() => {
    MockSentry = {
      addBreadcrumb: jest.fn(),
      setUser: jest.fn(),
      setExtras: jest.fn(),
    };
    MockRequest = {
      json: async () => ({ ...BASE_PAYLOAD }),
      cf: { country: "XX" },
    };
    MockKV = {
      put: jest.fn(async () => {}),
      getWithMetadata: jest.fn(async () => {}),
    };
    (global as any).Response = MockResponse;
    (global as any).KV = MockKV;
  });

  it("First interaction", async () => {
    await handlePost(MockRequest, MockSentry);
    expect(MockKV.getWithMetadata).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      "json"
    );
    expect(MockSentry.addBreadcrumb).toBeCalledWith({
      message: "First contact for UUID, store payload",
    });
    expect(MockKV.put).toBeCalledTimes(1);
  });

  it("Time has passed", async () => {
    MockKV.getWithMetadata = jest.fn(async () => ({
      value: { ...BASE_PAYLOAD, country: "XX" },
      metadata: { u: 161892932 },
    }));

    await handlePost(MockRequest, MockSentry);
    expect(MockKV.getWithMetadata).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      "json"
    );
    expect(MockSentry.addBreadcrumb).toBeCalledWith(
      expect.objectContaining({
        message: "Threshold has passed, update stored data",
      })
    );
    expect(MockKV.put).toBeCalledTimes(1);
  });

  it("Data changed", async () => {
    MockKV.getWithMetadata = jest.fn(async () => ({
      value: { ...BASE_PAYLOAD },
    }));
    MockRequest.json = async () => ({
      ...BASE_PAYLOAD,
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
    });

    await handlePost(MockRequest, MockSentry);
    expect(MockKV.getWithMetadata).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      "json"
    );
    expect(MockSentry.addBreadcrumb).toBeCalledWith({
      message: "Payload changed, update stored data",
    });
    expect(MockKV.put).toBeCalledTimes(1);
    expect(MockKV.put).toBeCalledWith(
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
    MockKV.getWithMetadata = jest.fn(async () => ({
      value: { ...BASE_PAYLOAD, country: "XX" },
      metadata: { u: new Date().getTime() },
    }));

    await handlePost(MockRequest, MockSentry);
    expect(MockKV.getWithMetadata).toBeCalledWith(
      "uuid:12345678901234567890123456789012",
      "json"
    );

    expect(MockKV.put).toBeCalledTimes(0);
  });
});
