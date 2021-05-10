import { SCHEMA_VERSION_ANALYTICS } from "../../src/data";
import { migrateAnalyticsData } from "../../src/utils/migrate";
import { MockedSentry } from "../mock";

describe("migrateAnalyticsData", function () {
  let MockSentry;

  beforeEach(() => {
    MockSentry = MockedSentry();
  });

  it("migrate from no version", function () {
    const data = {
      "2": { active_installations: 2 },
      "4": { active_installations: 4 },
      "1": { active_installations: 1 },
      "3": { active_installations: 3 },
      "5": { reports_integrations: 1337, active_installations: 5 },
    };
    const migrated = migrateAnalyticsData(data);

    expect(migrated.history[0].active_installations).toBe(1);
    expect(migrated.history.length).toBe(4);
    expect(migrated.current.reports_integrations).toBe(1337);
    expect(migrated.current.extended_data_from).toBe(5);
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
  it("migrate from lower than 2", function () {
    expect(
      migrateAnalyticsData({}).current.operating_system.versions
    ).toBeDefined();
    expect(
      migrateAnalyticsData({}).current.operating_system.boards
    ).toBeDefined();
  });
});
