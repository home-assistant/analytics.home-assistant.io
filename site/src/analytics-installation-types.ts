import "@google-web-components/google-chart";
import { css, customElement, html, LitElement, property } from "lit-element";
import { Analytics } from "./data";

const isDarkMode = matchMedia("(prefers-color-scheme: dark)").matches;
const isMobile = matchMedia("(max-width: 600px)").matches;

@customElement("analytics-installation-types")
export class AnalyticsInstallationTypes extends LitElement {
  @property({ attribute: false }) public lastDataEntry?: Analytics;

  render() {
    if (this.lastDataEntry === undefined) {
      return html``;
    }

    const rows = [
      ["Operating System", this.lastDataEntry.installation_types.os],
      ["Container", this.lastDataEntry.installation_types.container],
      ["Supervised", this.lastDataEntry.installation_types.supervised],
      ["Core", this.lastDataEntry.installation_types.core],
    ];

    return html`
      <google-chart
        type="pie"
        .cols=${[
          { label: "Installation type", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .options=${{
          title: "Installation types",
          chartArea: {
            width: isMobile ? "100%" : "70%",
            height: isMobile ? "80%" : "70%",
          },
          slices: {
            0: { color: "#dc3912" },
            1: { color: "#ff9900" },
            2: { color: "#109618" },
            3: { color: "#990099" },
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
    "analytics-installation-types": AnalyticsInstallationTypes;
  }
}
