import "@google-web-components/google-chart";
import { GoogleChart } from "@google-web-components/google-chart";
import {
  css,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  query,
} from "lit-element";
import { AnalyticsDataCurrent } from "../../worker/src/data";

@customElement("analytics-os-boards")
export class AnalyticsOsBoards extends LitElement {
  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  @query("google-chart") private _chart?: GoogleChart;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    window.addEventListener("resize", () => {
      this._chart?.redraw();
    });
  }

  render() {
    if (
      this.currentData === undefined ||
      this.currentData.operating_system === undefined
    ) {
      return html``;
    }

    const sortedBoards = Object.keys(
      this.currentData.operating_system.boards
    ).sort(
      (a, b) =>
        this.currentData!.operating_system.boards[b] -
        this.currentData!.operating_system.boards[a]
    );

    const rows = sortedBoards.map((board) => [
      board,
      this.currentData!.operating_system.boards[board],
    ]);

    return html`
      <google-chart
        type="pie"
        .cols=${[
          { label: "Installation type", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .options=${{
          title: "Board types",
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
    "analytics-os-boards": AnalyticsOsBoards;
  }
}
