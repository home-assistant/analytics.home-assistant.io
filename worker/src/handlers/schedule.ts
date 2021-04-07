// Scheduled taks handler to manage the KV store
import { CurrentAnalytics } from "../../../site/src/data";
import { SanitizedPayload } from "../data";
import { average } from "../utils/average";
import { formatDate } from "../utils/date";

export async function handleSchedule(event: ScheduledEvent): Promise<void> {
  const core_analytics: Record<string, any> = {};
  const storedAnalytics =
    (await KV.get<{ [key: string]: CurrentAnalytics }>(
      "core_analytics",
      "json"
    )) || {};
  const storedData = await listStoredData();
  console.log(JSON.stringify(storedData));
  const currentDataset: CurrentAnalytics = generateCurrentDataset(storedData);

  const currentDate = formatDate(new Date());
  const currentDateObj = new Date(
    currentDate.year,
    currentDate.month,
    currentDate.day,
    currentDate.hour
  );
  const timestampString = String(currentDateObj.getTime());
  const storeKey = `history:${timestampString}`;

  for (const key of Object.keys(storedAnalytics)) {
    core_analytics[key] = {
      active_installations: storedAnalytics[key].active_installations,
      installation_types: storedAnalytics[key].installation_types,
    };
  }

  core_analytics[timestampString] = currentDataset;

  await KV.put(storeKey, JSON.stringify(currentDataset));
  await KV.put("core_analytics", JSON.stringify(core_analytics));
}

async function listStoredData(): Promise<SanitizedPayload[]> {
  const huuidList: Set<string> = new Set();
  const huuidData: SanitizedPayload[] = [];

  let lastResponse;
  while (lastResponse === undefined || !lastResponse.list_complete) {
    lastResponse = await KV.list({
      prefix: "huuid",
      cursor: lastResponse !== undefined ? lastResponse.cursor : undefined,
    });

    for (const key of lastResponse.keys) {
      huuidList.add(key.name);
    }
  }

  for (const huuid of huuidList) {
    const payload = await KV.get<SanitizedPayload>(huuid, "json");
    if (payload) {
      huuidData.push(payload);
    }
  }

  return huuidData;
}

const generateCurrentDataset = (
  huuidData: SanitizedPayload[]
): CurrentAnalytics => {
  let reports_integrations = 0;
  let reports_statistics = 0;
  const last_updated = new Date().getTime();
  const installation_types = { os: 0, container: 0, core: 0, supervised: 0 };
  const integrations: Record<string, number> = {};
  const addons: Record<string, number> = {};
  const countries: Record<string, number> = {};
  const versions: Record<string, number> = {};
  const count_addons: number[] = [];
  const count_automations: number[] = [];
  const count_integrations: number[] = [];
  const count_states: number[] = [];
  const count_users: number[] = [];

  for (const huuid of huuidData) {
    const reported_integrations = huuid.integrations || [];

    if (!versions[huuid.version]) {
      versions[huuid.version] = 1;
    } else {
      versions[huuid.version]++;
    }

    if (huuid.country) {
      if (!countries[huuid.country]) {
        countries[huuid.country] = 1;
      } else {
        countries[huuid.country]++;
      }
    }

    if (huuid.addon_count) {
      count_addons.push(huuid.addon_count);
    }
    if (huuid.automation_count) {
      count_automations.push(huuid.automation_count);
    }
    if (huuid.integration_count) {
      count_integrations.push(huuid.integration_count);
    }
    if (huuid.state_count) {
      reports_statistics++;
      count_states.push(huuid.state_count);
    }
    if (huuid.user_count) {
      count_users.push(huuid.user_count);
    }

    if (reported_integrations.length) {
      reports_integrations++;
      for (const integration of reported_integrations) {
        if (!integrations[integration]) {
          integrations[integration] = 1;
        } else {
          integrations[integration]++;
        }
      }
    }

    for (const addon of huuid.addons || []) {
      if (!addons[addon.slug]) {
        addons[addon.slug] = 1;
      } else {
        addons[addon.slug]++;
      }
    }

    if (huuid.installation_type === "Home Assistant OS") {
      installation_types.os++;
    } else if (huuid.installation_type === "Home Assistant Container") {
      installation_types.container++;
    } else if (huuid.installation_type === "Home Assistant Core") {
      installation_types.core++;
    } else if (huuid.installation_type === "Home Assistant Supervised") {
      installation_types.supervised++;
    }
  }

  return {
    last_updated,
    countries,
    installation_types,
    active_installations:
      installation_types.container +
      installation_types.core +
      installation_types.os +
      installation_types.supervised,
    avg_users: average(count_users),
    avg_automations: average(count_automations),
    avg_integrations: average(count_integrations),
    avg_addons: average(count_addons),
    avg_states: average(count_states),
    integrations,
    reports_integrations,
    reports_statistics,
    addons,
    versions,
  };
};
