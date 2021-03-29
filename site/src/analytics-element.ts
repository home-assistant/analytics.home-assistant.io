import "@google-web-components/google-chart";
import {
  css,
  customElement,
  html,
  LitElement,
  internalProperty,
  PropertyValues,
} from "lit-element";
import "./analytics-active-installations";
import "./analytics-average";
import "./analytics-integrations";
import "./analytics-versions";
import { AnalyticsData, fetchData } from "./data";

@customElement("analytics-element")
export class AnalyticsElement extends LitElement {
  @internalProperty() private _data?: AnalyticsData;

  @internalProperty() private _error: boolean = false;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this.getData();
  }

  render() {
    if (this._error) {
      return html`<p>Could not load data.</p>`;
    }

    if (this._data === undefined) {
      return html`Loading…`;
    }

    const lastUpdated = new Date(
      Number(Object.keys(this._data).reverse().slice(0, 1)[0])
    );

    return html`
      <div class="intro">
        <h1>Home Assistant Analytics</h1>
        <p>
          Data gathered by the
          <a
            title="Documentation"
            href="https://next.home-assistant.io/integrations/analytics"
            target="_blank"
            rel="noreferrer"
          >
            analytics integration</a
          >.
        </p>
      </div>
      <div class="content">
        <analytics-active-installations .data=${this._data}>
        </analytics-active-installations>
        <div class="half">
          <analytics-versions .data=${this._data}></analytics-versions>
          <analytics-average .data=${this._data}></analytics-average>
        </div>

        <analytics-integrations .data=${this._data}></analytics-integrations>
        <div>Last updated: ${lastUpdated.toDateString()}</div>
      </div>
    `;
  }

  async getData() {
    try {
      const response = await ((window as any).dataPromise || fetchData());
      if (response.ok) {
        this._data = await response.json();
      } else {
        this._error = true;
      }
    } catch (_) {
      this._error = true;
    }
  }

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      height: 100vh;
      width: 100%;
    }
    .intro {
      padding: 16px 32px;
    }
    a {
      color: var(--primary-color);
    }
    .content {
      width: 100%;
      padding-bottom: 64px;
    }
    .half {
      display: flex;
    }

    analytics-versions,
    analytics-average {
      width: 50%;
      margin: auto;
    }

    @media only screen and (max-width: 600px) {
      .half {
        display: block;
      }
      analytics-versions,
      analytics-average {
        width: calc(100vw - 64px);
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-element": AnalyticsElement;
  }
}
