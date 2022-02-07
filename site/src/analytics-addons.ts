import "@material/mwc-icon-button";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-select";
import "@material/mwc-textfield";
import { mdiChevronLeft, mdiChevronRight, mdiClose } from "@mdi/js";
import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { AnalyticsDataCurrent } from "../../worker/src/data";
import { AddonData, fetchAddons } from "./data";

// Strict list of add-ons that are shown, ONLY add-ons that ships default with the Supervisor can be added here!
const ADDONS: {
  [slug: string]: {
    name: string;
    documentation?: string;
    icon?: string;
  };
} = {
  core_ada: {
    name: "Ada",
  },
  core_almond: {
    name: "Almond",
  },
  core_cec_scan: {
    name: "CEC Scanner",
  },
  core_check_config: {
    name: "Check Home Assistant configuration",
  },
  core_configurator: {
    name: "File editor",
  },
  core_deconz: {
    name: "deCONZ",
  },
  core_dhcp_server: {
    name: "DHCP server",
  },
  core_dnsmasq: {
    name: "Dnsmasq",
  },
  core_duckdns: {
    name: "DuckDNS",
  },
  core_git_pull: {
    name: "Git pull",
  },
  core_google_assistant: {
    name: "Google Assistant SDK",
  },
  core_homematic: {
    name: "HomeMatic",
  },
  core_letsencrypt: {
    name: "letsencrypt",
  },
  core_mariadb: {
    name: "MariaDB",
  },
  core_mosquitto: {
    name: "Mosquitto broker",
  },
  core_nginx_proxy: {
    name: "NGINX Home Assistant SSL proxy",
  },
  core_rpc_shutdown: {
    name: "RPC Shutdown",
  },
  core_samba: {
    name: "Samba share",
  },
  core_ssh: {
    name: "SSH server",
  },
  core_tellstick: {
    name: "TellStick",
  },
  core_vlc: {
    name: "VLC",
  },
  core_zwave: {
    name: "OpenZWave",
  },
  core_zwave_js: {
    name: "Z-Wave JS",
  },
  a0d7b954_adguard: {
    name: "AdGuard Home",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/adguard/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/adguard/icon.png",
  },
  a0d7b954_aircast: {
    name: "AirCast",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/aircast/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/aircast/icon.png",
  },
  a0d7b954_airsonos: {
    name: "AirSonos",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/airsonos/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/airsonos/icon.png",
  },
  a0d7b954_appdaemon: {
    name: "AppDaemon 4",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/appdaemon/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/appdaemon/icon.png",
  },
  a0d7b954_bitwarden: {
    name: "Vaultwarden (Bitwarden)",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/bitwarden/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/bitwarden/icon.png",
  },
  a0d7b954_bookstack: {
    name: "Bookstack",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/bookstack/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/bookstack/icon.png",
  },
  a0d7b954_chrony: {
    name: "chrony",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/chrony/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/chrony/icon.png",
  },
  a0d7b954_esphome: {
    name: "ESPHome Home Assistant Add-On",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/esphome/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/esphome/icon.png",
  },
  a0d7b954_example: {
    name: "Example",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/example/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/example/icon.png",
  },
  a0d7b954_foldingathome: {
    name: "Folding@home",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/foldingathome/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/foldingathome/icon.png",
  },
  a0d7b954_ftp: {
    name: "FTP",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/ftp/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/ftp/icon.png",
  },
  a0d7b954_glances: {
    name: "Glances",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/glances/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/glances/icon.png",
  },
  a0d7b954_grafana: {
    name: "Grafana",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/grafana/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/grafana/icon.png",
  },
  a0d7b954_grocy: {
    name: "Grocy",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/grocy/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/grocy/icon.png",
  },
  "a0d7b954_home-panel": {
    name: "Home Panel",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/home-panel/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/home-panel/icon.png",
  },
  a0d7b954_influxdb: {
    name: "InfluxDB",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/influxdb/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/influxdb/icon.png",
  },
  a0d7b954_jupyterlab: {
    name: "JupyterLab",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/jupyterlab/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/jupyterlab/icon.png",
  },
  "a0d7b954_log-viewer": {
    name: "Log Viewer",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/log-viewer/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/log-viewer/icon.png",
  },
  a0d7b954_matrix: {
    name: "Matrix",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/matrix/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/matrix/icon.png",
  },
  a0d7b954_motioneye: {
    name: "motionEye",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/motioneye/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/motioneye/icon.png",
  },
  a0d7b954_nginxproxymanager: {
    name: "Nginx Proxy Manager",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/nginxproxymanager/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/nginxproxymanager/icon.png",
  },
  "a0d7b954_node-red": {
    name: "Node-RED",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/node-red/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/node-red/icon.png",
  },
  a0d7b954_nut: {
    name: "UPS Tools",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/nut/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/nut/icon.png",
  },
  a0d7b954_phpmyadmin: {
    name: "phpMyAdmin",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/phpmyadmin/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/phpmyadmin/icon.png",
  },
  a0d7b954_plex: {
    name: "Plex Media Server",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/plex/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/plex/icon.png",
  },
  a0d7b954_spotify: {
    name: "Spotify Connect",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/spotify/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/spotify/icon.png",
  },
  "a0d7b954_sqlite-web": {
    name: "SQLite Web",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/sqlite-web/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/sqlite-web/icon.png",
  },
  a0d7b954_ssh: {
    name: "SSH & Web Terminal",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/ssh/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/ssh/icon.png",
  },

  a0d7b954_tailscale: {
    name: "Tailscale",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/tailscale/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/tailscale/icon.png",
  },
  a0d7b954_tasmoadmin: {
    name: "TasmoAdmin",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/tasmoadmin/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/tasmoadmin/icon.png",
  },
  a0d7b954_tautulli: {
    name: "Tautulli",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/tautulli/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/tautulli/icon.png",
  },
  a0d7b954_thelounge: {
    name: "The Lounge",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/thelounge/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/thelounge/icon.png",
  },
  a0d7b954_tor: {
    name: "Tor",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/tor/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/tor/icon.png",
  },
  a0d7b954_traccar: {
    name: "Traccar",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/traccar/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/traccar/icon.png",
  },
  a0d7b954_unifi: {
    name: "UniFi Network Application",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/unifi/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/unifi/icon.png",
  },
  a0d7b954_vscode: {
    name: "Studio Code Server",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/vscode/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/vscode/icon.png",
  },
  a0d7b954_wireguard: {
    name: "WireGuard",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/wireguard/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/wireguard/icon.png",
  },
  a0d7b954_zerotier: {
    name: "ZeroTier One",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/zerotier/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/zerotier/icon.png",
  },
  a0d7b954_zwavejs2mqtt: {
    name: "Z-Wave JS to MQTT",
    documentation:
      "https://github.com/hassio-addons/repository/blob/master/zwavejs2mqtt/DOCS.md",
    icon: "https://raw.githubusercontent.com/hassio-addons/repository/master/zwavejs2mqtt/icon.png",
  },
};

