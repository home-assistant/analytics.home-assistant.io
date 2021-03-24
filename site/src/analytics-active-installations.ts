import '@google-web-components/google-chart'
import { css, customElement, html, LitElement, property } from 'lit-element'
import { AnalyticsData } from './type'

const mql = matchMedia('(prefers-color-scheme: dark)')
const mobile = matchMedia('(max-width: 600px)')

@customElement('analytics-active-installations')
export class AnalyticsActiveInstallations extends LitElement {
  @property({ attribute: false }) public data?: AnalyticsData

  render() {
    if (this.data === undefined) {
      return html``
    }

    const rows = Object.keys(this.data).map((timestamp) => [
      new Date(Number(timestamp)),
      this.data![timestamp].active_installations,
      this.data![timestamp].installation_types.os,
      this.data![timestamp].installation_types.container,
      this.data![timestamp].installation_types.core,
      this.data![timestamp].installation_types.supervised,
    ])

    return html`
      <google-chart
        type="line"
        .cols=${[
          { label: 'Date', type: 'date' },
          { label: 'Total', type: 'number' },
          { label: 'Operating System', type: 'number' },
          { label: 'Container', type: 'number' },
          { label: 'Core', type: 'number' },
          { label: 'Supervised', type: 'number' },
        ]}
        .options=${{
          title: 'Active Home Assistant Installations',
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
            title: 'Date',
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
      width: calc(100% - 64px);
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
    'analytics-active-installations': AnalyticsActiveInstallations
  }
}
