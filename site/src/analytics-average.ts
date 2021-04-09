import { css, customElement, html, LitElement, property } from "lit-element";
import { Analytics } from "./data";

@customElement("analytics-average")
export class AnalyticsAverage extends LitElement {
  @property({ attribute: false }) public lastDataEntry?: Analytics;

  render() {
    if (this.lastDataEntry === undefined) {
      return html``;
    }

    const integrations = this.lastDataEntry.avg_integrations.toFixed(2);
    const entities = this.lastDataEntry.avg_states.toFixed(2);
    const automations = this.lastDataEntry.avg_automations.toFixed(2);
    const users = this.lastDataEntry.avg_users.toFixed(2);

    return html`<div class="grid">
        <div class="metric">
          <span>Average integrations</span>
          <span .title=${integrations}
            >${Math.round(Number(integrations))}</span
          >
        </div>
        <div class="metric">
          <span>Average entities</span>
          <span .title=${entities}>${Math.round(Number(entities))}</span>
        </div>
        <div class="metric">
          <span>Average automations</span>
          <span .title=${automations}>${Math.round(Number(automations))}</span>
        </div>
        <div class="metric">
          <span>Average users</span>
          <span .title=${users}>${Math.round(Number(users))}</span>
        </div>
      </div>
      <div class="footer">
        ${this.lastDataEntry.reports_statistics || "Unkown"} of
        ${this.lastDataEntry.active_installations} installations have chosen to
        share usage statistics
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
