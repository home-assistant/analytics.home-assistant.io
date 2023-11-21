
const COLORS = [
  "#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6",
  "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad",
  "#c0392b", "#d35400", "#7f8c8d", "#bdc3c7", "#95a5a6",
  "#f1c40f", "#2c3e50", "#1abc9c", "#7d3c98", "#9c640c",
  "#2874a6", "#626567", "#d68910", "#5499c7", "#af601a",
  "#45b39d", "#6c3483", "#283747", "#229954", "#76448a",
  "#52be80", "#a04000", "#1b4f72", "#f1948a", "#48c9b0",
  "#e57f84", "#a6acaf", "#935116", "#616a6b", "#d98880",
  "#73c6b6", "#85929e", "#922b21", "#884ea0", "#f7dc6f",
  "#b3b6b7", "#c39bd3", "#ec7063", "#85c1e9", "#e59866"
];

const used = {}

const getColor = (input) => {
  const formated = String(input).toLocaleLowerCase()
  if (used[formated]) {
    return used[formated]
  }

  const allUsed = new Set(Object.values(formated))
  let aviable = COLORS.filter(hex => !allUsed.has(hex))
  if (aviable.length === 0) {
    // No more colors!
    console.error("The list of colors needs to be extended")
    aviable = [...COLORS]
  }

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = aviable[Math.abs(hash & hash) % aviable.length];
  used[formated] = color
  return color
}

module.exports = { getColor };
