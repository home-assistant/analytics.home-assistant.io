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
      "1": { active_installations: 3 },
      "2": { reports_integrations: 1337, active_installations: 3 },
    };
    const migrated = migrateAnalyticsData(MockSentry, data);

    expect(MockSentry.addBreadcrumb).toBeCalledWith({
      message: "Migration started from before we had version",
    });
    expect(MockSentry.addBreadcrumb).toBeCalledWith({
      message: "Migration complete",
    });

    expect(migrated.history[0].active_installations).toBe(3);
    expect(migrated.history.length).toBe(1);
    expect(migrated.current.reports_integrations).toBe(1337);
    expect(migrated.current.extened_data_from).toBe(3);
  });

  it("migrate from no data", function () {
    expect(migrateAnalyticsData(MockSentry, null).schema_version).toBe(
      SCHEMA_VERSION_ANALYTICS
    );
    expect(MockSentry.addBreadcrumb).toHaveBeenLastCalledWith({
      message: "No data, return base object",
    });

    expect(migrateAnalyticsData(MockSentry, undefined).schema_version).toBe(
      SCHEMA_VERSION_ANALYTICS
    );
    expect(MockSentry.addBreadcrumb).toHaveBeenLastCalledWith({
      message: "No data, return base object",
    });

    expect(migrateAnalyticsData(MockSentry, {}).schema_version).toBe(
      SCHEMA_VERSION_ANALYTICS
    );
    expect(MockSentry.addBreadcrumb).toHaveBeenLastCalledWith({
      message: "No data, return base object",
    });
  });
});
