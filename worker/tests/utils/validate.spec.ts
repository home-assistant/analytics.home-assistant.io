import { string } from "superstruct";
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

  it("Too many integrations", function () {
    expect(() => {
      createIncomingPayload({
        ...BASE_PAYLOAD,
        integrations: Array.from({ length: 1000 }, (_, i) => String(i)),
      });
    }).toThrow(
      /At path: integrations -- Expected a value of type `INTEGRATIONS`/
    );
  });

  it("Valid base payload", function () {
    const payload = createIncomingPayload(BASE_PAYLOAD);
    expect(payload.uuid).toBe(BASE_PAYLOAD.uuid);
    expect(payload.installation_type).toBe(BASE_PAYLOAD.installation_type);
    expect(payload.version).toBe(BASE_PAYLOAD.version);
  });

  it("Valid full payload", function () {
    const payload = {
      ...BASE_PAYLOAD,
      addon_count: 1,
      addons: [ADDON],
      automation_count: 1,
      country: "XX",
      custom_integrations: [{ domain: "awesome_custom", version: null }],
      integration_count: 1,
      integrations: ["awesome"],
      operating_system: { board: "blue", version: "123" },
      region: "XX",
      state_count: 1,
      energy: { configured: true },
      recorder: { engine: "Awesome_Engine", version: "123" },
      supervisor: { healthy: false, supported: true, arch: "amd64" },
      user_count: 1,
      certificate: true,
    };
    const fullPayload = createIncomingPayload(payload);
    expect(fullPayload.uuid).toBe(BASE_PAYLOAD.uuid);
    expect(fullPayload.installation_type).toBe(BASE_PAYLOAD.installation_type);
    expect(fullPayload.version).toBe(BASE_PAYLOAD.version);
    expect(fullPayload.energy!.configured).toBeTruthy();
    expect(fullPayload.recorder!.engine).toBe("awesome_engine");
    expect(fullPayload.recorder!.version).toBe("123");

    const payloadWithoutArch = createIncomingPayload({
      ...payload,
      supervisor: { healthy: false, supported: true },
    });

    expect(payloadWithoutArch.supervisor!.arch).not.toBeDefined();
  });

  it("Default true", function () {
    const payload = createIncomingPayload({
      ...BASE_PAYLOAD,
      addons: [{ ...ADDON, protected: null }],
    });
    expect(payload.addons![0].protected).toBe(true);
  });

  it("Default false", function () {
    const payload = createIncomingPayload({
      ...BASE_PAYLOAD,
      addons: [{ ...ADDON, auto_update: null }],
    });
    expect(payload.addons![0].auto_update).toBe(false);
  });
});
