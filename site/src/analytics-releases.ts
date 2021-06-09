import { css, customElement, html, LitElement, property } from "lit-element";
import { AnalyticsDataCurrent } from "../../worker/src/data";
import "./components/analytics-chart";

@customElement("analytics-releases")
export class AnalyticsReleases extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  render() {
    if (this.currentData === undefined) {
      return html``;
    }

    const releases = Object();

    Object.keys(this.currentData.versions)
      .forEach((version) => {
        const key: string = version.split(".").slice(0, 2).join(".");
        releases[key] =
          (releases[key] || 0) + this.currentData!.versions[version];
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
      })
      .map((key) => [key, releases[key]]);

    const rows = allRows.slice(0, 5);
    if (allRows.length > 5) {
      rows.push([
        "Other",
        allRows
          .slice(5)
          .reduce(
            (accumulator, item) => accumulator + item[1],
            0
          ),
      ]);
    }

    return html`
      <analytics-chart
        chartType="pie"
        .columns=${[
          { label: "Release", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .rows=${rows}
        .options=${{ title: "Last releases" }}
        .isDarkMode=${this.isDarkMode}
        .isMobile=${this.isMobile}
      >
      </analytics-chart>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-releases": AnalyticsReleases;
  }
}
