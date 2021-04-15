// Scheduled taks handler to manage the KV store
import Toucan from "toucan-js";
import { CurrentAnalytics } from "../../../site/src/data";
import {
  createQueueData,
  bumpValue,
  Queue,
  QueueData,
  KV_PREFIX_UUID,
  KV_MAX_PROCESS_ENTRIES,
  KV_KEY_QUEUE,
  KV_KEY_CORE_ANALYTICS,
  KV_PREFIX_HISTORY,
  ListEntry,
  ShortInstallationType,
  UuidMetadataKey,
  UuidMetadata,
  IncomingPayload,
} from "../data";
import { average } from "../utils/average";

export async function handleSchedule(sentry: Toucan): Promise<void> {
  try {
    await processQueue(sentry);
  } catch (e) {
    sentry.captureException(e);
  }
}

async function processQueue(sentry: Toucan): Promise<void> {
  sentry.addBreadcrumb({ message: "Prosess started" });
  const queue = (await KV.get<Queue>(KV_KEY_QUEUE, "json")) || {
    entries: [],
    data: createQueueData(),
  };

  sentry.setExtra("queue", queue);

  if (queue.entries.length === 0) {
    sentry.addBreadcrumb({ message: "No entries, get list" });
    const kv_list = await listKV(KV_PREFIX_UUID);

    for (const entry of kv_list) {
      if (
        entry.metadata &&
        entry.metadata[UuidMetadataKey.EXTRA].length === 0
      ) {
        // Entry does not have any extra keys
        queue.data = combineMetadataEntryData(queue.data, entry.metadata);
      } else {
        queue.entries.push(entry.name);
      }
    }
  }

  async function handleEntry(entryKey: string) {
    let entryData;
    try {
      entryData = await KV.get<IncomingPayload>(entryKey, "json");
    } catch (e) {
      sentry.addBreadcrumb({ message: e });
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
    sentry.addBreadcrumb({
      message: "No more entries, store and reset queue data",
    });
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

    sentry.addBreadcrumb({ message: "Trigger Netlify build" });
    const resp = await fetch(
      WORKER_ENV === "production"
        ? NETLIFY_BUILD_HOOK
        : NETLIFY_BUILD_HOOK_STAGING,
      { method: "POST" }
    );
    if (!resp.ok) {
      throw new Error("Failed to call Netlify build hook");
    }

    sentry.addBreadcrumb({ message: "Store data" });
    await KV.put(
      `${KV_PREFIX_HISTORY}:${timestampString}`,
      JSON.stringify(queue_data)
    );
    await KV.put(KV_KEY_CORE_ANALYTICS, JSON.stringify(core_analytics));
    queue.data = createQueueData();
  }
  sentry.addBreadcrumb({ message: "Prosess complete" });
  await KV.put(KV_KEY_QUEUE, JSON.stringify(queue));
}

async function listKV(prefix: string): Promise<ListEntry[]> {
  let entries: ListEntry[] = [];

  let lastResponse;
  while (lastResponse === undefined || !lastResponse.list_complete) {
    lastResponse = await KV.list({
      prefix,
      cursor: lastResponse !== undefined ? lastResponse.cursor : undefined,
    });

    for (const key of lastResponse.keys) {
      entries.push(key as ListEntry);
    }
  }

  return entries;
}

function combineMetadataEntryData(
  data: QueueData,
  entrydata: UuidMetadata
): QueueData {
  data.versions[entrydata[UuidMetadataKey.VERSION]] = bumpValue(
    data.versions[entrydata[UuidMetadataKey.VERSION]]
  );

  if (entrydata[UuidMetadataKey.COUNTRY]) {
    data.countries[entrydata[UuidMetadataKey.COUNTRY]!] = bumpValue(
      data.countries[entrydata[UuidMetadataKey.COUNTRY]!]
    );
  }

  if (
    entrydata[UuidMetadataKey.INSTALLATION_TYPE] === ShortInstallationType.OS
  ) {
    data.installation_types.os++;
  } else if (
    entrydata[UuidMetadataKey.INSTALLATION_TYPE] ===
    ShortInstallationType.CONTAINER
  ) {
    data.installation_types.container++;
  } else if (
    entrydata[UuidMetadataKey.INSTALLATION_TYPE] === ShortInstallationType.CORE
  ) {
    data.installation_types.core++;
  } else if (
    entrydata[UuidMetadataKey.INSTALLATION_TYPE] ===
    ShortInstallationType.SUPERVISED
  ) {
    data.installation_types.supervised++;
  }

  return data;
}

function combineEntryData(
  data: QueueData,
  entrydata: IncomingPayload
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

  if (entrydata.installation_type === "Home Assistant OS") {
    data.installation_types.os++;
  } else if (entrydata.installation_type === "Home Assistant Container") {
    data.installation_types.container++;
  } else if (entrydata.installation_type === "Home Assistant Core") {
    data.installation_types.core++;
  } else if (entrydata.installation_type === "Home Assistant Supervised") {
    data.installation_types.supervised++;
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
