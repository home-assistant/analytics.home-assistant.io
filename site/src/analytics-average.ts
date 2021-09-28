import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AnalyticsDataCurrent } from "../../worker/src/data";

const AVERAGE_METRICS = {
  addons: "Add-ons",
  automations: "Automations",
  integrations: "Integrations",
  states: "States",
  users: "Users",
};

@customElement("analytics-average")
export class AnalyticsAverage extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  render() {
    if (this.currentData === undefined) {
      return html``;
    }
    return html`<div class="grid">
        ${Object.keys(this.currentData)
          .filter((entry) => entry.startsWith("avg_"))
          .sort((a, b) => a.localeCompare(b))
          .map((entry) => {
            const key = entry.slice(4);
            const value = this.currentData[entry].toFixed(2);
            const numericValue = Number(value);
            return html`<div class="metric">
              <span>Average ${AVERAGE_METRICS[key] || key}</span>
              <span .title=${value}>
                ${numericValue < 10 ? numericValue : Math.round(numericValue)}
              </span>
            </div>`;
          })}
      </div>
      <div class="footer">
        ${this.currentData.reports_statistics || "Unkown"} of
        ${this.currentData.extended_data_from}
        (${+(
          (100 * this.currentData.reports_statistics || 0) /
          this.currentData.extended_data_from
        ).toFixed(2)}%)
        installations have chosen to share usage statistics
      </div>`;
  }

  static styles = css`
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-gap: 16px;
      height: 100%;
      width: 100%;
    }
    .metric {
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      background-color: var(--secondary-background-color);
      text-align: center;
    }
    span:first-of-type {
      line-height: 42px;
      font-size: 24px;
    }
    span:last-of-type {
      background-color: var(--primary-background-color);
      margin: 0 4px 4px;
      font-size: 42px;
      padding: 64px 0;
      height: 100%;
      text-align: center;
    }
    .footer {
      color: var(--secondary-text-color);
      font-style: italic;
      margin-top: 8px;
      margin-bottom: 32px;
    }

    @media only screen and (max-width: 1000px) {
      .grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media only screen and (max-width: 600px) {
      .grid {
        grid-template-columns: repeat(1, 1fr);
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-average": AnalyticsAverage;
  }
}
