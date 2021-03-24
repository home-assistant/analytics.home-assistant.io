import '@google-web-components/google-chart'
import { css, customElement, html, LitElement, property } from 'lit-element'
import { AnalyticsData } from './type'

const mql = matchMedia('(prefers-color-scheme: dark)')
const mobile = matchMedia('(max-width: 600px)')

@customElement('analytics-versions')
export class AnalyticsVersions extends LitElement {
  @property({ attribute: false }) public data?: AnalyticsData

  render() {
    if (this.data === undefined) {
      return html``
    }

    const dataKeys = Object.keys(this.data)
    const lastEntry = this.data[dataKeys[dataKeys.length - 1]]

    const rows = Object.keys(lastEntry.versions)
      .sort((a, b) => lastEntry.versions[a] - lastEntry.versions[b])
      .slice(0, 4)
      .map((version) => [version, lastEntry.versions[version]])

    return html`
      <google-chart
        type="pie"
        .cols=${[
          { label: 'Version', type: 'string' },
          { label: 'Count', type: 'number' },
        ]}
        .options=${{
          title: 'Top 5 used versions',
          chartArea: { width: '70%', height: '80%' },
          backgroundColor: mql.matches ? '#111111' : '#fafafa',
          titleTextStyle: {
            color: mql.matches ? '#e1e1e1' : '#212121',
          },
          legend: {
            position: mobile.matches ? 'top' : 'right',
            alignment: 'start',
            textStyle: {
              color: mql.matches ? '#e1e1e1' : '#212121',
            },
          },
          hAxis: {
            title: 'Week',
            format: {
              format: 'short',
              fractionDigits: 0,
            },
          },
          vAxis: {
            title: 'Active installations',
          },
        }}
        .rows=${rows}
      >
      </google-chart>
    `
  }

  static styles = css`
    :host {
      display: block;
      width: calc(100% - 32px);
      margin: 16px;
    }

    google-chart {
      height: 500px;
      width: 100%;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'analytics-versions': AnalyticsVersions
  }
}
