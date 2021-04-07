import "@material/mwc-checkbox";
import "@material/mwc-formfield";
import "@material/mwc-icon-button";
import "@material/mwc-textfield";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-select";
import { mdiChevronLeft, mdiChevronRight, mdiClose } from "@mdi/js";
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
} from "lit-element";
import {
  Analytics,
  fetchIntegrationDetails,
  IntegrationData,
  IntegrationDetails,
} from "./data";

@customElement("analytics-integrations")
export class AnalyticsIntegrations extends LitElement {
  @property({ attribute: false }) public lastDataEntry?: Analytics;

  @property({ type: Boolean }) public isMobile = false;

  @internalProperty() private _filter: string = "";

  @internalProperty() private _integrationDetails: Record<
    string,
    IntegrationDetails
  > = {};

  @internalProperty() private _integrations?: IntegrationData[];

  @internalProperty() private _currentTableSize = 30;
  @internalProperty() private _currentTablePage = 0;
  @internalProperty() private _showInternal = false;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    this.getData();
  }

  render() {
    if (this._integrations === undefined) {
      return html``;
    }

    const sortedTableData = this._integrations
      .sort(
        (a, b) =>
          b.installations - a.installations || a.title.localeCompare(b.title)
      )
      .map((entry, idx) => {
        return { ...entry, idx };
      })
      .filter(
        (entry) =>
          this._integrationDetails[entry.domain].quality_scale !== "internal" ||
          this._showInternal
      )
      .filter((entry) =>
        this._filter
          ? entry.title.toLowerCase().includes(this._filter.toLowerCase()) ||
            entry.domain.includes(this._filter.toLowerCase())
          : true
      );

    const tableStart = this._currentTablePage * this._currentTableSize;
    const tableEnd =
      tableStart + this._currentTableSize <= sortedTableData.length
        ? tableStart + this._currentTableSize
        : sortedTableData.length;

    const tableData = sortedTableData.slice(tableStart, tableEnd);

    return html`
      <div class="header">
        <h3>Integration usage</h3>
        ${!this.isMobile
          ? html`
              <mwc-textfield
                .value=${this._filter}
                @input=${this._filterChange}
                placeholder="Search"
                .suffix=${this._filter
                  ? html`<mwc-icon-button
                      style="position: relative; top: -16px; right: -12px;"
                      @click=${() => this._clearFilter()}
                    >
                      <svg>
                        <path d=${mdiClose} />
                      </svg>
                    </mwc-icon-button>`
                  : undefined}
              ></mwc-textfield>
            `
          : ""}
      </div>
      <mwc-formfield label="Show internal integrations">
        <mwc-checkbox
          id="internal"
          @change=${this._toggleInternal}
        ></mwc-checkbox>
      </mwc-formfield>

      <table>
        <tr class="table-header">
          ${!this.isMobile ? html`<th class="idx"></th>` : ""}
          <th>Integration</th>
          <th class="installations">Installations</th>
        </tr>
        ${tableData.map(
          (entry) => html`
            <tr>
              ${!this.isMobile
                ? html`<td class="idx">${entry.idx + 1}</td>`
                : ""}
              <td>
                <a
                  title="Documentation"
                  href="https://www.home-assistant.io/integrations/${entry.domain}"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src="https://brands.home-assistant.io/_/${entry.domain}/icon.png"
                  />
                  <span>${entry.title}</span>
                </a>
              </td>
              <td class="installations">${entry.installations}</td>
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
        <div>${tableStart + 1}-${tableEnd} of ${sortedTableData.length}</div>
        <mwc-icon-button
          .disabled=${tableData.length < this._currentTableSize}
          @click=${this._nextPage}
        >
          <svg>
            <path d=${mdiChevronRight} />
          </svg>
        </mwc-icon-button>
      </div>
      <div class="footer">
        ${this.lastDataEntry!.reports_integrations || "Unkown"} installations
        are currently reporting their integration usage
      </div>
    `;
  }

  private _filterChange(ev: any) {
    this._currentTablePage = 0;
    this._filter = ev.currentTarget?.value || "";
  }

  private _clearFilter() {
    this._currentTablePage = 0;
    this._filter = "";
  }

  private _toggleInternal(ev: CustomEvent) {
    this._showInternal = (ev.currentTarget as any).checked;
  }

  async getData() {
    try {
      const response = await fetchIntegrationDetails();
      if (!response.ok) {
        return;
      }

      this._integrationDetails = await response.json();

      this._integrations = Object.keys(this._integrationDetails).map(
        (domain) => {
          return {
            domain,
            title: this._integrationDetails[domain].title || domain,
            installations: this.lastDataEntry?.integrations[domain] || 0,
          };
        }
      );
    } catch (err) {
      console.log(err);
    }
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
    .idx {
      width: 12px;
    }
    .installations {
      text-align: right;
    }
    mwc-textfield {
      width: 235px;
    }
    .header {
      display: flex;
      justify-content: space-between;
    }
    .footer {
      color: var(--secondary-text-color);
      font-style: italic;
      margin-top: 8px;
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

    mwc-checkbox {
      --mdc-theme-secondary: var(--primary-color);
      --mdc-checkbox-unchecked-color: var(--secondary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-integrations": AnalyticsIntegrations;
  }
}
