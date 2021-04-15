import {
  array,
  assert,
  boolean,
  define,
  is,
  nullable,
  number,
  object,
  optional,
  size,
  string,
} from "superstruct";
import { InstallationTypes } from "../data";

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const is_ha_installation_type = define<string>("HA_INSTALLATION_TYPE", (
  value
) => is(value, string()) && value in InstallationTypes);

export const IncomingPayload = object({
  addon_count: optional(number()),
  addons: optional(
    array(
      object({
        slug: string(),
        protected: boolean(),
        version: optional(nullable(string())),
        auto_update: boolean(),
      })
    )
  ),
  automation_count: optional(number()),
  country: size(string(), 2, 5),
  custom_integrations: optional(
    array(object({ domain: string(), version: optional(nullable(string())) }))
  ),
  installation_type: is_ha_installation_type,
  integration_count: optional(number()),
  integrations: optional(array(string())),
  state_count: optional(number()),
  supervisor: optional(object({ supported: boolean(), healthy: boolean() })),
  user_count: optional(number()),
  uuid: size(string(), 32, 32),
  version: size(string(), 7, 22),
});

export const assertIncomingPayload = (data: unknown) => {
  try {
    assert(data, IncomingPayload);
  } catch (e) {
    throw new ValidationError(e);
  }
};
