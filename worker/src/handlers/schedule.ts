// Scheduled taks handler to manage the KV store
import Toucan from "toucan-js";
import { CurrentAnalytics } from "../../../site/src/data";
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
  QUEUE_SCHEMA_VERSION,
  Queue,
  QueueData,
  ScheduledTask,
  ShortInstallationType,
  UuidMetadata,
  UuidMetadataKey,
} from "../data";
import { average } from "../utils/average";

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
        throw new Error(`Unexpected schedule task: ${scheduleTask}`);
    }
  } catch (e) {
    sentry.captureException(e);
  }
}

const getQueueData = async (): Promise<Queue> =>
  (await KV.get<Queue>(KV_KEY_QUEUE, "json")) || createQueueDefaults();

async function resetQueue(sentry: Toucan): Promise<void> {
  sentry.setTag("scheduled-task", "RESET_QUEUE");
  sentry.addBreadcrumb({ message: "Process started" });
  const queue = await getQueueData();

  sentry.setExtra("queue", queue);

  if (queue.entries.length === 0 && queue.process_complete) {
    await KV.put(KV_KEY_QUEUE, JSON.stringify(createQueueDefaults()));
  }
}
async function updateHistory(sentry: Toucan): Promise<void> {
  sentry.setTag("scheduled-task", "UPDATE_HISTORY");
  sentry.addBreadcrumb({ message: "Process started" });
  let data = createQueueData();

  const kv_list = await listKV(KV_PREFIX_UUID);

  for (const entry of kv_list) {
    if (entry.metadata) {
      data = combineMetadataEntryData(data, entry.metadata);
    }
  }
}

async function processQueue(sentry: Toucan): Promise<void> {
  sentry.setTag("scheduled-task", "PROCESS_QUEUE");
  sentry.addBreadcrumb({ message: "Process started" });
  let queue = await getQueueData();

  sentry.setExtra("queue", queue);

  if (
    queue.entries.length === 0 ||
    queue.schema_version !== QUEUE_SCHEMA_VERSION
  ) {
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
    const resp = await fetch(NETLIFY_BUILD_HOOK, { method: "POST" });
    if (!resp.ok) {
      throw new Error("Failed to call Netlify build hook");
    }

    sentry.addBreadcrumb({ message: "Store data" });
    await KV.put(
      `${KV_PREFIX_HISTORY}:${timestampString}`,
      JSON.stringify(queue_data)
    );
    await KV.put(KV_KEY_CORE_ANALYTICS, JSON.stringify(core_analytics));
    queue = createQueueDefaults();
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
