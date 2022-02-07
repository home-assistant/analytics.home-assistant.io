import { AnalyticsData, SCHEMA_VERSION_ANALYTICS } from "../data";

export const migrateAnalyticsData = (data: any): AnalyticsData => {
  if (
    data &&
    data.schema_version &&
    data.schema_version === SCHEMA_VERSION_ANALYTICS
  ) {
    return data;
  }

  const analyticsData: AnalyticsData = {
    current: {
      avg_addons: 0,
      avg_automations: 0,
      avg_integrations: 0,
      avg_states: 0,
      avg_users: 0,
      countries: {},
      integrations: {},
      last_updated: 0,
      reports_integrations: 0,
      reports_addons: 0,
      reports_statistics: 0,
      extended_data_from: 0,
      versions: {},
      operating_system: { boards: {}, versions: {} },
      installation_types: {
        os: 0,
        container: 0,
        supervised: 0,
        core: 0,
        unknown: 0,
      },
      active_installations: 0,
    },
    history: [],
    schema_version: SCHEMA_VERSION_ANALYTICS,
  };

  if (!data || Object.keys(data).length === 0) {
    return analyticsData;
  }

  if (!data.schema_version) {
    const dataKeys = Object.keys(data);
    const lastDataEntryKey = dataKeys[dataKeys.length - 1];
    const lastDataEntry = data[lastDataEntryKey];

    for (const entry of dataKeys) {
      if (entry !== lastDataEntryKey) {
        analyticsData.history.push({
          timestamp: entry,
          active_installations: data[entry].active_installations,
          installation_types: data[entry].installation_types,
        });
      }
    }
    analyticsData.history = analyticsData.history.sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    );

    analyticsData.current = lastDataEntry;
    analyticsData.current.extended_data_from =
      lastDataEntry.active_installations;
  }

  if (data.schema_version < 2) {
    analyticsData.current = { ...analyticsData.current, ...data.current };
    analyticsData.history = data.history;
  }

  if (data.schema_version < 3) {
    analyticsData.current = { ...analyticsData.current, ...data.current };
  }

  return analyticsData;
};
