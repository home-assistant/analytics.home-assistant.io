import "@google-web-components/google-chart";
import { GoogleChart } from "@google-web-components/google-chart";
import {
  css,
  customElement,
  html,
  LitElement,
  property,
  query,
} from "lit-element";
import { AnalyticsDataCurrent } from "../../worker/src/data";

@customElement("analytics-installation-types")
export class AnalyticsInstallationTypes extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  @query("google-chart") private _chart?: GoogleChart;

  public connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("resize", () => {
      this._chart?.redraw();
    });
  }

  public disconnectCallback(): void {
    super.disconnectCallback();
    window.removeEventListener("resize", () => {
      this._chart?.redraw();
    });
  }

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
      <google-chart
        type="pie"
        .cols=${[
          { label: "Installation type", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .options=${{
          title: "Installation types",
          chartArea: {
            width: this.isMobile ? "100%" : "70%",
            height: this.isMobile ? "80%" : "70%",
          },
          slices: {
            0: { color: "#dc3912" },
            1: { color: "#ff9900" },
            2: { color: "#109618" },
            3: { color: "#990099" },
          },
          backgroundColor: this.isDarkMode ? "#111111" : "#fafafa",
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
        }}
        .rows=${rows}
      >
      </google-chart>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    google-chart {
      height: 500px;
      width: 100%;
    }
    @media only screen and (max-width: 1000px) and (min-width: 600px) {
      google-chart {
        height: 300px;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-installation-types": AnalyticsInstallationTypes;
  }
}
