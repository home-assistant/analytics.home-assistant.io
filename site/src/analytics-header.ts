import "@google-web-components/google-chart";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AnalyticsPages } from "./data";

@customElement("analytics-header")
export class AnalyticsHeader extends LitElement {
  @property() public currentPage = "installations";

  render() {
    return html` <h1>Home Assistant Analytics</h1>
      <div class="pages">
        ${AnalyticsPages.map(
          (page) =>
            html`<a
              class="page"
              href="/#${page}"
              ?selected=${page === this.currentPage}
            >
              ${page}
            </a>`
        )}
      </div>`;
  }

  static styles = css`
    :host {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: 16px;
    }
    h1 {
      padding: 0 16px;
      margin: 0;
    }
    .pages {
      display: flex;
    }
    .page {
      cursor: pointer;
      color: var(--primary-color);
      text-transform: uppercase;
      text-decoration: none;
      display: flex;
      align-items: flex-end;
      line-height: 40px;
      height: 100%;
      padding: 0 4px;
      margin: 0 16px;
      border-bottom: 2px solid transparent;
    }

    .page[selected],
    .page:hover {
      border-color: var(--primary-color);
    }

    @media only screen and (max-width: 800px) {
      :host {
        flex-direction: column;
      }
      .pages {
        margin-top: 16px;
        justify-content: space-evenly;
      }
      .page {
        margin: 0;
      }
    }
    @media only screen and (max-width: 400px) {
      .pages {
        font-size: smaller;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-header": AnalyticsHeader;
  }
}
