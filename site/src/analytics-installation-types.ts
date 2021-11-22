import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AnalyticsDataCurrent } from "../../worker/src/data";
import "./components/analytics-chart";

@customElement("analytics-installation-types")
export class AnalyticsInstallationTypes extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  render() {
    if (this.currentData === undefined) {
      return html``;
    }

    const rows = [
      ["Operating System", this.currentData.installation_types.os],
      ["Container", this.currentData.installation_types.container],
      ["Supervised", this.currentData.installation_types.supervised],
      ["Core", this.currentData.installation_types.core],
    ];

    return html`
      <analytics-chart
        chartType="pie"
        .columns=${[
          { label: "Installation type", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .rows=${rows}
        .options=${{
          title: "Installation types",
          slices: {
            0: { color: "#dc3912" },
            1: { color: "#ff9900" },
            2: { color: "#109618" },
            3: { color: "#990099" },
          },
        }}
        .isDarkMode=${this.isDarkMode}
        .isMobile=${this.isMobile}
      >
      </analytics-chart>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-installation-types": AnalyticsInstallationTypes;
  }
}
