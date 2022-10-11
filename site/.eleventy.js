const historyFiltering = require("./src/tools/history_filter");
const calculate = require("./src/tools/calculate");
const colors = require("./src/tools/colors");

const friendlyBoardName = {
  "intel-nuc": "Intel NUC",
  "generic-aarch64": "Generic AArch64",
  "generic-x86-64": "Generic x86-64",
  "khadas-vim3": "Khadas VIM3",
  ova: "Virtual Machine",
  "odroid-c2": "ODROID-C2",
  "odroid-c4": "ODROID-C4",
  "odroid-n2": "ODROID-N2",
  "odroid-xu4": "ODROID-XU4",
  rpi: "Raspberry Pi",
  rpi0: "Raspberry Pi Zero",
  "rpi0-w": "Raspberry Pi Zero W",
  rpi2: "Raspberry Pi 2",
  rpi3: "Raspberry Pi 3 (32-bit)",
  "rpi3-64": "Raspberry Pi 3",
  rpi4: "Raspberry Pi 4 (32-bit)",
  "rpi4-64": "Raspberry Pi 4",
  tinker: "ASUS Tinker Board",
  yellow: "Home Assistant Yellow",
};

const dataPoint = (data) => ({
  borderWidth: 1,
  pointRadius: 0,
  fill: false,
  borderColor: colors.getColor(data.label),
  ...data,
});

