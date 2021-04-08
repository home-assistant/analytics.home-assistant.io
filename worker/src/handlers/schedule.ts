// Scheduled taks handler to manage the KV store
import { CurrentAnalytics } from "../../../site/src/data";
import { Queue, QueueData, SanitizedPayload } from "../data";
import { average } from "../utils/average";
import { formatDate } from "../utils/date";

export async function handleSchedule(event: ScheduledEvent): Promise<void> {
  await prosessQueue();
}

async function prosessQueue(): Promise<void> {
  const queue = (await KV.get<Queue>("queue", "json")) || {
    entries: [],
    data: {},
  };

  if (queue.entries.length === 0) {
    // No entries, get list
    console.log("No entries, get list");
    queue.entries = await listKV("uuid");
  }

  // Prosess the first 850 entries in the array
  for (const entryKey of queue.entries.slice(0, 850)) {
    let entryData;
    try {
      entryData = await KV.get<SanitizedPayload>(entryKey, "json");
    } catch (e) {
      console.log(e);
    }

    if (entryData !== undefined && entryData !== null) {
      queue.data = combineEntryData(queue.data, entryData);
    }
  }
  queue.entries = queue.entries.slice(850);

  if (queue.entries.length === 0) {
    // No more entries, store and reset queue data
    console.log("No more entries, store and reset queue data");
    const core_analytics: Record<string, any> = {};
    const timestampString = new Date().getTime();

    const queue_data = prosessQueueData(queue.data as QueueData);
    const storedAnalytics =
      (await KV.get<{ [key: string]: CurrentAnalytics }>(
        "core_analytics",
        "json"
      )) || {};

    for (const key of Object.keys(storedAnalytics)) {
      core_analytics[key] = {
        active_installations: storedAnalytics[key].active_installations,
        installation_types: storedAnalytics[key].installation_types,
      };
    }

    core_analytics[timestampString] = queue_data;

    await KV.put(`history:${timestampString}`, JSON.stringify(queue_data));
    await KV.put("core_analytics", JSON.stringify(core_analytics));
    queue.data = {};
  }

  await KV.put("queue", JSON.stringify(queue));
}

async function listKV(prefix: string): Promise<string[]> {
  let entries: Set<string> = new Set();

  let lastResponse;
  while (lastResponse === undefined || !lastResponse.list_complete) {
    lastResponse = await KV.list({
      prefix,
      cursor: lastResponse !== undefined ? lastResponse.cursor : undefined,
    });

    for (const key of lastResponse.keys) {
      entries.add(key.name);
    }
  }

  return Array.from(entries);
}

function combineEntryData(
  data: Partial<QueueData>,
  entrydata: SanitizedPayload
): Partial<QueueData> {
  // Start data init
  if (data.reports_integrations === undefined) {
    data.reports_integrations = 0;
  }
  if (data.reports_statistics === undefined) {
    data.reports_statistics = 0;
  }

  if (data.versions === undefined) {
    data.versions = {};
  }
  if (data.countries === undefined) {
    data.countries = {};
  }
  if (data.integrations === undefined) {
    data.integrations = {};
  }
  if (data.installation_types === undefined) {
    data.installation_types = { os: 0, container: 0, core: 0, supervised: 0 };
  }

  if (data.count_addons === undefined) {
    data.count_addons = [];
  }
  if (data.count_automations === undefined) {
    data.count_automations = [];
  }
  if (data.count_integrations === undefined) {
    data.count_integrations = [];
  }
  if (data.count_states === undefined) {
    data.count_states = [];
  }
  if (data.count_users === undefined) {
    data.count_users = [];
  }
  // End data init

  // Start prosessing the entry
  const reported_integrations = entrydata.integrations || [];

  if (!data.versions[entrydata.version]) {
    data.versions[entrydata.version] = 1;
  } else {
    data.versions[entrydata.version]++;
  }

  if (entrydata.country) {
    if (!data.countries[entrydata.country]) {
      data.countries[entrydata.country] = 1;
    } else {
      data.countries[entrydata.country]++;
    }
  }

  if (entrydata.addon_count) {
    data.count_addons.push(entrydata.addon_count);
  }
  if (entrydata.automation_count) {
    data.count_automations.push(entrydata.automation_count);
  }
  if (entrydata.integration_count) {
    data.count_integrations.push(entrydata.integration_count);
  }
  if (entrydata.state_count) {
    data.reports_statistics++;
    data.count_states.push(entrydata.state_count);
  }
  if (entrydata.user_count) {
    data.count_users.push(entrydata.user_count);
  }

  if (reported_integrations.length) {
    data.reports_integrations++;
    for (const integration of reported_integrations) {
      if (!data.integrations[integration]) {
        data.integrations[integration] = 1;
      } else {
        data.integrations[integration]++;
      }
    }
  }

  if (entrydata.installation_type === "Home Assistant OS") {
    data.installation_types.os++;
  } else if (entrydata.installation_type === "Home Assistant Container") {
    data.installation_types.container++;
  } else if (entrydata.installation_type === "Home Assistant Core") {
    data.installation_types.core++;
  } else if (entrydata.installation_type === "Home Assistant Supervised") {
    data.installation_types.supervised++;
  }

  return data;
}

const prosessQueueData = (data: QueueData): CurrentAnalytics => {
  const last_updated = new Date().getTime();

  return {
    last_updated,
    countries: data.countries,
    installation_types: data.installation_types,
    active_installations:
      data.installation_types.container +
      data.installation_types.core +
      data.installation_types.os +
      data.installation_types.supervised,
    avg_users: average(data.count_users),
    avg_automations: average(data.count_automations),
    avg_integrations: average(data.count_integrations),
    avg_addons: average(data.count_addons),
    avg_states: average(data.count_states),
    integrations: data.integrations,
    reports_integrations: data.reports_integrations,
    reports_statistics: data.reports_statistics,
    versions: data.versions,
  };
};
