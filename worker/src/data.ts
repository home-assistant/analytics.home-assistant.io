export const KV_KEY_QUEUE = "queue";
export const KV_KEY_CORE_ANALYTICS = "core_analytics";
export const KV_KEY_CUSTOM_INTEGRATIONS = "custom_integrations";
export const KV_KEY_ADDONS = "addons";
export const KV_PREFIX_HISTORY = "history";
export const KV_PREFIX_UUID = "uuid";
export const KV_MAX_PROCESS_ENTRIES = 850;

export const SCHEMA_VERSION_QUEUE = 5;
export const SCHEMA_VERSION_ANALYTICS = 2;

export const BRANDS_DOMAINS_URL =
  "https://brands.home-assistant.io/domains.json";
export const VERSION_URL = "https://version.home-assistant.io/dev.json";

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
  UNKNOWN = "u",
}

export enum MetadataExtra {
  INTEGRATIONS = "i",
  STATISTICS = "s",
  ADDONS = "a",
}

export enum ScheduledTask {
  PROCESS_QUEUE = "*/2 * * * *",
  RESET_QUEUE = "5 0 * * *",
  UPDATE_HISTORY = "0 * * * *",
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
  addons: Record<
    string,
    {
      total: number;
      versions: Record<string, number>;
      protected: number;
      auto_update: 0;
    }
  >;
  custom_integrations: Record<
    string,
    { total: number; versions: Record<string, number> }
  >;
  reports_integrations: number;
  reports_statistics: number;
  versions: Record<string, number>;
  countries: Record<string, number>;
  installation_types: {
    os: number;
    container: number;
    core: number;
    supervised: number;
    unknown: number;
  };
  supervisor: {
    arch: Record<string, number>;
    unhealthy: number;
    unsupported: number;
  };
  operating_system: {
    boards: Record<string, number>;
    versions: Record<string, number>;
  };
  integrations: Record<string, number>;
  count_addons: number[];
  count_automations: number[];
  count_integrations: number[];
  count_states: number[];
  count_users: number[];
  energy: {
    count_configured: number;
  };
}

export interface Queue {
  entries: string[];
  data: QueueData;
  schema_version: number;
  process_complete: boolean;
}

export interface AnalyticsDataHistory {
  timestamp: string;
  active_installations: number;
  installation_types: {
    os: number;
    container: number;
    core: number;
    supervised: number;
    unknown: number;
  };
  versions?: Record<string, number>;
}

export interface AnalyticsDataCurrent {
  avg_addons: number;
  avg_automations: number;
  avg_integrations: number;
  avg_states: number;
  avg_users: number;
  countries: Record<string, number>;
  integrations: Record<string, number>;
  last_updated: number;
  extended_data_from: number;
  reports_integrations: number;
  reports_statistics: number;
  versions: Record<string, number>;
  active_installations: number;
  operating_system: {
    versions: Record<string, number>;
    boards: Record<string, number>;
  };
  installation_types: {
    os: number;
    container: number;
    core: number;
    supervised: number;
    unknown: number;
  };
}

export interface AnalyticsData {
  schema_version: number;
  history: AnalyticsDataHistory[];
  current: AnalyticsDataCurrent;
}

export interface IncomingPayload {
  addon_count?: number;
  addons?: {
    slug: string;
    version?: null | string;
    protected: null | boolean;
    auto_update: null | boolean;
  }[];
  automation_count?: number;
  country?: string;
  region?: string;
  custom_integrations?: { domain: string; version?: string | null }[];
  operating_system?: { board: string; version?: string | null };
  supervisor?: { supported: boolean; healthy: boolean; arch?: string };
  installation_type: string;
  integration_count?: number;
  integrations?: string[];
  last_write?: number;
  state_count?: number;
  user_count?: number;
  energy?: { configured: boolean };
  uuid: string;
  version: string;
}

export const InstallationTypes: Record<string, ShortInstallationType> = {
  "Home Assistant OS": ShortInstallationType.OS,
  "Home Assistant Container": ShortInstallationType.CONTAINER,
  "Home Assistant Core": ShortInstallationType.CORE,
  "Home Assistant Supervised": ShortInstallationType.SUPERVISED,
  Unknown: ShortInstallationType.UNKNOWN,
};

export const createQueueDefaults = (): Queue => ({
  entries: [],
  data: createQueueData(),
  schema_version: SCHEMA_VERSION_QUEUE,
  process_complete: false,
});

export const createQueueData = (): QueueData => ({
  addons: {},
  custom_integrations: {},
  reports_integrations: 0,
  reports_statistics: 0,
  versions: {},
  countries: {},
  operating_system: { boards: {}, versions: {} },
  supervisor: {
    arch: {},
    unhealthy: 0,
    unsupported: 0,
  },
  installation_types: {
    os: 0,
    container: 0,
    core: 0,
    supervised: 0,
    unknown: 0,
  },
  integrations: {},
  count_addons: [],
  count_automations: [],
  count_integrations: [],
  count_states: [],
  count_users: [],
  energy: {
    count_configured: 0,
  },
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
