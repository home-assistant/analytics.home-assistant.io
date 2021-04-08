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
  countries: Record<string, number>;
  addons?: Addons;
  avg_addons: number;
  avg_automations: number;
  avg_integrations: number;
  avg_states: number;
  avg_users: number;
  installation_types: InstallationTypes;
  integrations: Integrations;
  reports_integrations: number;
  reports_statistics: number;
  versions: Versions;
}

export interface CurrentAnalytics extends Analytics {
  last_updated?: number;
}

export interface IntegrationDetails {
  title: string;
  quality_scale: string;
}

export interface IntegrationData {
  domain: string;
  title: string;
  installations: number;
}

export const AnalyticsPages = ["installations", "statistics", "integrations"];

export const fetchData = () =>
  fetch("https://analytics-api.home-assistant.io/v1");

export const fetchIntegrationDetails = () =>
  fetch("https://www.home-assistant.io/integrations.json");

export const relativeTime = (targetTimestamp: number): string => {
  const now = new Date();
  let count = 0;
  let postfix;
  const secondsPast = (now.getTime() - targetTimestamp) / 1000;
  if (secondsPast < 60) {
    postfix = secondsPast === 1 ? "second" : "seconds";
  } else if (secondsPast < 3600) {
    count = Math.round(secondsPast / 60);
    postfix = count === 1 ? "minute" : "minutes";
  } else if (secondsPast < 86400) {
    count = Math.round(secondsPast / 3600);
    postfix = count === 1 ? "hour" : "hours";
  } else if (secondsPast > 86400) {
    count = Math.round(secondsPast / 86400);
    postfix = count === 1 ? "day" : "days";
  }

  return `${count} ${postfix} ago`;
};
