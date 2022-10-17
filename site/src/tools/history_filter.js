const moment = require("moment");
const memoize = require("memoize-one");

const calculate = require("./calculate");

const groupedCutoff = {
  yearly: moment().subtract({ years: 1 }).startOf("year"),
  monthly: moment().subtract({ months: 2 }).startOf("month"),
  weekly: moment().subtract({ weeks: 2 }).startOf("week"),
};

const calculateMedian = (entries) =>
  calculate.median(entries.filter((entry) => entry !== 0));

module.exports = historyFiltering = memoize((history) => {
  const grouped = { yearly: {}, monthly: {}, weekly: {}, daily: {} };
  const results = [];

  for (const entry of history) {
    const date = moment(Number(entry.timestamp));
    if (date > groupedCutoff.weekly) {
      if (!grouped.daily[date.format("DD")]) {
        grouped.daily[date.format("DD")] = [];
      }
      grouped.daily[date.format("DD")].push(entry);
    } else if (date > groupedCutoff.monthly) {
      if (!grouped.weekly[date.format("WW")]) {
        grouped.weekly[date.format("WW")] = [];
      }
      grouped.weekly[date.format("WW")].push(entry);
    } else if (date > groupedCutoff.yearly) {
      if (!grouped.monthly[date.format("YYYYMM")]) {
        grouped.monthly[date.format("YYYYMM")] = [];
      }
      grouped.monthly[date.format("YYYYMM")].push(entry);
    } else {
      if (!grouped.yearly[date.format("YYYY")]) {
        grouped.yearly[date.format("YYYY")] = [];
      }
      grouped.yearly[date.format("YYYY")].push(entry);
    }
  }

  for (const section of Object.keys(grouped)) {
    for (const entry of Object.keys(grouped[section])) {
      const data = {
        timestamp:
          moment(Number(grouped[section][entry][0].timestamp))
            .startOf(
              section === "yearly"
                ? "year"
                : section === "monthly"
                ? "month"
                : section === "weekly"
                ? "week"
                : "day"
            )
            .add({
              months: section === "yearly" ? 6 : 0,
              days: section === "monthly" ? 15 : section === "weekly" ? 3 : 0,
              hours: section === "daily" ? 12 : 0,
            })
            .unix() * 1000,
        active_installations: calculateMedian(
          grouped[section][entry].map((data) => data.active_installations)
        ),
        installation_types: {
          os: calculateMedian(
            grouped[section][entry].map((data) => data.installation_types.os)
          ),
          container: calculateMedian(
            grouped[section][entry].map(
              (data) => data.installation_types.container
            )
          ),
          core: calculateMedian(
            grouped[section][entry].map((data) => data.installation_types.core)
          ),
          supervised: calculateMedian(
            grouped[section][entry].map(
              (data) => data.installation_types.supervised
            )
          ),
          unsupported_container: calculateMedian(
            grouped[section][entry].map(
              (data) => data.installation_types.unsupported_container
            )
          ),
          unknown: calculateMedian(
            grouped[section][entry].map(
              (data) => data.installation_types.unknown
            )
          ),
        },
        versions: {},
      };

      const allVersions = new Set();
      grouped[section][entry].forEach((data) =>
        Object.keys(data.versions || {}).forEach((version) => {
          allVersions.add(version);
        })
      );

      for (const version of allVersions) {
        data.versions[version] = calculateMedian(
          grouped[section][entry].map((data) =>
            data.versions ? data.versions[version] : 0
          )
        );
      }
      results.push(data);
    }
  }
  return results.sort((a, b) => a.timestamp - b.timestamp);
});
