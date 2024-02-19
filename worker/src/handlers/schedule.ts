// Scheduled taks handler to manage the KV store
import { Toucan } from "toucan-js";
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
  generateUuidMetadata,
  KV_KEY_ADDONS,
  KV_KEY_CUSTOM_INTEGRATIONS,
  BRANDS_DOMAINS_URL,
  VERSION_URL,
  VersionResponse,
  ScheduledWorkerEvent,
} from "../data";
import { groupVersions } from "../utils/group-versions";
import { median } from "../utils/median";
import { migrateAnalyticsData } from "../utils/migrate";

export async function handleSchedule(
  event: ScheduledWorkerEvent,
  sentry: Toucan
): Promise<void> {
  const scheduledTask = event.controller.cron;

  try {
    switch (scheduledTask) {
      case ScheduledTask.PROCESS_QUEUE:
        // Runs every 2 minutes
        await processQueue(event, sentry);
        break;
      case ScheduledTask.RESET_QUEUE:
        // Runs every day
        await resetQueue(event, sentry);
        break;
      case ScheduledTask.UPDATE_HISTORY:
        // Runs every hour
        await updateHistory(event, sentry);
        break;
      case ScheduledTask.REGENERATE_SITE:
        // Runs 15 min over each hour
        await regenerateSite(event, sentry);
        break;
      default:
        throw new Error(`Unexpected schedule task: ${scheduledTask}`);
    }
  } catch (e: any) {
    const captureId = sentry.captureException(e);
    console.error(`${e?.message} (${captureId})`);
  }
}

const getQueueData = async (event: ScheduledWorkerEvent): Promise<Queue> =>
  (await event.env.KV.get<Queue>(KV_KEY_QUEUE, "json")) ||
  createQueueDefaults();

const getAnalyticsData = async (
  event: ScheduledWorkerEvent
): Promise<AnalyticsData> => {
  const data = await event.env.KV.get(KV_KEY_CORE_ANALYTICS, "json");
  return migrateAnalyticsData(data);
};

async function resetQueue(
  event: ScheduledWorkerEvent,
  sentry: Toucan
): Promise<void> {
  sentry.setTag("scheduled-task", "RESET_QUEUE");
  sentry.addBreadcrumb({ message: "Process started" });
  const queue = await getQueueData(event);

  sentry.setExtra("queue", queue);

  if (queue.entries.length === 0 && queue.process_complete) {
    sentry.addBreadcrumb({ message: "Store reset queue" });
    await event.env.KV.put(KV_KEY_QUEUE, JSON.stringify(createQueueDefaults()));
  }
  sentry.addBreadcrumb({ message: "Process complete" });
}

async function regenerateSite(
  event: ScheduledWorkerEvent,
  sentry: Toucan
): Promise<void> {
  sentry.setTag("scheduled-task", "REGENERATE_SITE");
  sentry.addBreadcrumb({ message: "Process started" });

  sentry.addBreadcrumb({ message: "Get current data" });
  const analyticsData = await getAnalyticsData(event);
  const currentTimestamp = new Date().getTime();
  const lastHistoryEntry =
    analyticsData.history[analyticsData.history.length - 1];

  if (currentTimestamp - Number(lastHistoryEntry.timestamp) > 3_600_000) {
    // Ideally this would never hit, but let's throw an error here to detect it.
    throw new Error("The data is not updated in the past hour!");
  }

  sentry.addBreadcrumb({ message: "Trigger Netlify build" });
  const resp = await fetch(event.env.NETLIFY_BUILD_HOOK, { method: "POST" });
  if (!resp.ok) {
    throw new Error("Failed to call Netlify build hook");
  }
  sentry.addBreadcrumb({ message: "Process complete" });
}

