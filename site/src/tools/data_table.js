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

module.exports = { DataPoint, SortTableData };