@customElement("analytics-addons")
export class AnalyticsAddons extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @state() private _filter: string = "";

  @state() private _addons?: AddonData[];

  @state() private _currentTableSize = 30;
  @state() private _currentTablePage = 0;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this._filter = "";
    this.getData();
  }

  render() {
    if (this._addons === undefined || this.currentData === undefined) {
      return html``;
    }

    const sortedTableData = this._addons
      .sort(
        (a, b) =>
          b.total - a.total ||
          ADDONS[a.slug].name.localeCompare(ADDONS[b.slug].name)
      )
      .map((entry, idx) => {
        return { ...entry, idx };
      })
      .filter((entry) =>
        this._filter
          ? ADDONS[entry.slug].name
              .toLowerCase()
              .includes(this._filter.toLowerCase()) ||
            entry.slug.includes(this._filter.toLowerCase())
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
        <h3>Add-on usage</h3>
        ${
          !this.isMobile
            ? html`
                <div>
                  <mwc-textfield
                    .value=${this._filter}
                    @input=${this._filterChange}
                    placeholder="Search"
                  >
                  </mwc-textfield>
                  ${this._filter
                    ? html`
                        <mwc-icon-button
                          class="clear-button"
                          @click=${this._clearFilter}
                        >
                          <svg>
                            <path d=${mdiClose} />
                          </svg>
                        </mwc-icon-button>
                      `
                    : undefined}
                </div>
              `
            : ""
        }
          </div>
      </div>
      <table>
        <tr class="table-header">
          ${!this.isMobile ? html`<th class="idx"></th>` : ""}
          <th>Add-on</th>
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
                  href="${ADDONS[entry.slug].documentation ||
                  `https://github.com/home-assistant/addons/blob/master/${entry.slug.replace(
                    "core_",
                    ""
                  )}/DOCS.md`}"
                  target="_blank"
                >
                  <img
                    src="${ADDONS[entry.slug].icon ||
                    `https://raw.githubusercontent.com/home-assistant/addons/master/${entry.slug.replace(
                      "core_",
                      ""
                    )}/icon.png`}"
                  />
                  <span>${ADDONS[entry.slug].name}</span>
                </a>
              </td>
              <td class="installations">
                <span>${entry.total}</span>
                ${this.currentData!.reports_addons
                  ? html` <span
                      >(${(
                        (100 * entry.total) /
                        this.currentData!.reports_addons
                      ).toFixed(1)}
                      %)
                    </span>`
                  : ""}
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
      ${
        this.currentData.reports_addons
          ? html` <div class="footer">
              ${this.currentData.reports_addons} of
              ${this.currentData.extended_data_from}
              (${+(
                (100 * this.currentData.reports_addons) /
                this.currentData.extended_data_from
              ).toFixed(2)}%)
              installations have chosen to share their used add-ons
            </div>`
          : ""
      }

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

  async getData() {
    try {
      const response = await fetchAddons();
      if (!response.ok) {
        return;
      }

      const data = await response.json();

      this._addons = Object.keys(data)
        .filter((slug) => ADDONS[slug])
        .map((slug) => {
          return {
            slug,
            ...data[slug],
          };
        });
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

    .clear-button {
      position: absolute;
      color: var(--secondary-text-color);
      margin-left: -42px;
      margin-top: 4px;
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-addons": AnalyticsAddons;
  }
}