async function updateHistory(
  event: ScheduledWorkerEvent,
  sentry: Toucan
): Promise<void> {
  sentry.setTag("scheduled-task", "UPDATE_HISTORY");
  sentry.addBreadcrumb({ message: "Process started" });
  let data = createQueueData();

  sentry.addBreadcrumb({ message: "Get current data" });
  const analyticsData = await getAnalyticsData(event);
  const timestamp = new Date().getTime();
  const timestampString = String(timestamp);

  sentry.addBreadcrumb({ message: "List UUID entries" });
  const kv_list = await listKV(event, KV_PREFIX_UUID);

  const missingMetata = kv_list.filter((entry) => !entry.metadata);

  async function handleMissingMetadata(entry: ListEntry) {
    const value = await event.env.KV.get<IncomingPayload>(entry.name, "json");
    await event.env.KV.put(entry.name, JSON.stringify(value), {
      expiration: entry.expiration,
      metadata: generateUuidMetadata(value!, timestamp),
    });
  }

  if (missingMetata.length !== 0) {
    sentry.captureMessage(
      `${missingMetata.length} entries is missing metadata`,
      "info"
    );
    await Promise.all(
      missingMetata
        .splice(0, Math.round(KV_MAX_PROCESS_ENTRIES / 2))
        .map((entry) => handleMissingMetadata(entry))
    );
    return;
  }

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
    data.installation_types.unsupported_container +
    data.installation_types.unknown;

  analyticsData.current.installation_types = data.installation_types;
  analyticsData.current.active_installations = active_installations;
  analyticsData.current.versions = data.versions;
  analyticsData.current.countries = data.countries;
  analyticsData.history.push({
    timestamp: timestampString,
    active_installations,
    installation_types: data.installation_types,
    versions: groupVersions(event, data.versions),
  });

  sentry.addBreadcrumb({ message: "Store data" });
  await event.env.KV.put(KV_KEY_CORE_ANALYTICS, JSON.stringify(analyticsData));

  sentry.addBreadcrumb({ message: "Process complete" });
}

async function processQueue(
  event: ScheduledWorkerEvent,
  sentry: Toucan
): Promise<void> {
  sentry.setTag("scheduled-task", "PROCESS_QUEUE");
  sentry.addBreadcrumb({ message: "Process started" });
  let maxWorkerInvocations = KV_MAX_PROCESS_ENTRIES;
  let queue = await getQueueData(event);

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

    const kv_list = await listKV(event, KV_PREFIX_UUID);
    maxWorkerInvocations -= Math.floor(kv_list.length / 1000);

    sentry.addBreadcrumb({
      message: `${kv_list.length} entries`,
    });

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

  sentry.addBreadcrumb({
    message: "Fetching external data from brands and version",
  });
  const [brandsDomainsResponse, versionResponse] = await Promise.all([
    fetch(BRANDS_DOMAINS_URL),
    fetch(VERSION_URL),
  ]);

  sentry.setExtra("brandsDomainsResponse", brandsDomainsResponse);
  sentry.setExtra("versionResponse", versionResponse);

  if (!brandsDomainsResponse.ok) {
    throw Error("Could not get domain list from brands");
  }
  if (!versionResponse.ok) {
    throw Error("Could not get domain list from brands");
  }

  const brandsDomainsJson: {
    core: string[];
    custom: string[];
  } = await brandsDomainsResponse.json();

  const osBoardsJson = await versionResponse.json<VersionResponse>();

  const brandsDomains: Set<string> = new Set(
    brandsDomainsJson.custom.concat(brandsDomainsJson.core)
  );

  const osBoards: Set<string> = new Set(Object.keys(osBoardsJson.hassos));

  async function handleEntry(entryKey: string) {
    let entryData;
    entryData = await event.env.KV.get<IncomingPayload>(entryKey, "json");

    if (entryData !== undefined && entryData !== null) {
      queue.data = combineEntryData(
        queue.data,
        entryData,
        brandsDomains,
        osBoards
      );
    }
  }

  sentry.addBreadcrumb({
    message: `${maxWorkerInvocations} remaining`,
  });

  await Promise.all(
    queue.entries
      .splice(0, maxWorkerInvocations)
      .map((entryKey) => handleEntry(entryKey))
  );

  if (queue.entries.length === 0) {
    sentry.addBreadcrumb({
      message: "No more entries, store and reset queue data",
    });
    const timestamp = new Date().getTime();
    const timestampString = String(timestamp);

    const queue_data = processQueueData(queue.data);
    const storedAnalytics = await getAnalyticsData(event);

    storedAnalytics.current = {
      ...queue_data,
      last_updated: timestamp,
      extended_data_from: queue_data.active_installations,
    };

    sentry.addBreadcrumb({ message: "Trigger Netlify build" });
    const resp = await fetch(event.env.NETLIFY_BUILD_HOOK, { method: "POST" });
    if (!resp.ok) {
      throw new Error("Failed to call Netlify build hook");
    }

    sentry.addBreadcrumb({ message: "Store data" });
    await Promise.all([
      event.env.KV.put(
        `${KV_PREFIX_HISTORY}:${timestampString}`,
        JSON.stringify(queue_data)
      ),
      event.env.KV.put(KV_KEY_CORE_ANALYTICS, JSON.stringify(storedAnalytics)),
      event.env.KV.put(
        KV_KEY_CUSTOM_INTEGRATIONS,
        JSON.stringify(queue.data.custom_integrations)
      ),
      event.env.KV.put(KV_KEY_ADDONS, JSON.stringify(queue.data.addons)),
    ]);

    queue = createQueueDefaults();
    queue.process_complete = true;
  }
  sentry.addBreadcrumb({ message: "Process complete" });
  await event.env.KV.put(KV_KEY_QUEUE, JSON.stringify(queue));
}

