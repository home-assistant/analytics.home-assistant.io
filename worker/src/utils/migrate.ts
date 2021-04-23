import { AnalyticsData, SCHEMA_VERSION_ANALYTICS } from "../data";

export const migrateAnalyticsData = (data: any): AnalyticsData => {
  if (
    data?.schema_version &&
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
      reports_statistics: 0,
      reported_from: 0,
      versions: {},
    },
    history: [],
    schema_version: SCHEMA_VERSION_ANALYTICS,
  };

  if (!data || Object.keys(data).length === 0) {
    // No data... return base
    return analyticsData;
  }

  if (!data?.schema_version) {
    // Before we tracked schema_version
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

    const reported_from = lastDataEntry.active_installations;

    delete lastDataEntry.active_installations;
    delete lastDataEntry.installation_types;
    analyticsData.current = lastDataEntry;
    analyticsData.current.reported_from = reported_from;
  }

  return analyticsData;
};
