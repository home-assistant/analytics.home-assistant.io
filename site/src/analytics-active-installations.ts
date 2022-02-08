import { Checkbox } from "@material/mwc-checkbox";
import { css, html, LitElement } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { AnalyticsDataHistory } from "../../worker/src/data";
import "./components/analytics-chart";

@customElement("analytics-active-installations")
export class AnalyticsActiveInstallations extends LitElement {
  @property({ attribute: false }) public historyData?: AnalyticsDataHistory[];

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  @state() private _logScale = false;

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
      <analytics-chart
        chartType="line"
        .columns=${[
          { label: "Date", type: "date" },
          { label: "Total", type: "number" },
          { label: "Operating System", type: "number" },
          { label: "Container", type: "number" },
          { label: "Supervised", type: "number" },
          { label: "Core", type: "number" },
        ]}
        .rows=${rows}
        .options=${{
          title: `${Intl.NumberFormat().format(
            lastEntry.active_installations
          )} Active Home Assistant Installations`,
          series: {
            0: { color: "#3366cc" },
            1: { color: "#dc3912" },
            2: { color: "#ff9900" },
            3: { color: "#109618" },
            4: { color: "#990099" },
          },
          hAxis: {
            title: "Date",
            titleTextStyle: {
              color: this.isDarkMode ? "#e1e1e1" : "#212121",
            },
            gridlines: {
              color: this.isDarkMode ? "#444444" : undefined,
            },
          },
          vAxis: {
            title: "Active installations",
            logScale: this._logScale,
            titleTextStyle: {
              color: this.isDarkMode ? "#e1e1e1" : "#212121",
            },
            gridlines: {
              color: this.isDarkMode ? "#444444" : undefined,
            },
          },
        }}
        .isDarkMode=${this.isDarkMode}
        .isMobile=${this.isMobile}
      >
      </analytics-chart>
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
