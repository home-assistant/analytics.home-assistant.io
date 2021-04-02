import "@google-web-components/google-chart";
import { css, customElement, html, LitElement, property } from "lit-element";
import { AnalyticsData } from "./data";

const isDarkMode = matchMedia("(prefers-color-scheme: dark)").matches;
const isMobile = matchMedia("(max-width: 600px)").matches;

@customElement("analytics-active-installations")
export class AnalyticsActiveInstallations extends LitElement {
  @property({ attribute: false }) public data?: AnalyticsData;

  render() {
    if (this.data === undefined) {
      return html``;
    }

    const dataKeys = Object.keys(this.data!);
    const lastEntry = this.data![dataKeys[dataKeys.length - 1]];

    const rows = dataKeys.map((timestamp) => [
      new Date(Number(timestamp)),
      this.data![timestamp].active_installations,
    ]);

    return html`
      <google-chart
        type="line"
        .cols=${[
          { label: "Date", type: "date" },
          { label: "Total", type: "number" },
        ]}
        .options=${{
          title: `${lastEntry.active_installations} Active Home Assistant Installations`,
          chartArea: { width: "70%", height: "50%" },
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          titleTextStyle: {
            color: isDarkMode ? "#e1e1e1" : "#212121",
          },
          legend: { position: "none" },
          hAxis: {
            titleTextStyle: {
              color: isDarkMode ? "#e1e1e1" : "#212121",
            },
          },
          vAxis: {
            title: "Active installations",
            titleTextStyle: {
              color: isDarkMode ? "#e1e1e1" : "#212121",
            },
          },
        }}
        .rows=${rows}
      >
      </google-chart>
      <google-chart
        type="pie"
        .cols=${[
          { label: "Installation type", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .options=${{
          chartArea: { width: "100%", height: "50%" },
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
      display: flex;
      flex-direction: row;
    }
    google-chart {
      height: 500px;
      width: 50%;
    }

    @media only screen and (max-width: 600px) {
      :host {
        flex-direction: column;
      }
      google-chart {
        width: 100%;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-active-installations": AnalyticsActiveInstallations;
  }
}