async function listKV(
  event: ScheduledWorkerEvent,
  prefix: string
): Promise<ListEntry[]> {
  let entries: ListEntry[] = [];

  let lastResponse;
  while (lastResponse === undefined || !lastResponse.list_complete) {
    lastResponse = await event.env.KV.list({
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

  switch (entrydata[UuidMetadataKey.INSTALLATION_TYPE]) {
    case ShortInstallationType.OS:
      data.installation_types.os++;
      break;
    case ShortInstallationType.CONTAINER:
      data.installation_types.container++;
      break;
    case ShortInstallationType.CORE:
      data.installation_types.core++;
      break;
    case ShortInstallationType.SUPERVISED:
      data.installation_types.supervised++;
      break;
    case ShortInstallationType.UNSUPPORTED_THIRD_PARTY_CONTAINER:
      data.installation_types.unsupported_container++;
      break;
    case ShortInstallationType.UNKNOWN:
      data.installation_types.unknown++;
      break;
    default:
      break;
  }

  return data;
}

function combineEntryData(
  data: QueueData,
  entrydata: IncomingPayload,
  brandsDomains: Set<string>,
  osBoards: Set<string>
): QueueData {
  const reported_integrations = entrydata.integrations || [];
  const reported_custom_integrations = entrydata.custom_integrations || [];
  const reported_addons = entrydata.addons || [];

  data.versions[entrydata.version] = bumpValue(
    data.versions[entrydata.version]
  );

  if (entrydata.country) {
    data.countries[entrydata.country] = bumpValue(
      data.countries[entrydata.country]
    );
  }

  if (entrydata.operating_system) {
    if (osBoards.has(entrydata.operating_system.board)) {
      data.operating_system.boards[entrydata.operating_system.board] =
        bumpValue(
          data.operating_system.boards[entrydata.operating_system.board]
        );
      if (entrydata.operating_system.version) {
        data.operating_system.versions[entrydata.operating_system.version] =
          bumpValue(
            data.operating_system.versions[entrydata.operating_system.version]
          );
      }
    }
  }

  if (entrydata.supervisor) {
    if (entrydata.supervisor.arch) {
      data.supervisor.arch[entrydata.supervisor.arch] = bumpValue(
        data.supervisor.arch[entrydata.supervisor.arch]
      );
    }
    if (!entrydata.supervisor.supported) {
      data.supervisor.unsupported++;
    }
    if (!entrydata.supervisor.healthy) {
      data.supervisor.unhealthy++;
    }
  }

  switch (entrydata.installation_type) {
    case "Home Assistant OS":
      data.installation_types.os++;
      break;
    case "Home Assistant Container":
      data.installation_types.container++;
      break;
    case "Home Assistant Core":
      data.installation_types.core++;
      break;
    case "Home Assistant Supervised":
      data.installation_types.supervised++;
      break;
    case "Unsupported Third Party Container":
      data.installation_types.unsupported_container++;
      break;
    case "Unknown":
      data.installation_types.unknown++;
      break;
    default:
      break;
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

  if (reported_addons.length) {
    data.reports_addons++;
    for (const addon of reported_addons) {
      if (addon.slug.startsWith("local_")) {
        continue;
      }
      if (!data.addons[addon.slug]) {
        data.addons[addon.slug] = {
          total: 0,
          versions: {},
          protected: 0,
          auto_update: 0,
        };
      }
      data.addons[addon.slug].total++;

      if (addon.auto_update) {
        data.addons[addon.slug].auto_update++;
      }

      if (addon.protected) {
        data.addons[addon.slug].protected++;
      }

      if (addon.version) {
        data.addons[addon.slug].versions[addon.version] = bumpValue(
          data.addons[addon.slug].versions[addon.version]
        );
      }
    }
  }

  if (reported_custom_integrations.length) {
    for (const custom_integration of reported_custom_integrations) {
      if (!brandsDomains.has(custom_integration.domain)) {
        continue;
      }

      if (!data.custom_integrations[custom_integration.domain]) {
        data.custom_integrations[custom_integration.domain] = {
          total: 0,
          versions: {},
        };
      }
      data.custom_integrations[custom_integration.domain].total++;
      if (custom_integration.version) {
        data.custom_integrations[custom_integration.domain].versions[
          custom_integration.version
        ] = bumpValue(
          data.custom_integrations[custom_integration.domain].versions[
            custom_integration.version
          ]
        );
      }
    }
  }

  if (reported_integrations.length) {
    data.reports_integrations++;
    for (const integration of reported_integrations) {
      data.integrations[integration] = bumpValue(
        data.integrations[integration]
      );
    }
  }

  if (entrydata.energy && entrydata.energy.configured) {
    data.energy.count_configured++;
  }
  if (entrydata.certificate) {
    data.certificate_count_configured++;
  }

  if (entrydata.recorder) {
    if (!data.recorder.engines[entrydata.recorder.engine]) {
      data.recorder.engines[entrydata.recorder.engine] = {
        versions: {},
        count_configured: 0,
      };
    }
    data.recorder.engines[entrydata.recorder.engine].count_configured++;
    data.recorder.engines[entrydata.recorder.engine].versions[
      entrydata.recorder.version
    ] = bumpValue(
      data.recorder.engines[entrydata.recorder.engine].versions[
        entrydata.recorder.version
      ]
    );
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
      data.installation_types.unsupported_container +
      data.installation_types.unknown,
    avg_users: median(data.count_users),
    avg_automations: median(data.count_automations),
    avg_integrations: median(data.count_integrations),
    avg_addons: median(data.count_addons),
    avg_states: median(data.count_states),
    integrations: data.integrations,
    operating_system: data.operating_system,
    supervisor: data.supervisor,
    reports_integrations: data.reports_integrations,
    reports_addons: data.reports_addons,
    reports_statistics: data.reports_statistics,
    versions: data.versions,
    certificate_count_configured: data.certificate_count_configured,
    energy: {
      count_configured: data.energy.count_configured,
    },
    recorder: data.recorder,
  };
};
