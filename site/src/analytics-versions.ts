import "@google-web-components/google-chart";
import { css, customElement, html, LitElement, property } from "lit-element";
import { Analytics } from "./data";

const isDarkMode = matchMedia("(prefers-color-scheme: dark)").matches;
const isMobile = matchMedia("(max-width: 600px)").matches;

@customElement("analytics-versions")
export class AnalyticsVersions extends LitElement {
  @property({ attribute: false }) public lastDataEntry?: Analytics;

  render() {
    if (this.lastDataEntry === undefined) {
      return html``;
    }

    const sortedVersions = Object.keys(this.lastDataEntry.versions).sort(
      (a, b) =>
        this.lastDataEntry!.versions[b] - this.lastDataEntry!.versions[a]
    );

    const rows = sortedVersions
      .slice(0, 4)
      .map((version) => [version, this.lastDataEntry!.versions[version]]);
    rows.push([
      "Other",
      sortedVersions
        .slice(4)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + this.lastDataEntry!.versions[currentValue],
          0
        ),
    ]);

    return html`
      <google-chart
        type="pie"
        .cols=${[
          { label: "Version", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .options=${{
          title: "Top 5 used versions",
          chartArea: {
            width: isMobile ? "100%" : "70%",
            height: isMobile ? "80%" : "70%",
          },
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          titleTextStyle: {
            color: isDarkMode ? "#e1e1e1" : "#212121",
          },
          legend: {
            position: isMobile ? "top" : "right",
            alignment: "start",
            textStyle: {
              color: isDarkMode ? "#e1e1e1" : "#212121",
            },
          },
        }}
        .rows=${rows}
      >
      </google-chart>
    `;
  }

  static styles = css`
    :host {
      display: block;
      width: calc(100% - 32px);
      margin: 16px;
    }

    google-chart {
      height: 500px;
      width: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-versions": AnalyticsVersions;
  }
}
