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

    const rows = Object.keys(this.data).map((timestamp) => [
      new Date(Number(timestamp)),
      this.data![timestamp].active_installations,
      this.data![timestamp].installation_types.os,
      this.data![timestamp].installation_types.container,
      this.data![timestamp].installation_types.core,
      this.data![timestamp].installation_types.supervised,
    ]);

    return html`
      <google-chart
        type="line"
        .cols=${[
          { label: "Date", type: "date" },
          { label: "Total", type: "number" },
          { label: "Operating System", type: "number" },
          { label: "Container", type: "number" },
          { label: "Core", type: "number" },
          { label: "Supervised", type: "number" },
        ]}
        .options=${{
          title: "Active Home Assistant Installations",
          chartArea: { width: "70%", height: "80%" },
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
          hAxis: {
            title: "Date",
            titleTextStyle: {
              color: isDarkMode ? "#e1e1e1" : "#212121",
            },
          },
          vAxis: {
            title: "Active installations",
            logScale: true,
            titleTextStyle: {
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
    google-chart {
      height: 500px;
      width: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-active-installations": AnalyticsActiveInstallations;
  }
}
