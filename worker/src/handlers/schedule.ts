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
  //const currentDataset: CurrentAnalytics = generateCurrentDataset(storedData);

  const currentDate = formatDate(new Date());
  const currentDateObj = new Date(
    currentDate.year,
    currentDate.month,
    currentDate.day,
    currentDate.hour
  );
  const timestampString = String(currentDateObj.getTime());
  //const storeKey = `history:${timestampString}`;

  const dataKeys = Object.keys(storedAnalytics);
  const lastDataEntry = storedAnalytics[dataKeys[dataKeys.length - 1]];

  for (const key of dataKeys) {
    core_analytics[key] = {
      active_installations: storedAnalytics[key].active_installations,
      installation_types: storedAnalytics[key].installation_types,
    };
  }

  core_analytics[timestampString] = {
    ...lastDataEntry,
    active_installations: storedData,
  };

  //await KV.put(storeKey, JSON.stringify(currentDataset));
  await KV.put("core_analytics", JSON.stringify(core_analytics));
}

export async function listStoredData(): Promise<number> {
  const uuidList: Set<string> = new Set();
  const uuidData: SanitizedPayload[] = [];
  let entries = 0;

  let lastResponse;
  while (lastResponse === undefined || !lastResponse.list_complete) {
    lastResponse = await KV.list({
      prefix: "uuid",
      cursor: lastResponse !== undefined ? lastResponse.cursor : undefined,
    });

    entries = entries + lastResponse.keys.length;

    /*
    for (const key of lastResponse.keys) {
      uuidList.add(key.name);
    }
    */
  }

  return entries;

  /*  for (const storageKey of uuidList) {
    const payload = await KV.get<SanitizedPayload>(storageKey, "json");
    if (payload) {
      uuidData.push(payload);
    }
  }

  return uuidData;*/
}

const generateCurrentDataset = (
  uuidData: SanitizedPayload[]
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

  for (const uuid of uuidData) {
    const reported_integrations = uuid.integrations || [];

    if (!versions[uuid.version]) {
      versions[uuid.version] = 1;
    } else {
      versions[uuid.version]++;
    }

    if (uuid.country) {
      if (!countries[uuid.country]) {
        countries[uuid.country] = 1;
      } else {
        countries[uuid.country]++;
      }
    }

    if (uuid.addon_count) {
      count_addons.push(uuid.addon_count);
    }
    if (uuid.automation_count) {
      count_automations.push(uuid.automation_count);
    }
    if (uuid.integration_count) {
      count_integrations.push(uuid.integration_count);
    }
    if (uuid.state_count) {
      reports_statistics++;
      count_states.push(uuid.state_count);
    }
    if (uuid.user_count) {
      count_users.push(uuid.user_count);
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

    for (const addon of uuid.addons || []) {
      if (!addons[addon.slug]) {
        addons[addon.slug] = 1;
      } else {
        addons[addon.slug]++;
      }
    }

    if (uuid.installation_type === "Home Assistant OS") {
      installation_types.os++;
    } else if (uuid.installation_type === "Home Assistant Container") {
      installation_types.container++;
    } else if (uuid.installation_type === "Home Assistant Core") {
      installation_types.core++;
    } else if (uuid.installation_type === "Home Assistant Supervised") {
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
