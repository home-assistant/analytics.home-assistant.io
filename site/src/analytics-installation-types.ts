import "@google-web-components/google-chart";
import { css, customElement, html, LitElement, property } from "lit-element";
import { AnalyticsData } from "./data";

const isDarkMode = matchMedia("(prefers-color-scheme: dark)").matches;
const isMobile = matchMedia("(max-width: 600px)").matches;

@customElement("analytics-installation-types")
export class AnalyticsInstallationTypes extends LitElement {
  @property({ attribute: false }) public data?: AnalyticsData;

  render() {
    if (this.data === undefined) {
      return html``;
    }

    const dataKeys = Object.keys(this.data);
    const lastEntry = this.data[dataKeys[dataKeys.length - 1]];

    return html`
      <google-chart
        type="pie"
        .cols=${[
          { label: "Installation type", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .options=${{
          title: "Installation types",
          chartArea: { width: "70%", height: "70%" },
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
        .rows=${[
          ["Operating System", lastEntry.installation_types.os],
          ["Container", lastEntry.installation_types.container],
          ["Core", lastEntry.installation_types.core],
          ["Supervised", lastEntry.installation_types.supervised],
        ]}
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
