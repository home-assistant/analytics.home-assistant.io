import { SCHEMA_VERSION_ANALYTICS } from "../../src/data";
import { migrateAnalyticsData } from "../../src/utils/migrate";

describe("migrateAnalyticsData", function () {
  it("migrate from no version", function () {
    const data = {
      "1": { active_installations: 3 },
      "2": { reports_integrations: 1337, active_installations: 3 },
    };
    const migrated = migrateAnalyticsData(data);

    expect(migrated.history[0].active_installations).toBe(3);
    expect(migrated.history.length).toBe(1);
    expect(migrated.current.reports_integrations).toBe(1337);
    expect(migrated.current.reported_from).toBe(3);
    expect(migrated.current).not.toContain("active_installations");
  });

  it("migrate from no data", function () {
    expect(migrateAnalyticsData(null).schema_version).toBe(
      SCHEMA_VERSION_ANALYTICS
    );
    expect(migrateAnalyticsData(undefined).schema_version).toBe(
      SCHEMA_VERSION_ANALYTICS
    );
    expect(migrateAnalyticsData({}).schema_version).toBe(
      SCHEMA_VERSION_ANALYTICS
    );
  });
});
