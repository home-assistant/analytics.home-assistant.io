import "@google-web-components/google-chart";
import type { GoogleChart } from "@google-web-components/google-chart";
import {
  css,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  query,
} from "lit-element";
import { AnalyticsData } from "./data";

@customElement("analytics-active-installations")
export class AnalyticsActiveInstallations extends LitElement {
  @property({ attribute: false }) public data?: AnalyticsData;

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  @query("google-chart") private _chart?: GoogleChart;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    window.addEventListener("resize", () => {
      this._chart?.redraw();
    });
  }

  render() {
    if (this.data === undefined) {
      return html``;
    }

    const dataKeys = Object.keys(this.data!);
    const lastEntry = this.data![dataKeys[dataKeys.length - 1]];

    const rows = dataKeys.map((timestamp) => [
      new Date(Number(timestamp)),
      this.data![timestamp].active_installations,
      this.data![timestamp].installation_types.os,
      this.data![timestamp].installation_types.container,
      this.data![timestamp].installation_types.supervised,
      this.data![timestamp].installation_types.core,
    ]);

    return html`
      <google-chart
        type="line"
        .cols=${[
          { label: "Date", type: "date" },
          { label: "Total", type: "number" },
          { label: "Operating System", type: "number" },
          { label: "Container", type: "number" },
          { label: "Supervised", type: "number" },
          { label: "Core", type: "number" },
        ]}
        .options=${{
          title: `${lastEntry.active_installations} Active Home Assistant Installations`,
          chartArea: { width: this.isMobile ? "100%" : "70%", height: "80%" },
          backgroundColor: this.isDarkMode ? "#111111" : "#fafafa",
          series: {
            0: { color: "#3366cc" },
            1: { color: "#dc3912" },
            2: { color: "#ff9900" },
            3: { color: "#109618" },
            4: { color: "#990099" },
          },
          titleTextStyle: {
            color: this.isDarkMode ? "#e1e1e1" : "#212121",
          },
          legend: {
            position: this.isMobile ? "top" : "right",
            alignment: "start",
            textStyle: {
              color: this.isDarkMode ? "#e1e1e1" : "#212121",
            },
          },
          hAxis: {
            title: "Date",
            titleTextStyle: {
              color: this.isDarkMode ? "#e1e1e1" : "#212121",
            },
          },
          vAxis: {
            title: "Active installations",
            logScale: true,
            titleTextStyle: {
              color: this.isDarkMode ? "#e1e1e1" : "#212121",
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
