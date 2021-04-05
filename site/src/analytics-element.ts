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
import "./analytics-header";
import "./analytics-installation-types";
import { AnalyticsData, fetchData, relativeTime } from "./data";

@customElement("analytics-element")
export class AnalyticsElement extends LitElement {
  @internalProperty() private _data?: AnalyticsData;

  @internalProperty() private _currentPage = "installations";

  @internalProperty() private _error: boolean = false;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    if (window.location.hash) {
      this._currentPage = window.location.hash.replace("#", "");
    }
    this.getData();
  }

  render() {
    if (this._error) {
      return html`<p>Could not load data.</p>`;
    }

    if (this._data === undefined) {
      return html`Loading…`;
    }

    const dataKeys = Object.keys(this._data);
    const lastDataEntry = this._data[dataKeys[dataKeys.length - 1]];

    const lastUpdated = new Date(
      Number(Object.keys(this._data).reverse().slice(0, 1)[0])
    );

    return html`
      <analytics-header
        @page-changed=${this._pageChanged}
        .currentPage=${this._currentPage}
      >
      </analytics-header>
      <div class="content">
        ${this._currentPage === "installations"
          ? html` <analytics-active-installations .data=${this._data}>
              </analytics-active-installations>
              <div class="half">
                <analytics-versions .lastDataEntry=${lastDataEntry}>
                </analytics-versions>
                <analytics-installation-types .lastDataEntry=${lastDataEntry}>
                </analytics-installation-types>
              </div>`
          : this._currentPage === "statistics"
          ? html`<analytics-average
              .lastDataEntry=${lastDataEntry}
            ></analytics-average>`
          : this._currentPage === "integrations"
          ? html`<analytics-integrations .lastDataEntry=${lastDataEntry}>
            </analytics-integrations>`
          : ""}
      </div>
      <div class="footer">
        <a
          title="Documentation"
          href="https://rc.home-assistant.io/integrations/analytics"
          target="_blank"
          rel="noreferrer"
        >
          Learn more about how this data is gathered</a
        >Last updated: ${relativeTime(lastUpdated.getTime())}
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

  private _pageChanged(ev: CustomEvent) {
    this._currentPage = ev.detail;
  }

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
      margin: auto;
      max-width: 1440px;
    }
    h1 {
      padding: 0 16px;
    }
    a {
      color: var(--primary-color);
    }
    .content,
    .footer {
      width: 100%;
      padding: 16px;
      box-sizing: border-box;
    }
    .half {
      display: flex;
    }
    .content > * {
      margin-bottom: 16px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      box-sizing: border-box;
    }

    analytics-versions,
    analytics-installation-types {
      flex: 1;
    }

    @media only screen and (max-width: 600px) {
      .half {
        flex-direction: column-reverse;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-element": AnalyticsElement;
  }
}
