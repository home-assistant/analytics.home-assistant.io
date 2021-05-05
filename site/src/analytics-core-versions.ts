import "@google-web-components/google-chart";
import { GoogleChart } from "@google-web-components/google-chart";
import {
  css,
  customElement,
  html,
  LitElement,
  property,
  query,
} from "lit-element";
import { AnalyticsDataCurrent } from "../../worker/src/data";

@customElement("analytics-core-versions")
export class AnalyticsCoreVersions extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  @query("google-chart") private _chart?: GoogleChart;

  public connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("resize", () => {
      this._chart?.redraw();
    });
  }

  public disconnectCallback(): void {
    super.disconnectCallback();
    window.removeEventListener("resize", () => {
      this._chart?.redraw();
    });
  }

  render() {
    if (this.currentData === undefined) {
      return html``;
    }

    const sortedVersions = Object.keys(this.currentData.versions).sort(
      (a, b) => this.currentData!.versions[b] - this.currentData!.versions[a]
    );

    const rows = sortedVersions
      .slice(0, 5)
      .map((version) => [version, this.currentData!.versions[version]]);

    rows.push([
      "Other",
      sortedVersions
        .slice(5)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + this.currentData!.versions[currentValue],
          0
        ),
    ]);

    return html`
      <google-chart
        type="pie"
        .cols=${[
          { label: "Version", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .options=${{
          title: "Top 5 used core versions",
          chartArea: {
            width: this.isMobile ? "100%" : "70%",
            height: this.isMobile ? "80%" : "70%",
          },
          sliceVisibilityThreshold: 0,
          backgroundColor: this.isDarkMode ? "#111111" : "#fafafa",
          titleTextStyle: {
            color: this.isDarkMode ? "#e1e1e1" : "#212121",
          },
          legend: {
            position: this.isMobile ? "top" : "right",
            alignment: "start",
            textStyle: {
              color: this.isDarkMode ? "#e1e1e1" : "#212121",
            },
          },
        }}
        .rows=${rows}
      >
      </google-chart>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    google-chart {
      height: 500px;
      width: 100%;
    }
    @media only screen and (max-width: 1000px) and (min-width: 600px) {
      google-chart {
        height: 300px;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-core-versions": AnalyticsCoreVersions;
  }
}
