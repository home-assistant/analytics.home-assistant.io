import "@google-web-components/google-chart";
import { GoogleChart } from "@google-web-components/google-chart";
import { css, customElement, html, LitElement, property, query } from "lit";

@customElement("analytics-chart")
export class AnalyticsChart extends LitElement {
  @property() public chartType!: string;

  @property({ attribute: false }) public columns!: {
    label: string;
    type: string;
  }[];

  @property({ attribute: false }) public options: any;

  @property({ attribute: false }) public rows:
    | (string | number)[][]
    | (number | Date)[][] = [];

  @property({ type: Boolean }) public isMobile = false;

  @property({ type: Boolean }) public isDarkMode = false;

  @query("google-chart") private _chart?: GoogleChart;

  public connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("resize", this._handleResize);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._handleResize);
  }

  private _handleResize = () => {
    this._chart?.redraw();
  };

  render() {
    return html`
      <google-chart
        .type=${this.chartType}
        .cols=${this.columns}
        .options=${{
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
          ...this.options,
        }}
        .rows=${this.rows}
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
    "analytics-chart": AnalyticsChart;
  }
}
