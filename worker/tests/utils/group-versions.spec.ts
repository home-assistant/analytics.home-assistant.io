import { groupVersions } from "../../src/utils/group-versions";

const sampleData = {
  "1970.1.0": 11,
  "2021.4.0": 60,
  "2021.4.1": 30,
  "2021.4.2": 20,
  "2021.5.0b0": 100,
  "2021.5.0": 20,
  "2021.5.5": 30,
  "2021.6.0.dev20210517": 8,
  "2021.6.0.dev20210506": 11,
  "2021.6.0": 100,
  "2021.7.0.dev20210601": 7,
};

describe("groupVersions", function () {
  afterEach(() => {
    (global as any).WORKER_ENV = undefined;
  });

  it("test dev", function () {
    (global as any).WORKER_ENV = "dev";
    expect(groupVersions(sampleData)).toStrictEqual({
      "1970.1": 11,
      "2021.4": 110,
      "2021.5": 150,
      "2021.6": 119,
    });
  });

  it("test production", function () {
    (global as any).WORKER_ENV = "production";
    expect(groupVersions(sampleData)).toStrictEqual({
      "2021.4": 110,
      "2021.5": 150,
      "2021.6": 119,
    });
  });
});
