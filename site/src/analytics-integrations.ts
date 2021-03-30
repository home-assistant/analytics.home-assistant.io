import "@material/mwc-select";
import "@material/mwc-icon-button";
import "@material/mwc-list/mwc-list-item";

import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
} from "lit-element";
import { AnalyticsData } from "./data";

@customElement("analytics-integrations")
export class AnalyticsIntegrations extends LitElement {
  @property({ attribute: false }) public data?: AnalyticsData;

  @internalProperty() private _integrations?: {
    integration: string;
    installations: number;
  }[];

  @internalProperty() private _currentTableSize = 30;
  @internalProperty() private _currentTablePage = 0;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    const dataKeys = Object.keys(this.data!);
    const lastEntry = this.data![dataKeys[dataKeys.length - 1]];
    this._integrations = Object.keys(lastEntry.integrations).map(
      (integration) => {
        return {
          integration,
          installations: lastEntry.integrations[integration],
        };
      }
    );
  }

  render() {
    if (this._integrations === undefined) {
      return html``;
    }

    const tableStart = this._currentTablePage * this._currentTableSize;
    const tableEnd =
      tableStart + this._currentTableSize <= this._integrations.length
        ? tableStart + this._currentTableSize
        : this._integrations.length;

    const tableData = this._integrations
      .sort(
        (a, b) =>
          b.installations - a.installations ||
          a.integration.localeCompare(b.integration)
      )
      .slice(tableStart, tableEnd);

    console.log(tableEnd);

    return html`
      <h3>Integration usage</h3>
      <table>
        <tr class="table-header">
          <th>Integration</th>
          <th>Installations</th>
        </tr>
        ${tableData.map(
          (entry) => html`
            <tr>
              <td class="integration">
                <a
                  title="Documentation"
                  href="https://www.home-assistant.io/integrations/${entry.integration}"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src="https://brands.home-assistant.io/_/${entry.integration}/icon.png"
                  />
                  <span>${entry.integration}</span>
                </a>
              </td>
              <td>${entry.installations}</td>
            </tr>
          `
        )}
      </table>
      <div class="table-footer">
        <mwc-select label="Lines per page" @selected=${this._sizeChanged}>
          ${[30, 50, 100].map(
            (size) =>
              html`<mwc-list-item
                .selected=${size === this._currentTableSize}
                value=${size}
              >
                ${size}
              </mwc-list-item> `
          )}
        </mwc-select>

        <mwc-icon-button
          .disabled=${this._currentTablePage === 0}
          @click=${this._prevPage}
        >
          <svg>
            <path d=${mdiChevronLeft} />
          </svg>
        </mwc-icon-button>
        <div>${tableStart + 1}-${tableEnd} of ${this._integrations.length}</div>
        <mwc-icon-button
          .disabled=${tableData.length < this._currentTableSize}
          @click=${this._nextPage}
        >
          <svg>
            <path d=${mdiChevronRight} />
          </svg>
        </mwc-icon-button>
      </div>
    `;
  }

  private _sizeChanged(ev: CustomEvent) {
    this._currentTableSize = Number((ev.currentTarget as any).value);
    this._currentTablePage = 0;
  }

  private _nextPage() {
    this._currentTablePage++;
  }

  private _prevPage() {
    this._currentTablePage--;
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background-color: var(--secondary-background-color);
      padding: 16px;
      border-radius: 6px;
    }
    table {
      width: 100%;
      text-align: left;
      -webkit-border-horizontal-spacing: 0;
      -webkit-border-vertical-spacing: 0;
      border-spacing: 0 0;
    }

    img {
      height: 24px;
      width: 24px;
      margin-right: 12px;
    }

    td,
    th {
      padding: 16px;
    }

    td {
      border-top: 1px solid var(--primary-background-color);
    }

    .table-header {
      background-color: var(--primary-background-color);
    }

    .table-footer {
      border-top: 1px solid var(--divider-color);
      font-size: 12px;
      font-weight: normal;
      padding: 16px 0 0 16px;
      display: flex;
      width: calc(100% - 32px);
      align-items: center;
    }
    .integration {
      width: 40%;
    }
    mwc-icon-button {
      --mdc-theme-text-disabled-on-light: var(--secondary-text-color);
      --mdc-icon-size: 24px;
    }

    mwc-select {
      --mdc-select-label-ink-color: rgba(0, 0, 0, 0.75);
      --mdc-menu-item-height: 32px;
      --mdc-select-fill-color: var(--secondary-background-color);
      --mdc-select-ink-color: var(--primary-text-color);
      --mdc-select-label-ink-color: var(--primary-text-color);
      --mdc-select-dropdown-icon-color: var(--secondary-text-color);
      --mdc-select-idle-line-color: var(--secondary-text-color);
      --mdc-theme-surface: var(--secondary-background-color);

      /* inherits the styles of mwc-list internally */
      --mdc-list-vertical-padding: 0px;
      --mdc-list-side-padding: 8px;
    }
    a {
      color: var(--primary-text-color);
      text-decoration: none;
      margin-right: 4px;
      display: flex;
      align-items: center;
    }

    @media only screen and (max-width: 600px) {
      .integration {
        width: 80%;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-integrations": AnalyticsIntegrations;
  }
}
