import "@google-web-components/google-chart";
import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { AnalyticsData } from "../../worker/src/data";
import { migrateAnalyticsData } from "../../worker/src/utils/migrate";
import "./analytics-active-installations";
import "./analytics-addons";
import "./analytics-header";
import "./analytics-installation-types";
import "./analytics-integrations";
import "./analytics-map";
import "./analytics-median";
import "./analytics-os-boards";
import "./analytics-os-versions";
import "./analytics-releases";
import "./analytics-version-history";
import { fetchData } from "./data";

const mqlMobile = matchMedia("(max-width: 600px)");
const mqlDarkMode = matchMedia("(prefers-color-scheme: dark)");

@customElement("analytics-element")
export class AnalyticsElement extends LitElement {
  @state() private _data?: AnalyticsData;

  @state() private _currentPage = "installs";

  @state() private _error: boolean = false;

  @state() private _isMobile: boolean = mqlMobile.matches;

  @state() private _isDarkMode: boolean = mqlDarkMode.matches;

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

    const query = new URLSearchParams(window.location.search);

    return html`
      <analytics-header .currentPage=${this._currentPage}> </analytics-header>
      <div class="content">
        ${this._currentPage === "installs"
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

              <analytics-version-history
                .historyData=${this._data.history}
                .isMobile=${this._isMobile}
                .isDarkMode=${this._isDarkMode}
              >
              </analytics-version-history>

              <div class="half">
                <analytics-releases
                  .currentData=${this._data.current}
                  .isMobile=${this._isMobile}
                  .isDarkMode=${this._isDarkMode}
                >
                </analytics-releases>
                <analytics-installation-types
                  .currentData=${this._data.current}
                  .isMobile=${this._isMobile}
                  .isDarkMode=${this._isDarkMode}
                >
                </analytics-installation-types>
              </div>
              <div class="half">
                <analytics-os-versions
                  .currentData=${this._data.current}
                  .isMobile=${this._isMobile}
                  .isDarkMode=${this._isDarkMode}
                >
                </analytics-os-versions>
                <analytics-os-boards
                  .currentData=${this._data.current}
                  .isMobile=${this._isMobile}
                  .isDarkMode=${this._isDarkMode}
                >
                </analytics-os-boards>
              </div>
            `
          : this._currentPage === "stats"
          ? html`<analytics-median
              .currentData=${this._data.current}
            ></analytics-median>`
          : this._currentPage === "integrations"
          ? html`<analytics-integrations
              .currentData=${this._data.current}
              .isMobile=${this._isMobile}
              .domain=${query.get("domain")}
            >
            </analytics-integrations>`
          : this._currentPage === "add-ons"
          ? html`<analytics-addons
              .currentData=${this._data.current}
              .isMobile=${this._isMobile}
            >
            </analytics-addons>`
          : ""}
      </div>
      <analytics-map
        .currentData=${this._data.current}
        .isDarkMode=${this._isDarkMode}
        .showMap=${this._currentPage === "installs"}
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
    this._currentPage = window.location.hash.replace("#", "") || "installs";
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

    .half > * {
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
