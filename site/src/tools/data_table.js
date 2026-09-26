const colors = require("./colors");

const DataPoint = (data) => ({
  borderWidth: 1,
  pointRadius: 1.75,
  fill: false,
  borderColor: colors.getColor(data.label),
  backgroundColor: colors.getColor(data.label),
  ...data,
});

const SortTableData = (tableData) =>
  tableData
    .sort((a, b) => b.installations - a.installations)
    .map((entry, idx) => ({ ...entry, idx: idx + 1 }));

// Competition rank: rows with the same count share a rank, so a move inside a
// tie does not show up as a position change.
const rankByDomain = (rows) => {
  const ranks = {};
  rows.forEach((row, idx) => {
    const before = rows[idx - 1];
    ranks[row.domain] =
      before && before.installations === row.installations
        ? ranks[before.domain]
        : idx + 1;
  });
  return ranks;
};

// Adds the change against an earlier ranking of the same rows. Only fields
// derived from the known rows are added, so no reported key reaches the page.
// Zero and false values are left out to keep the page small.
const CompareTableData = (entries, previous) => {
  const before = Object.fromEntries(previous.map((entry) => [entry.domain, entry]));
  const rankNow = rankByDomain(entries);
  const rankBefore = rankByDomain(previous);
  return entries.map((entry) => {
    const old = before[entry.domain];
    const oldInstallations = old ? old.installations : 0;
    const change = {};
    if (entry.installations > 0 && oldInstallations === 0) {
      change.is_new = true;
    }
    if (entry.installations !== oldInstallations) {
      change.installations_change = entry.installations - oldInstallations;
    }
    if (old && rankBefore[entry.domain] !== rankNow[entry.domain]) {
      change.position_change = rankBefore[entry.domain] - rankNow[entry.domain];
    }
    return { ...entry, ...change };
  });
};

module.exports = { DataPoint, SortTableData, CompareTableData };
