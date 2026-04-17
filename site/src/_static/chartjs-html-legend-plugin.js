const getOrCreateLegendList = (chart, layout) => {
  const legendContainer = chart.canvas.parentElement.querySelector(`.chart__legend`);
  if (!legendContainer) {
    throw new Error(`No legend container found`);
  }

  let listContainer = legendContainer.querySelector("div.chart__legend__container");
  if (!listContainer) {
    listContainer = document.createElement("div");
    listContainer.classList.add("chart__legend__container");
    if (layout === 'COLUMN') {
      listContainer.classList.add("chart__legend__container--column");
    }

    legendContainer.append(listContainer);
  }

  return listContainer;
};

const chartJsHtmlLegendPlugin = {
  id: "htmlLegend",
  afterUpdate(chart, arguments_) {
    if (arguments_.mode === "resize") {
      return;
    }
    const chartType = chart.config.type;
    const layout =
      chartType === "bar" || chartType === "line"
        ? 'ROW'
        : 'COLUMN';
    const container = getOrCreateLegendList(chart, layout);

    // Remove old legend items
    while (container.firstChild) {
      container.firstChild.remove();
    }

    const items = chart.legend.legendItems;
    for (const item of items) {
      const button = document.createElement("div");
      button.classList.add("chart__legend__button");
      button.addEventListener("click", () => {
        if (chartType === "pie" || chartType === "doughnut") {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(
            item.datasetIndex,
            !chart.isDatasetVisible(item.datasetIndex),
          );
        }
        chart.update();
      });

      // Color
      const colorSpan = document.createElement("span");
      colorSpan.classList.add("chart__legend__color");
      colorSpan.style.background = item.fillStyle;
      colorSpan.style.borderColor = item.strokeStyle;
      colorSpan.style.borderWidth = item.lineWidth + "px";
      button.append(colorSpan);

      // Text
      const textContainer = document.createElement("span");
      textContainer.classList.add("chart__legend__text");
      textContainer.style.textDecoration = item.hidden ? "line-through" : "";
      const labelNode = document.createTextNode(item.text);
      button.append(textContainer);

      const dataset = chart.data.datasets[item.datasetIndex || 0];
      if (chartType === "pie" || chartType === "doughnut") {
        const sum = dataset.data.reduce((accumulator, value) => accumulator + value, 0);
        const current = dataset.data[item.index];
        const boldNumberContainer = document.createElement("strong");
        boldNumberContainer.classList.add(
          "chart__legend__text",
          "chart__legend__text--bold",
        );
        const numberNode = document.createTextNode(current.toLocaleString());
        let percentNode = undefined;

        if (sum && current) {
          const percented = (100 * current / sum).toFixed(2);
          percentNode = document.createTextNode(`(${percented} %)`);
        }

        textContainer.append(labelNode);
        boldNumberContainer.append(numberNode);
        button.append(boldNumberContainer);

        if (percentNode) {
          const boldPercentContainer = document.createElement("strong");
          boldPercentContainer.classList.add(
            "chart__legend__text",
            "chart__legend__text--bold",
            "chart__legend__text--percent",
          );
          boldPercentContainer.append(percentNode);
          button.append(boldPercentContainer);
        }
      } else {
        textContainer.append(labelNode);
      }

      container.append(button);
    }
  },
};

window.chartJsHtmlLegendPlugin = chartJsHtmlLegendPlugin;
