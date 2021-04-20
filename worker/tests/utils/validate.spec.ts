import { createIncomingPayload } from "../../src/utils/validate";

describe("createIncomingPayload", function () {
  let BASE_PAYLOAD;
  let ADDON;

  beforeEach(() => {
    BASE_PAYLOAD = {
      uuid: "12345678901234567890123456789012",
      installation_type: "Unknown",
      version: "1970.1.1",
    };

    ADDON = {
      slug: "test_addon",
      version: "1970.1.1",
      protected: true,
      auto_update: false,
    };
  });

  it("Missing UUID", function () {
    const payload = BASE_PAYLOAD;
    delete payload.uuid;
    expect(() => {
      createIncomingPayload(payload);
    }).toThrow("At path: uuid -- Expected a string, but received: undefined");
  });

  it("Wrong UUID", function () {
    expect(() => {
      createIncomingPayload({ ...BASE_PAYLOAD, uuid: "wrong" });
    }).toThrow(
      "At path: uuid -- Expected a string with a length of `32` but received one with a length of `5`"
    );
  });

  it("Wrong installation type", function () {
    expect(() => {
      createIncomingPayload({ ...BASE_PAYLOAD, installation_type: "wrong" });
    }).toThrow(
      'At path: installation_type -- Expected a value of type `HA_INSTALLATION_TYPE`, but received: `"wrong"`'
    );
  });

  it("Valid base payload", function () {
    const payload = createIncomingPayload(BASE_PAYLOAD);
    expect(payload.uuid).toBe(BASE_PAYLOAD.uuid);
    expect(payload.installation_type).toBe(BASE_PAYLOAD.installation_type);
    expect(payload.version).toBe(BASE_PAYLOAD.version);
  });

  it("Default true", function () {
    const payload = createIncomingPayload({
      ...BASE_PAYLOAD,
      addons: [{ ...ADDON, protected: null }],
    });
    expect(payload.addons[0].protected).toBe(true);
  });

  it("Default false", function () {
    const payload = createIncomingPayload({
      ...BASE_PAYLOAD,
      addons: [{ ...ADDON, auto_update: null }],
    });
    expect(payload.addons[0].auto_update).toBe(false);
  });
});
