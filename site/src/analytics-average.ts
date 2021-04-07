import { css, customElement, html, LitElement, property } from "lit-element";
import { Analytics } from "./data";

@customElement("analytics-average")
export class AnalyticsAverage extends LitElement {
  @property({ attribute: false }) public lastDataEntry?: Analytics;

  render() {
    if (this.lastDataEntry === undefined) {
      return html``;
    }

    return html`<div class="grid">
        <div class="metric">
          <span>Average integrations</span>
          <span>${Math.round(this.lastDataEntry.avg_integrations)}</span>
        </div>
        <div class="metric">
          <span>Average entities</span>
          <span>${Math.round(this.lastDataEntry.avg_states)}</span>
        </div>
        <div class="metric">
          <span>Average automations</span>
          <span>${Math.round(this.lastDataEntry.avg_automations)}</span>
        </div>
        <div class="metric">
          <span>Average users</span>
          <span>${Math.round(this.lastDataEntry.avg_users)}</span>
        </div>
      </div>
      <div class="footer">
        ${this.lastDataEntry!.reports_statistics || "Unkown"} installations are
        currently reporting statistics
      </div>`;
  }

  static styles = css`
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: 1;
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
