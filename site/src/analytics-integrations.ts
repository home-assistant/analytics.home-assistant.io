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
  fetchIntegrationDetails,
  IntegrationData,
  IntegrationDetails,
} from "./data";
import { AnalyticsDataCurrent } from "../../worker/src/data";

// Default non internal domains
const DEFAULT_DOMAINS: string[] = [
  "alexa",
  "cloud",
  "google_translate",
  "met",
  "rpi_power",
];

@customElement("analytics-integrations")
export class AnalyticsIntegrations extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @internalProperty() private _filter: string = "";

  @internalProperty() private _integrationDetails: Record<
    string,
    IntegrationDetails
  > = {};

  @internalProperty() private _integrations?: IntegrationData[];

  @internalProperty() private _currentTableSize = 30;
  @internalProperty() private _currentTablePage = 0;
  @internalProperty() private _showDefaultAndInternal = false;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    this.getData();
  }

  render() {
    if (this._integrations === undefined || this.currentData === undefined) {
      return html``;
    }

    const sortedTableData = this._integrations
      .sort(
        (a, b) =>
          b.installations - a.installations || a.title.localeCompare(b.title)
      )
      .filter(
        (entry) =>
          (!DEFAULT_DOMAINS.includes(entry.domain) &&
            this._integrationDetails[entry.domain].quality_scale !==
              "internal") ||
          this._showDefaultAndInternal
      )
      .map((entry, idx) => {
        return { ...entry, idx };
      })
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
                      style="position: relative; top: -16px; right: -12px; color: var(--secondary-text-color);"
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
      <mwc-formfield label="Show default and internal integrations">
        <mwc-checkbox @change=${this._toggleDefaultAndInternal}></mwc-checkbox>
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
              <td class="installations">
                <span>${entry.installations}</span>
                <span
                  >(${(
                    (100 * entry.installations) /
                    this.currentData!.reports_integrations
                  ).toFixed(1)}
                  %)
                </span>
              </td>
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
        <div class="footer-controls">
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
      </div>
      <div class="footer">
        ${this.currentData.reports_integrations || "Unkown"} of
        ${this.currentData.extended_data_from}
        (${+(
          (100 * this.currentData.reports_integrations || 0) /
          this.currentData.extended_data_from
        ).toFixed(2)}%)
        installations have chosen to share their used integrations
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

  private _toggleDefaultAndInternal(ev: CustomEvent) {
    this._showDefaultAndInternal = (ev.currentTarget as any).checked;
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
            installations: this.currentData?.integrations[domain] || 0,
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
      padding-top: 16px;
      display: flex;
    }
    @media only screen and (max-width: 600px) {
      td,
      th {
        padding: 16px 8px;
      }
      .table-footer {
        flex-direction: column;
      }
      .footer-controls {
        justify-content: space-between;
      }
    }
    .footer-controls {
      display: flex;
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
      --mdc-text-field-fill-color: var(--secondary-background-color);
      --mdc-text-field-ink-color: var(--primary-text-color);
      --mdc-text-field-label-ink-color: var(--secondary-text-color);
      --mdc-text-field-idle-line-color: var(--secondary-text-color);
      --mdc-text-field-hover-line-color: var(--primary-text-color);
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
      --mdc-select-hover-line-color: var(--primary-text-color);

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
