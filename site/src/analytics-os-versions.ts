import { customElement, html, LitElement, property } from "lit-element";
import { AnalyticsDataCurrent } from "../../worker/src/data";
import "./components/analytics-chart";

@customElement("analytics-os-versions")
export class AnalyticsOsVersions extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  render() {
    if (
      this.currentData === undefined ||
      Object.keys(this.currentData.operating_system.versions).length === 0
    ) {
      return html``;
    }

    const sortedVersions = Object.keys(
      this.currentData.operating_system.versions
    ).sort(
      (a, b) =>
        this.currentData!.operating_system.versions[b] -
        this.currentData!.operating_system.versions[a]
    );

    const rows = sortedVersions
      .slice(0, 5)
      .map((version) => [
        version,
        this.currentData!.operating_system.versions[version],
      ]);

    if (sortedVersions.length > 5) {
      rows.push([
        "Other",
        sortedVersions
          .slice(5)
          .reduce(
            (accumulator, currentValue) =>
              accumulator +
              this.currentData!.operating_system.versions[currentValue],
            0
          ),
      ]);
    }

    return html`
      <analytics-chart
        chartType="pie"
        .columns=${[
          { label: "Version", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .rows=${rows}
        .options=${{ title: "Top 5 used operating system versions" }}
        .isDarkMode=${this.isDarkMode}
        .isMobile=${this.isMobile}
      >
      </analytics-chart>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-os-versions": AnalyticsOsVersions;
  }
}
