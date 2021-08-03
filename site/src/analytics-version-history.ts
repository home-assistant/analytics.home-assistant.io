import { Checkbox } from "@material/mwc-checkbox";
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
} from "lit-element";
import { AnalyticsDataHistory } from "../../worker/src/data";
import "./components/analytics-chart";

@customElement("analytics-version-history")
export class AnalyticsVersionHistory extends LitElement {
  @property({ attribute: false }) public historyData?: AnalyticsDataHistory[];

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  @internalProperty() private _logScale = false;

  render() {
    if (this.historyData === undefined) {
      return html``;
    }

    const versionHistoryData = this.historyData.filter(
      (data) => data.versions !== undefined
    );
    if (versionHistoryData.length < 2) {
      return html``;
    }

    const allVersions: Set<string> = new Set();
    versionHistoryData.forEach((entry) => {
      if (entry.versions) {
        Object.keys(entry.versions).forEach((version) =>
          allVersions.add(version)
        );
      }
    });

    const versionsOrdered: string[] = Array.from(allVersions).sort((a, b) => {
      const mainVersionCmp =
        parseInt(b.split(".")[0]) - parseInt(a.split(".")[0]);
      if (mainVersionCmp !== 0) {
        return mainVersionCmp;
      }
      return parseInt(b.split(".")[1]) - parseInt(a.split(".")[1]);
    });

    const rows = versionHistoryData.map((entry) => {
      const result = [];
      result.push(new Date(Number(entry.timestamp)));
      versionsOrdered.forEach((version) => {
        // @ts-ignore: undefined version entries already filtered
        result.push(entry.versions[version] || 0);
      });
      return result;
    });

    const columns = [{ label: "Date", type: "date" }];
    versionsOrdered.forEach((version) => {
      columns.push({ label: version, type: "number" });
    });

    return html`
      ${!this.isMobile
        ? html`<mwc-formfield label="Logarithmic scale">
            <mwc-checkbox @change=${this._toggleLogScale}></mwc-checkbox>
          </mwc-formfield>`
        : ""}
      <analytics-chart
        chartType="line"
        .columns=${columns}
        .rows=${rows}
        .options=${{
          title: `Version history`,
          hAxis: {
            title: "Date",
            titleTextStyle: {
              color: this.isDarkMode ? "#e1e1e1" : "#212121",
            },
            gridlines: {
              color: this.isDarkMode ? "#444444" : undefined,
            },
          },
          vAxis: {
            title: "Active installations",
            logScale: this._logScale,
            titleTextStyle: {
              color: this.isDarkMode ? "#e1e1e1" : "#212121",
            },
            gridlines: {
              color: this.isDarkMode ? "#444444" : undefined,
            },
          },
        }}
        .isDarkMode=${this.isDarkMode}
        .isMobile=${this.isMobile}
      >
      </analytics-chart>
    `;
  }

  private _toggleLogScale(ev: CustomEvent) {
    this._logScale = (ev.currentTarget as Checkbox).checked;
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    mwc-formfield {
      position: absolute;
      right: 16px;
      z-index: 9;
    }
    mwc-checkbox {
      --mdc-theme-secondary: var(--primary-color);
      --mdc-checkbox-unchecked-color: var(--secondary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-version-history": AnalyticsVersionHistory;
  }
}
