import { WorkerEvent } from "../data";

export const groupVersions = (
  event: WorkerEvent,
  versions: Record<string, number>
) => {
  const releases: Record<string, number> = {};
  const releases_filtered: Record<string, number> = {};
  const filterLowerLimit = event.env.WORKER_ENV === "dev" ? 10 : 100;

  Object.keys(versions).forEach((version) => {
    const key: string = version.split(".").slice(0, 2).join(".");
    releases[key] = (releases[key] || 0) + versions[version];
  });

  Object.keys(releases)
    .filter((key) => releases[key] > filterLowerLimit)
    .forEach((key) => {
      releases_filtered[key] = releases[key];
    });

  return releases_filtered;
};
