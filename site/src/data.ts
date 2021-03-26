interface InstallationTypes {
  core: number;
  container: number;
  supervised: number;
  os: number;
}

type Integrations = Record<string, number>;
type Addons = Record<string, number>;
type Versions = Record<string, number>;
export type AnalyticsData = Record<string, Analytics>;

export interface Analytics {
  active_installations: number;
  addons: Addons;
  avg_addons: number;
  avg_automations: number;
  avg_integrations: number;
  avg_states: number;
  avg_users: number;
  installation_types: InstallationTypes;
  integrations: Integrations;
  versions: Versions;
}

export interface CurrentAnalytics extends Analytics {
  last_updated?: number;
}

export const fetchData = () =>
  fetch("https://analytics-api.home-assistant.io/v1");
