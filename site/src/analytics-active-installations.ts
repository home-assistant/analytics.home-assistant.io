import "@google-web-components/google-chart";
import type { GoogleChart } from "@google-web-components/google-chart";
import { Checkbox } from "@material/mwc-checkbox";
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  query,
} from "lit-element";
import { AnalyticsDataHistory } from "../../worker/src/data";

@customElement("analytics-active-installations")
export class AnalyticsActiveInstallations extends LitElement {
  @property({ attribute: false }) public historyData?: AnalyticsDataHistory[];

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  @internalProperty() private _logScale = false;

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
    if (this.historyData === undefined) {
      return html``;
    }

    const lastEntry = this.historyData[this.historyData.length - 1];

    const rows = this.historyData.map((entry) => [
      new Date(Number(entry.timestamp)),
      entry.active_installations,
      entry.installation_types.os,
      entry.installation_types.container,
      entry.installation_types.supervised,
      entry.installation_types.core,
    ]);

    return html`
      ${!this.isMobile
        ? html`<mwc-formfield label="Logarithmic scale">
            <mwc-checkbox @change=${this._toggleLogScale}></mwc-checkbox>
          </mwc-formfield>`
        : ""}
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
            logScale: this._logScale,
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

  private _toggleLogScale(ev: CustomEvent) {
    this._logScale = (ev.currentTarget as Checkbox).checked;
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    google-chart {
      height: 500px;
      width: 100%;
    }
    mwc-formfield {
      position: absolute;
      right: 16px;
      z-index: 9;
    }
    mwc-checkbox {
      --mdc-theme-secondary: var(--primary-color);
      --mdc-checkbox-unchecked-color: var(--secondary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-active-installations": AnalyticsActiveInstallations;
  }
}
