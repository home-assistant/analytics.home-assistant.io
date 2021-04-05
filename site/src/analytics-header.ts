import "@google-web-components/google-chart";
import { css, customElement, html, LitElement, property } from "lit-element";
import "./analytics-active-installations";
import "./analytics-average";
import "./analytics-integrations";
import "./analytics-versions";
import { AnalyticsPages } from "./data";

@customElement("analytics-header")
export class AnalyticsHeader extends LitElement {
  @property() public currentPage = "installations";

  render() {
    return html` <h1>Home Assistant Analytics</h1>
      <div class="pages">
        ${AnalyticsPages.map(
          (page) =>
            html`<div
              .page=${page}
              class="page"
              @click=${this._pageSelected}
              ?selected=${page === this.currentPage}
            >
              ${page}
            </div>`
        )}
      </div>`;
  }

  private _pageSelected(ev: CustomEvent) {
    const selectedPage = (ev.currentTarget as any).page;
    this.currentPage = selectedPage;
    window.location.hash = selectedPage;
  }

  static styles = css`
    :host {
      display: flex;
      justify-content: space-between;
      height: 64px;
      width: 100%;
    }
    h1 {
      padding: 0 16px;
    }
    .pages {
      margin-top: 16px;
      display: flex;
    }
    .page {
      cursor: pointer;
      color: var(--primary-color);
      text-transform: uppercase;
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 4px;
      margin: 0 16px;
    }

    .page[selected],
    .page:hover {
      font-weight: 600;
      border-bottom: 4px solid var(--primary-color);
    }

    @media only screen and (max-width: 600px) {
      :host {
        flex-direction: column;
        height: 132px;
      }
      .pages {
        margin-top: 0;
        justify-content: space-evenly;
      }
      .page {
        padding: 0;
        margin: 0;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-header": AnalyticsHeader;
  }
}
