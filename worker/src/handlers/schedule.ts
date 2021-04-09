// Scheduled taks handler to manage the KV store
import { CurrentAnalytics } from "../../../site/src/data";
import {
  createQueueData,
  bumpValue,
  Queue,
  QueueData,
  SanitizedPayload,
  KV_PREFIX_UUID,
  KV_MAX_PROCESS_ENTRIES,
  KV_KEY_QUEUE,
  KV_KEY_CORE_ANALYTICS,
  KV_PREFIX_HISTORY,
} from "../data";
import { average } from "../utils/average";

export async function handleSchedule(event: ScheduledEvent): Promise<void> {
  await processQueue();
}

async function processQueue(): Promise<void> {
  const queue = (await KV.get<Queue>(KV_KEY_QUEUE, "json")) || {
    entries: [],
    data: createQueueData(),
  };

  if (queue.entries.length === 0) {
    // No entries, get list
    console.log("No entries, get list");
    queue.entries = await listKV(KV_PREFIX_UUID);
  }

  async function handleEntry(entryKey: string) {
    console.log("getting ", entryKey);

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

  await Promise.all(
    queue.entries
      .splice(0, KV_MAX_PROCESS_ENTRIES)
      .map((entryKey) => handleEntry(entryKey))
  );

  if (queue.entries.length === 0) {
    // No more entries, store and reset queue data
    console.log("No more entries, store and reset queue data");
    const core_analytics: Record<string, any> = {};
    const timestampString = String(new Date().getTime());

    const queue_data = processQueueData(queue.data);
    const storedAnalytics =
      (await KV.get<{ [key: string]: CurrentAnalytics }>(
        KV_KEY_CORE_ANALYTICS,
        "json"
      )) || {};

    for (const key of Object.keys(storedAnalytics)) {
      core_analytics[key] = {
        active_installations: storedAnalytics[key].active_installations,
        installation_types: storedAnalytics[key].installation_types,
      };
    }

    core_analytics[timestampString] = queue_data;

    await KV.put(
      `${KV_PREFIX_HISTORY}:${timestampString}`,
      JSON.stringify(queue_data)
    );
    await KV.put(KV_KEY_CORE_ANALYTICS, JSON.stringify(core_analytics));
    queue.data = createQueueData();
  }

  await KV.put(KV_KEY_QUEUE, JSON.stringify(queue));
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
  data: QueueData,
  entrydata: SanitizedPayload
): QueueData {
  const reported_integrations = entrydata.integrations || [];

  data.versions[entrydata.version] = bumpValue(
    data.versions[entrydata.version]
  );

  if (entrydata.country) {
    data.countries[entrydata.country] = bumpValue(
      data.countries[entrydata.country]
    );
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
      data.integrations[integration] = bumpValue(
        data.integrations[integration]
      );
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

const processQueueData = (data: QueueData): CurrentAnalytics => {
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
