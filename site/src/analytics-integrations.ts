import '@polymer/iron-icon/iron-icon.js'
import '@polymer/iron-icons/iron-icons.js'
import '@polymer/paper-dropdown-menu/paper-dropdown-menu'
import '@polymer/paper-icon-button/paper-icon-button'
import '@polymer/paper-item/paper-item'
import '@polymer/paper-listbox/paper-listbox'
import '@polymer/paper-tooltip/paper-tooltip'
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
} from 'lit-element'
import { AnalyticsData } from './type'

@customElement('analytics-integrations')
export class AnalyticsIntegrations extends LitElement {
  @property({ attribute: false }) public data?: AnalyticsData

  @internalProperty() private _integrations?: {
    integration: string
    installations: number
  }[]

  @internalProperty() private _currentTableSize = 10
  @internalProperty() private _currentTablePage = 0

  protected firstUpdated() {
    const dataKeys = Object.keys(this.data!)
    const lastEntry = this.data![dataKeys[dataKeys.length - 1]]
    this._integrations = Object.keys(lastEntry.integrations).map(
      (integration) => {
        return {
          integration,
          installations: lastEntry.integrations[integration],
        }
      },
    )
  }

  render() {
    if (this._integrations === undefined) {
      return html``
    }

    const tableStart = this._currentTablePage * this._currentTableSize
    const tableEnd =
      tableStart + this._currentTableSize <= this._integrations.length
        ? tableStart + this._currentTableSize
        : this._integrations.length

    const tableData = this._integrations
      .sort(
        (a, b) =>
          b.installations - a.installations ||
          a.integration.localeCompare(b.integration),
      )
      .slice(tableStart, tableEnd)

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
                  href="https://home-assistant.io/integrations/${entry.integration}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://brands.home-assistant.io/_/${entry.integration}/icon.png"
                  />
                  <span>${entry.integration}</span>
                </a>
              </td>
              <td>${entry.installations}</td>
            </tr>
          `,
        )}
      </table>
      <div class="table-footer">
        <div>Lines per page</div>
        <paper-dropdown-menu no-label-float vertical-align="bottom">
          <paper-listbox
            attr-for-selected="size"
            @iron-select=${this._sizeChanged}
            .selected=${this._currentTableSize}
            slot="dropdown-content"
          >
            ${[10, 25, 50, 100].map(
              (size) => html` <paper-item .size=${size}>${size}</paper-item> `,
            )}
          </paper-listbox>
        </paper-dropdown-menu>
        <div class="status">
          ${tableStart + 1}-${tableEnd} of ${this._integrations.length}
        </div>
        <paper-icon-button
          id="previousPageBtn"
          icon="chevron-left"
          .disabled=${this._currentTablePage === 0}
          @tap=${this._prevPage}
        >
        </paper-icon-button>
        <paper-tooltip for="previousPageBtn" position="top">
          Previous page
        </paper-tooltip>
        <paper-icon-button
          id="nextPageBtn"
          icon="chevron-right"
          .disabled=${tableData.length < this._currentTableSize}
          @tap=${this._nextPage}
        >
        </paper-icon-button>
        <paper-tooltip for="nextPageBtn" position="top">
          Next page
        </paper-tooltip>
      </div>
    `
  }

  private _sizeChanged(ev: CustomEvent) {
    this._currentTableSize = (ev.currentTarget as any).selected
    this._currentTablePage = 0
  }

  private _nextPage() {
    this._currentTablePage++
  }

  private _prevPage() {
    this._currentTablePage--
  }

  static styles = css`
    :host {
      display: block;
      width: calc(100% - 32px);
      margin: 16px;
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
    .status {
      margin-right: 16px;
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
    paper-dropdown-menu {
      width: 60px;
      margin-right: 32px;
      margin-left: 8px;
      --paper-listbox-background-color: var(--primary-background-color);
      --paper-listbox-color: var(--primary-text-color);
      --paper-input-container-input-color: var(--primary-text-color);
      --paper-input-container-underline_-_display: none;
      --paper-input-container-shared-input-style_-_font-weight: 500;
      --paper-input-container-shared-input-style_-_text-align: right;
      --paper-input-container-shared-input-style_-_font-size: 12px;
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
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'analytics-integrations': AnalyticsIntegrations
  }
}
