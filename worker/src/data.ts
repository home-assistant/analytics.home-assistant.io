export const KV_KEY_QUEUE = "queue";
export const KV_KEY_CORE_ANALYTICS = "core_analytics";
export const KV_PREFIX_HISTORY = "history";
export const KV_PREFIX_UUID = "uuid";
export const KV_MAX_PROCESS_ENTRIES = 850;

export interface Metadata {
  created: number;
  updated: number;
  version: string;
  installation_type: string;
  country?: string;
  extra: boolean;
}

export interface ListEntry {
  metadata?: Metadata | unknown;
  name: string;
  expiration?: number;
}

export interface QueueData {
  reports_integrations: number;
  reports_statistics: number;
  versions: Record<string, number>;
  countries: Record<string, number>;
  installation_types: { os: 0; container: 0; core: 0; supervised: 0 };
  integrations: Record<string, number>;
  count_addons: number[];
  count_automations: number[];
  count_integrations: number[];
  count_states: number[];
  count_users: number[];
}

export interface Queue {
  entries: string[];
  data: QueueData;
}

export interface SanitizedPayload {
  version: string;
  country?: string;
  installation_type: string;
  integrations?: string[];
  custom_integrations?: { domain: string; version: string | null }[];
  addons?: { slug: string }[];
  last_write?: number;
  state_count?: number;
  addon_count?: number;
  automation_count?: number;
  integration_count?: number;
  user_count?: number;
}

const BasePayloadKeys = [
  "country",
  "installation_type",
  "supervisor",
  "version",
];

export const AllowedPayloadKeys = BasePayloadKeys.concat([
  "addon_count",
  "addons",
  "automation_count",
  "custom_integrations",
  "integration_count",
  "integrations",
  "last_write",
  "state_count",
  "user_count",
]);

export const InstallationTypes = [
  "Home Assistant OS",
  "Home Assistant Container",
  "Home Assistant Core",
  "Home Assistant Supervised",
];

export const createQueueData = (): QueueData => ({
  reports_integrations: 0,
  reports_statistics: 0,
  versions: {},
  countries: {},
  installation_types: { os: 0, container: 0, core: 0, supervised: 0 },
  integrations: {},
  count_addons: [],
  count_automations: [],
  count_integrations: [],
  count_states: [],
  count_users: [],
});

export const generateMetadata = (
  payload: SanitizedPayload,
  timestamp: number,
  metadata?: Metadata | null
): Metadata => ({
  created: metadata ? metadata.created : timestamp,
  updated: timestamp,
  installation_type: payload.installation_type,
  version: payload.version,
  country: payload.country,
  extra: Object.keys(payload).some((key) => BasePayloadKeys.includes(key)),
});

export const bumpValue = (current?: number): number =>
  !current ? 1 : current + 1;

export function isMetadata(metadata: unknown): metadata is Metadata {
  return (<Metadata>metadata).extra !== undefined;
}
