const fs = require("fs");
const isWsl = fs
  .readFileSync("/proc/version", "utf-8")
  .toLocaleLowerCase()
  .includes("microsoft");

export default {
  server: {
    watch: { usePolling: isWsl },
  },
};
