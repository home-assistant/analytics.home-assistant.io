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

export const AllowedPayloadKeys = [
  "addon_count",
  "addons",
  "automation_count",
  "custom_integrations",
  "installation_type",
  "integration_count",
  "integrations",
  "last_write",
  "state_count",
  "supervisor",
  "user_count",
  "version",
];

export const InstallationTypes = [
  "Home Assistant OS",
  "Home Assistant Container",
  "Home Assistant Core",
  "Home Assistant Supervised",
];

export const baseQueueData: QueueData = {
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
};

export const bumpValue = (current?: number): number => !current ? 1 : current++;
