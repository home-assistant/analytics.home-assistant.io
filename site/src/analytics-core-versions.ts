import { css, customElement, html, LitElement, property } from "lit-element";
import { AnalyticsDataCurrent } from "../../worker/src/data";
import "./components/analytics-chart";

@customElement("analytics-core-versions")
export class AnalyticsCoreVersions extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  render() {
    if (this.currentData === undefined) {
      return html``;
    }

    const sortedVersions = Object.keys(this.currentData.versions).sort(
      (a, b) => this.currentData!.versions[b] - this.currentData!.versions[a]
    );

    const rows = sortedVersions
      .slice(0, 5)
      .map((version) => [version, this.currentData!.versions[version]]);

    rows.push([
      "Other",
      sortedVersions
        .slice(5)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + this.currentData!.versions[currentValue],
          0
        ),
    ]);

    return html`
      <analytics-chart
        chartType="pie"
        .columns=${[
          { label: "Version", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .rows=${rows}
        .options=${{ title: "Top 5 used core versions" }}
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
    "analytics-core-versions": AnalyticsCoreVersions;
  }
}
