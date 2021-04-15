export const KV_KEY_QUEUE = "queue";
export const KV_KEY_CORE_ANALYTICS = "core_analytics";
export const KV_PREFIX_HISTORY = "history";
export const KV_PREFIX_UUID = "uuid";
export const KV_MAX_PROCESS_ENTRIES = 850;

export enum UuidMetadataKey {
  ADDED = "a",
  COUNTRY = "c",
  EXTRA = "e",
  INSTALLATION_TYPE = "i",
  UPDATED = "u",
  REGION = "r",
  VERSION = "v",
}

export enum ShortInstallationType {
  CORE = "c",
  CONTAINER = "d",
  OS = "o",
  SUPERVISED = "s",
}

export enum MetadataExtra {
  INTEGRATIONS = "i",
  STATISTICS = "s",
  ADDONS = "a",
}

export interface UuidMetadata {
  [UuidMetadataKey.ADDED]: number;
  [UuidMetadataKey.UPDATED]: number;
  [UuidMetadataKey.VERSION]: string;
  [UuidMetadataKey.INSTALLATION_TYPE]: ShortInstallationType;
  [UuidMetadataKey.COUNTRY]?: string;
  [UuidMetadataKey.REGION]?: string;
  [UuidMetadataKey.EXTRA]: MetadataExtra[];
}

export interface ListEntry {
  metadata?: UuidMetadata;
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

export interface IncomingPayload {
  addon_count?: number;
  addons?: { slug: string }[];
  automation_count?: number;
  country?: string;
  region?: string;
  custom_integrations?: { domain: string; version: string | null }[];
  installation_type: string;
  integration_count?: number;
  integrations?: string[];
  last_write?: number;
  state_count?: number;
  user_count?: number;
  version: string;
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

export const InstallationTypes: Record<string, ShortInstallationType> = {
  "Home Assistant OS": ShortInstallationType.OS,
  "Home Assistant Container": ShortInstallationType.CONTAINER,
  "Home Assistant Core": ShortInstallationType.CORE,
  "Home Assistant Supervised": ShortInstallationType.SUPERVISED,
};

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

export const generateUuidMetadata = (
  payload: IncomingPayload,
  updated: number,
  metadata?: UuidMetadata | null
): UuidMetadata => {
  const extra: MetadataExtra[] = [];

  if (payload.integrations) {
    extra.push(MetadataExtra.INTEGRATIONS);
  }
  if (payload.addons) {
    extra.push(MetadataExtra.ADDONS);
  }
  if (payload.integration_count) {
    extra.push(MetadataExtra.STATISTICS);
  }

  return {
    [UuidMetadataKey.UPDATED]: updated,
    [UuidMetadataKey.ADDED]: metadata
      ? metadata[UuidMetadataKey.ADDED]
      : updated,
    [UuidMetadataKey.INSTALLATION_TYPE]:
      InstallationTypes[payload.installation_type],
    [UuidMetadataKey.COUNTRY]: payload.country,
    [UuidMetadataKey.REGION]: payload.region,
    [UuidMetadataKey.VERSION]: payload.version,
    [UuidMetadataKey.EXTRA]: extra,
  };
};

export const bumpValue = (current?: number): number =>
  !current ? 1 : current + 1;
