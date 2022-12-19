const calculate = require("./src/tools/calculate");
const colors = require("./src/tools/colors");
const dataTable = require("./src/tools/data_table");
const friendlyNames = require("./src/tools/friendly_names");
const historyFiltering = require("./src/tools/history_filter");
const versionTools = require("./src/tools/versions");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/_static": "static" });
  eleventyConfig.addPassthroughCopy({
    "../node_modules/svgmap/dist/svgMap.min.css": "static/svgMap.min.css",
    "../node_modules/svgmap/dist/svgMap.min.js": "static/svgMap.min.js",
    "../node_modules/chart.js/dist/chart.umd.js": "static/chart.umd.js",
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

  eleventyConfig.addFilter("versionSummary", (data) =>
    versionTools.sortedVersions(data, true)
  );

  eleventyConfig.addFilter("osVersionSummary", (data) =>
    versionTools.sortedVersions(data)
  );

  eleventyConfig.addFilter("sortBoards", (value) => {
    const data = { data: [], labels: [], backgroundColor: [] };

    for (const key of Object.keys(value).sort()) {
      data.labels.push(friendlyNames.HaOsBoard[key] || key);
      data.data.push(value[key]);
      data.backgroundColor.push(
        colors.getColor(friendlyNames.HaOsBoard[key] || key)
      );
    }

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
      dataTable.DataPoint({ data: data.total, label: "Total" }),
      dataTable.DataPoint({ data: data.os, label: "Operating System" }),
      dataTable.DataPoint({ data: data.container, label: "Container" }),
      dataTable.DataPoint({ data: data.core, label: "Core" }),
      dataTable.DataPoint({ data: data.supervised, label: "Supervised" }),
    ]);
  });

  eleventyConfig.addFilter("mergeVersionHistory", (history) => {
    const allVersions = new Set();
    const versionHistoryData = historyFiltering(history);

    for (const entry of versionHistoryData) {
      for (const version of Object.keys(entry.versions)) {
        allVersions.add(version);
      }
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

    for (const entry of versionHistoryData) {
      for (const version of versionsOrdered) {
        if (entry.versions[version] || 0 > 100) {
          if (!versions[version]) {
            versions[version] = [];
          }
          versions[version].push({
            x: Number(entry.timestamp),
            y: entry.versions[version] || 0,
          });
        }
      }
    }

    return JSON.stringify(
      Object.keys(versions).map((version) =>
        dataTable.DataPoint({ data: versions[version], label: version })
      )
    );
  });

  eleventyConfig.addFilter(
    "sortIntegrations",
    (integrations, integration_details, excluded_domains) =>
      dataTable.SortTableData(
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
    dataTable.SortTableData(
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
