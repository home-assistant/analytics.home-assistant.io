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

const friendlyBoardName: Record<string, string> = {
  "intel-nuc": "Intel NUC",
  ova: "OVA",
  "odroid-c2": "Odroid C2",
  "odroid-c4": "Odroid C4",
  "odroid-n2": "Odroid N2",
  "odroid-xu4": "Odroid XU4",
  rpi: "Raspberry Pi",
  rpi0: "Raspberry Pi 0",
  rpi2: "Raspberry Pi 2",
  rpi3: "Raspberry Pi 3",
  rpi4: "Raspberry Pi 4",
  tinker: "Asus TinkerBoard",
};

@customElement("analytics-os-boards")
export class AnalyticsOsBoards extends LitElement {
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
    if (
      this.currentData === undefined ||
      this.currentData.operating_system.boards
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
      friendlyBoardName[board],
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
