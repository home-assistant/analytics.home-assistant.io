const average = (input) => input.reduce((a, b) => a + b, 0) / input.length;

const median = (input) => {
  const values = input.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  return values.length % 2 ? values[half] : (values[half - 1] + values[half]) / 2.0 || 0;
}

const percentage = (total, part, decimal) => +((100 * part) / total).toFixed(decimal || 2)


module.exports = { average, median, percentage }