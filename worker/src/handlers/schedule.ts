// Scheduled taks handler to manage the KV store
import Toucan from "toucan-js";
import {
  bumpValue,
  createQueueData,
  createQueueDefaults,
  IncomingPayload,
  KV_KEY_CORE_ANALYTICS,
  KV_KEY_QUEUE,
  KV_MAX_PROCESS_ENTRIES,
  KV_PREFIX_HISTORY,
  KV_PREFIX_UUID,
  ListEntry,
  SCHEMA_VERSION_QUEUE,
  Queue,
  QueueData,
  ScheduledTask,
  ShortInstallationType,
  UuidMetadata,
  UuidMetadataKey,
  AnalyticsData,
} from "../data";
import { average } from "../utils/average";
import { migrateAnalyticsData } from "../utils/migrate";

export async function handleSchedule(
  event: ScheduledEvent,
  sentry: Toucan
): Promise<void> {
  // @ts-expect-error Missing type for cron on ScheduledEvent https://github.com/cloudflare/workers-types/pull/86
  const scheduledTask = event.cron;

  try {
    if (scheduledTask === ScheduledTask.PROCESS_QUEUE) {
      // Runs every 2 minutes
      await processQueue(sentry);
    } else if (scheduledTask === ScheduledTask.RESET_QUEUE) {
      // Runs every day
      await resetQueue(sentry);
    } else if (scheduledTask === ScheduledTask.UPDATE_HISTORY) {
      // Runs every hour
      await updateHistory(sentry);
    } else {
      throw new Error(`Unexpected schedule task: ${scheduledTask}`);
    }
  } catch (e) {
    sentry.captureException(e);
  }
}

const getQueueData = async (): Promise<Queue> =>
  (await KV.get<Queue>(KV_KEY_QUEUE, "json")) || createQueueDefaults();

const getAnalyticsData = async (): Promise<AnalyticsData> => {
  const data = await KV.get(KV_KEY_CORE_ANALYTICS, "json");
  return migrateAnalyticsData(data);
};

async function resetQueue(sentry: Toucan): Promise<void> {
  sentry.setTag("scheduled-task", "RESET_QUEUE");
  sentry.addBreadcrumb({ message: "Process started" });
  const queue = await getQueueData();

  sentry.setExtra("queue", queue);

  if (queue.entries.length === 0 && queue.process_complete) {
    sentry.addBreadcrumb({ message: "Store reset queue" });
    await KV.put(KV_KEY_QUEUE, JSON.stringify(createQueueDefaults()));
  }
  sentry.addBreadcrumb({ message: "Process complete" });
}
async function updateHistory(sentry: Toucan): Promise<void> {
  sentry.setTag("scheduled-task", "UPDATE_HISTORY");
  sentry.addBreadcrumb({ message: "Process started" });
  let data = createQueueData();

  sentry.addBreadcrumb({ message: "Get current data" });
  const analyticsData = await getAnalyticsData();
  const timestampString = String(new Date().getTime());

  sentry.addBreadcrumb({ message: "List UUID entries" });
  const kv_list = await listKV(KV_PREFIX_UUID);

  for (const entry of kv_list) {
    if (entry.metadata) {
      data = combineMetadataEntryData(data, entry.metadata);
    }
  }

  sentry.addBreadcrumb({ message: "Update analyticsData" });
  const active_installations =
    data.installation_types.container +
    data.installation_types.core +
    data.installation_types.os +
    data.installation_types.supervised +
    data.installation_types.unknown;

  analyticsData.current.installation_types = data.installation_types;
  analyticsData.current.active_installations = active_installations;
  analyticsData.current.versions = data.versions;
  analyticsData.current.countries = data.countries;
  analyticsData.history.push({
    timestamp: timestampString,
    active_installations,
    installation_types: data.installation_types,
  });

  sentry.addBreadcrumb({ message: "Trigger Netlify build" });
  const resp = await fetch(NETLIFY_BUILD_HOOK, { method: "POST" });
  if (!resp.ok) {
    throw new Error("Failed to call Netlify build hook");
  }

  sentry.addBreadcrumb({ message: "Store data" });
  await KV.put(KV_KEY_CORE_ANALYTICS, JSON.stringify(analyticsData));

  sentry.addBreadcrumb({ message: "Process complete" });
}

async function processQueue(sentry: Toucan): Promise<void> {
  sentry.setTag("scheduled-task", "PROCESS_QUEUE");
  sentry.addBreadcrumb({ message: "Process started" });
  let queue = await getQueueData();

  sentry.setExtra("queue", queue);

  if (
    queue.entries.length === 0 ||
    queue.schema_version !== SCHEMA_VERSION_QUEUE
  ) {
    if (
      queue.schema_version === SCHEMA_VERSION_QUEUE &&
      queue.process_complete
    ) {
      sentry.addBreadcrumb({ message: "Process complete, waiting for reset" });
      return;
    }
    sentry.addBreadcrumb({ message: "Reset queue and get list of entries" });
    // Reset queue
    queue = createQueueDefaults();

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
    const timestamp = new Date().getTime();
    const timestampString = String(timestamp);

    const queue_data = processQueueData(queue.data);
    const storedAnalytics = await getAnalyticsData();

    storedAnalytics.current = {
      ...queue_data,
      last_updated: timestamp,
      extened_data_from: queue_data.active_installations,
    };

    sentry.addBreadcrumb({ message: "Trigger Netlify build" });
    const resp = await fetch(NETLIFY_BUILD_HOOK, { method: "POST" });
    if (!resp.ok) {
      throw new Error("Failed to call Netlify build hook");
    }

    sentry.addBreadcrumb({ message: "Store data" });
    await KV.put(
      `${KV_PREFIX_HISTORY}:${timestampString}`,
      JSON.stringify(queue_data)
    );
    await KV.put(KV_KEY_CORE_ANALYTICS, JSON.stringify(storedAnalytics));
    queue = createQueueDefaults();
    queue.process_complete = true;
  }
  sentry.addBreadcrumb({ message: "Process complete" });
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

const processQueueData = (data: QueueData) => {
  return {
    last_updated: new Date().getTime(),
    countries: data.countries,
    installation_types: data.installation_types,
    active_installations:
      data.installation_types.container +
      data.installation_types.core +
      data.installation_types.os +
      data.installation_types.supervised +
      data.installation_types.unknown,
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
