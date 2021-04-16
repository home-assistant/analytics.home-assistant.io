import {
  array,
  create,
  boolean,
  coerce,
  define,
  is,
  nullable,
  number,
  object,
  optional,
  size,
  string,
  defaulted,
  record,
  StructError,
} from "superstruct";
import { IncomingPayload, InstallationTypes, QueueData } from "../data";

class ValidationError extends Error {
  constructor(error: StructError) {
    super(error.message);
    this.name = `ValidationError - ${error.message}`;
  }
}

const is_ha_installation_type = define<string>("HA_INSTALLATION_TYPE", (
  value
) => is(value, string()) && value in InstallationTypes);

const defaultFalse = coerce(boolean(), nullable(boolean()), (value) =>
  value === null ? false : value
);

const defaultTrue = coerce(boolean(), nullable(boolean()), (value) =>
  value === null ? true : value
);

export const IncomingPayloadStruct = object({
  addon_count: optional(number()),
  addons: optional(
    array(
      object({
        slug: string(),
        protected: defaultTrue,
        version: optional(nullable(string())),
        auto_update: defaultFalse,
      })
    )
  ),
  automation_count: optional(number()),
  country: optional(size(string(), 2, 2)),
  region: optional(size(string(), 2, 2)),
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

export const createIncomingPayload = (data: unknown): IncomingPayload => {
  try {
    return create(data, IncomingPayloadStruct);
  } catch (e) {
    throw new ValidationError(e);
  }
};

const QueueDataStruct = object({
  reports_integrations: defaulted(number(), 0),
  reports_statistics: defaulted(number(), 0),
  versions: defaulted(record(string(), number()), {}),
  countries: defaulted(record(string(), number()), {}),
  installation_types: defaulted(
    object({
      os: defaulted(number(), 0),
      container: defaulted(number(), 0),
      core: defaulted(number(), 0),
      supervised: defaulted(number(), 0),
      unknown: defaulted(number(), 0),
    }),
    {
      os: 0,
      container: 0,
      core: 0,
      supervised: 0,
      unknown: 0,
    }
  ),
  integrations: defaulted(record(string(), number()), {}),
  count_addons: defaulted(array(number()), []),
  count_automations: defaulted(array(number()), []),
  count_integrations: defaulted(array(number()), []),
  count_states: defaulted(array(number()), []),
  count_users: defaulted(array(number()), []),
});

export const createQueueData = (data: unknown): QueueData => {
  try {
    return create(data, QueueDataStruct);
  } catch (e) {
    throw new ValidationError(e);
  }
};