const sortTableData = (tableData) =>
  tableData
    .sort((a, b) => b.installations - a.installations)
    .map((entry, idx) => ({ ...entry, idx: idx + 1 }));

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/_static": "static" });
  eleventyConfig.addPassthroughCopy({
    "../node_modules/svgmap/dist/svgMap.min.css": "static/svgMap.min.css",
    "../node_modules/svgmap/dist/svgMap.min.js": "static/svgMap.min.js",
    "../node_modules/chart.js/dist/chart.min.js": "static/chart.min.js",
    "../node_modules/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js":
      "static/chartjs-adapter-date-fns.bundle.min.js",
    "../node_modules/svg-pan-zoom/dist/svg-pan-zoom.min.js":
      "static/svg-pan-zoom.min.js",
  });

  eleventyConfig.addFilter("historyFiltering", (history) =>
    historyFiltering(history)
  );
  eleventyConfig.addFilter("countriesForMap", (base) =>
    JSON.stringify(
      Object.keys(base || {}).reduce(
        (obj, key) => ({ ...obj, [key]: { installations: base[key] || 0 } }),
        {}
      )
    )
  );
  eleventyConfig.addFilter("calculatePercentage", (total, part, decimal) =>
    calculate.percentage(total, part, decimal)
  );
  eleventyConfig.addFilter("formatNumber", (value) =>
    Intl.NumberFormat().format(value)
  );
  eleventyConfig.addFilter("keys", (data) => Object.keys(data));
  eleventyConfig.addFilter("values", (data) => Object.values(data));

  eleventyConfig.addFilter("randomColor", (input) => colors.getColor(input));
  eleventyConfig.addFilter("randomColors", (input) =>
    JSON.stringify(input.map((entry) => colors.getColor(entry)))
  );

  eleventyConfig.addFilter("versionSummary", (data) => {
    const releases = Object();
    const results = {};

    Object.keys(data).forEach((version) => {
      if (!version.includes("dev")) {
        const key = version.split(".").slice(0, 2).join(".");
        releases[key] = (releases[key] || 0) + data[version];
      }
    });

    const allRows = Object.keys(releases)
      .filter((key) => releases[key] > 100)
      .sort((a, b) => {
        const mainVersionCmp =
          parseInt(b.split(".")[0]) - parseInt(a.split(".")[0]);
        if (mainVersionCmp !== 0) {
          return mainVersionCmp;
        }
        return parseInt(b.split(".")[1]) - parseInt(a.split(".")[1]);
      });

    allRows.slice(0, 5).forEach((version) => {
      results[version] = releases[version];
    });

    if (allRows.length > 5) {
      results["Other"] = allRows
        .slice(5)
        .reduce((accumulator, item) => accumulator + releases[item], 0);
    }

    return results;
  });

  eleventyConfig.addFilter("osVersionSummary", (data) => {
    const results = {};

    const sortedVersions = Object.keys(data).sort((a, b) => data[b] - data[a]);
    sortedVersions.slice(0, 5).forEach((version) => {
      results[version] = data[version];
    });

    if (sortedVersions.length > 5) {
      results["Other"] = sortedVersions
        .slice(5)
        .reduce(
          (accumulator, currentValue) => accumulator + data[currentValue],
          0
        );
    }

    return results;
  });

  eleventyConfig.addFilter("sortBoards", (value) => {
    const data = { data: [], labels: [], backgroundColor: [] };
    Object.keys(value)
      .sort()
      .forEach((key) => {
        data.labels.push(friendlyBoardName[key] || key);
        data.data.push(value[key]);
        data.backgroundColor.push(
          colors.getColor(friendlyBoardName[key] || key)
        );
      });
    return data;
  });

  eleventyConfig.addFilter("mergeInstallationHistory", (history) => {
    const data = { total: [], os: [], core: [], supervised: [], container: [] };

    for (const entry of historyFiltering(history)) {
      data.total.push({ x: entry.timestamp, y: entry.active_installations });
      data.os.push({ x: entry.timestamp, y: entry.installation_types.os });
      data.core.push({ x: entry.timestamp, y: entry.installation_types.core });
      data.supervised.push({
        x: entry.timestamp,
        y: entry.installation_types.supervised,
      });
      data.container.push({
        x: entry.timestamp,
        y: entry.installation_types.container,
      });
    }

    return JSON.stringify([
      dataPoint({ data: data.total, label: "Total" }),
      dataPoint({ data: data.os, label: "Operating System" }),
      dataPoint({ rdata: data.container, label: "Container" }),
      dataPoint({ data: data.core, label: "Core" }),
      dataPoint({ data: data.supervised, label: "Supervised" }),
    ]);
  });

  eleventyConfig.addFilter("mergeVersionHistory", (history) => {
    const allVersions = new Set();
    const versionHistoryData = historyFiltering(history);

    for (const entry of versionHistoryData) {
      Object.keys(entry.versions).forEach((version) =>
        allVersions.add(version)
      );
    }

    const versionsOrdered = Array.from(allVersions).sort((a, b) => {
      const mainVersionCmp =
        parseInt(b.split(".")[0]) - parseInt(a.split(".")[0]);
      if (mainVersionCmp !== 0) {
        return mainVersionCmp;
      }
      return parseInt(b.split(".")[1]) - parseInt(a.split(".")[1]);
    });

    const versions = {};
    versionsOrdered.forEach((entry) => {
      versions[entry] = [];
    });

    versionHistoryData.forEach((entry) => {
      versionsOrdered.forEach((version) => {
        if (entry.versions[version] || 0 > 100) {
          versions[version].push({
            x: Number(entry.timestamp),
            y: entry.versions[version] || 0,
          });
        }
      });
    });
    return JSON.stringify(
      Object.keys(versions).map((version) =>
        dataPoint({ data: versions[version], label: version })
      )
    );
  });

  eleventyConfig.addFilter(
    "sortIntegrations",
    (integrations, integration_details, excluded_domains) =>
      sortTableData(
        Object.keys(integration_details)
          .filter(
            (domain) =>
              integration_details[domain].quality_scale !== "internal" &&
              !excluded_domains.includes(domain)
          )
          .map((domain) => ({
            domain,
            name: integration_details[domain].title,
            installations: integrations[domain] || 0,
          }))
      )
  );

  eleventyConfig.addFilter("sortAddons", (addons, addons_details) =>
    sortTableData(
      Object.keys(addons_details).map((slug) => ({
        slug,
        name: addons_details[slug].name,
        icon: addons_details[slug].icon,
        documentation: addons_details[slug].documentation,
        installations: addons[slug]?.total || 0,
      }))
    )
  );

  return {
    dir: {
      input: "src",
      output: "dist",
      layouts: "_layouts",
      data: "_data",
      htmlTemplateEngine: "liquid",
    },
  };
};
