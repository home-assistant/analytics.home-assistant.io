import { customElement, html, LitElement, property } from "lit-element";
import { AnalyticsDataCurrent } from "../../worker/src/data";
import "./components/analytics-chart";

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

  render() {
    if (
      this.currentData === undefined ||
      Object.keys(this.currentData.operating_system.boards).length === 0
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
      <analytics-chart
        chartType="pie"
        .columns=${[
          { label: "Board", type: "string" },
          { label: "Count", type: "number" },
        ]}
        .rows=${rows}
        .options=${{ title: "Board types" }}
        .isDarkMode=${this.isDarkMode}
        .isMobile=${this.isMobile}
      >
      </analytics-chart>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-os-boards": AnalyticsOsBoards;
  }
}
