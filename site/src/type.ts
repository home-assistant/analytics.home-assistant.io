interface InstallationTypes {
  core: number
  container: number
  supervised: number
  os: number
}
export interface Integrations {
  [key: string]: number
}

export interface Addons {
  [key: string]: number
}
interface Versions {
  [key: string]: number
}

export interface Analytics {
  installation_types: InstallationTypes
  integrations: Integrations
  addons: Addons
  versions: Versions
  avg_users: number
  avg_automations: number
  avg_integrations: number
  avg_addons: number
  avg_states: number
  active_installations: number
}

export interface CurrentAnalytics extends Analytics {
  last_updated?: number
}

export interface AnalyticsData {
  [key: string]: Analytics
}
