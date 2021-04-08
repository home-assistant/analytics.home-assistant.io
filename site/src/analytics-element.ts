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
import "./analytics-map";
import { AnalyticsData, fetchData } from "./data";

const mqlMobile = matchMedia("(max-width: 600px)");
const mqlDarkMode = matchMedia("(prefers-color-scheme: dark)");

@customElement("analytics-element")
export class AnalyticsElement extends LitElement {
  @internalProperty() private _data?: AnalyticsData;

  @internalProperty() private _currentPage = "installations";

  @internalProperty() private _error: boolean = false;

  @internalProperty() private _isMobile: boolean = mqlMobile.matches;

  @internalProperty() private _isDarkMode: boolean = mqlDarkMode.matches;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this.getData();
    this._pageChanged();
    window.addEventListener("hashchange", () => this._pageChanged(), false);
    mqlMobile.addListener((ev) => (this._isMobile = ev.matches));
    mqlDarkMode.addListener((ev) => (this._isDarkMode = ev.matches));
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

    return html`
      <analytics-header .currentPage=${this._currentPage}> </analytics-header>
      <div class="content">
        <p class="error">
          We are currently experiencing issues handling the amount of data,
          because of that only the active installations graph is being updated.
        </p>
        ${this._currentPage === "installations"
          ? html`
              <analytics-active-installations
                .data=${this._data}
                .isMobile=${this._isMobile}
                .isDarkMode=${this._isDarkMode}
              >
              </analytics-active-installations>
              <div class="half">
                <analytics-versions
                  .lastDataEntry=${lastDataEntry}
                  .isMobile=${this._isMobile}
                  .isDarkMode=${this._isDarkMode}
                >
                </analytics-versions>
                <analytics-installation-types
                  .lastDataEntry=${lastDataEntry}
                  .isMobile=${this._isMobile}
                  .isDarkMode=${this._isDarkMode}
                >
                </analytics-installation-types>
              </div>
            `
          : this._currentPage === "statistics"
          ? html`<analytics-average
              .lastDataEntry=${lastDataEntry}
            ></analytics-average>`
          : this._currentPage === "integrations"
          ? html`<analytics-integrations
              .lastDataEntry=${lastDataEntry}
              .isMobile=${this._isMobile}
            >
            </analytics-integrations>`
          : ""}
      </div>
      <analytics-map
        .lastDataEntry=${lastDataEntry}
        .isDarkMode=${this._isDarkMode}
        .showMap=${!this._isMobile && this._currentPage === "installations"}
      >
      </analytics-map>
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

  private _pageChanged() {
    this._currentPage =
      window.location.hash.replace("#", "") || "installations";
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      margin: auto;
    }
    h1 {
      padding: 0 16px;
    }
    .error {
      background: #db4437;
      color: white;
      padding: 8px;
      border-radius: 4px;
      text-align: center;
    }
    .content {
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

    analytics-versions,
    analytics-installation-types {
      flex: 1;
    }

    @media only screen and (max-width: 600px) {
      .half {
        flex-direction: column-reverse;
      }
      .footer {
        margin-top: 0;
      }
      :host {
        margin-bottom: 0;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-element": AnalyticsElement;
  }
}
