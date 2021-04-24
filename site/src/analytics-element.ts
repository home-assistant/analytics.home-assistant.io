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
import { fetchData } from "./data";
import { migrateAnalyticsData } from "../../worker/src/utils/migrate";
import { AnalyticsData } from "../../worker/src/data";

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

    return html`
      <analytics-header .currentPage=${this._currentPage}> </analytics-header>
      <div class="content">
        ${this._currentPage === "installations"
          ? html`
              <analytics-active-installations
                .historyData=${this._data.history}
                .isMobile=${this._isMobile}
                .isDarkMode=${this._isDarkMode}
              >
              </analytics-active-installations>
              <p class="compare">
                <a
                  href="https://www.home-assistant.io/installation/#compare-installation-methods"
                  target="_blank"
                >
                  See the differences between our installation types here
                </a>
              </p>

              <div class="half">
                <analytics-versions
                  .currentData=${this._data.current}
                  .isMobile=${this._isMobile}
                  .isDarkMode=${this._isDarkMode}
                >
                </analytics-versions>
                <analytics-installation-types
                  .currentData=${this._data.current}
                  .isMobile=${this._isMobile}
                  .isDarkMode=${this._isDarkMode}
                >
                </analytics-installation-types>
              </div>
            `
          : this._currentPage === "statistics"
          ? html`<analytics-average
              .currentData=${this._data.current}
            ></analytics-average>`
          : this._currentPage === "integrations"
          ? html`<analytics-integrations
              .currentData=${this._data.current}
              .isMobile=${this._isMobile}
            >
            </analytics-integrations>`
          : ""}
      </div>
      <analytics-map
        .currentData=${this._data.current}
        .isDarkMode=${this._isDarkMode}
        .showMap=${this._currentPage === "installations"}
      >
      </analytics-map>
    `;
  }

  async getData() {
    try {
      const response = await ((window as any).dataPromise || fetchData());
      if (response.ok) {
        this._data = migrateAnalyticsData(await response.json());
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
    a {
      color: var(--primary-color);
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
    .compare {
      text-align: center;
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
