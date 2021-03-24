import { css, customElement, html, LitElement, property } from 'lit-element'
import { AnalyticsData } from './type'

@customElement('analytics-average')
export class AnalyticsAverage extends LitElement {
  @property({ attribute: false }) public data?: AnalyticsData

  render() {
    if (this.data === undefined) {
      return html``
    }

    const dataKeys = Object.keys(this.data)
    const lastEntry = this.data[dataKeys[dataKeys.length - 1]]

    return html`<div class="grid">
      <div class="metric">
        <span>Average integrations</span>
        <span>${Math.round(lastEntry.avg_integrations)}</span>
      </div>
      <div class="metric">
        <span>Average entities</span>
        <span>${Math.round(lastEntry.avg_states)}</span>
      </div>
      <div class="metric">
        <span>Average automations</span>
        <span>${Math.round(lastEntry.avg_automations)}</span>
      </div>
      <div class="metric">
        <span>Average users</span>
        <span>${Math.round(lastEntry.avg_users)}</span>
      </div>
    </div>`
  }

  static styles = css`
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      grid-gap: 32px;
      height: 100%;
      width: 100%;
      margin: 16px;
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

    @media only screen and (max-width: 600px) {
      span:first-of-type {
        min-height: 84px;
        margin: auto;
      }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'analytics-average': AnalyticsAverage
  }
}
