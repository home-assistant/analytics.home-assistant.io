import svgMap from "svgmap";
import "svgmap/dist/svgMap.min.css";
import { customElement, UpdatingElement, property } from "lit-element";
import { Analytics } from "./data";

const isDarkMode = matchMedia("(prefers-color-scheme: dark)").matches;

@customElement("analytics-map")
export class AnalyticsMap extends UpdatingElement {
  @property({ type: Boolean }) public showMap = true;

  @property({ attribute: false }) public lastDataEntry?: Analytics;

  protected update() {
    window.addEventListener("hashchange", () => this._setMap(), false);
    this._setMap();
  }

  private _setMap() {
    const oldMap = window.document.body.querySelector<HTMLDivElement>(
      "#svgMap"
    );
    if (this.showMap) {
      const map = document.createElement("div");
      map.id = "svgMap";
      window.document.body.replaceChild(map, oldMap!);
      const countries: Record<string, Record<string, number>> = {};
      for (const country of Object.keys(this.lastDataEntry?.countries || {})) {
        countries[country] = {
          installations: this.lastDataEntry?.countries[country] || 0,
        };
      }
      new svgMap({
        targetElementID: "svgMap",
        colorMin: "#80CBC4",
        colorMax: "#004D40",
        colorNoData: isDarkMode ? "#202020" : "#d9d9d9",
        hideFlag: true,
        initialZoom: 1.0,
        data: {
          data: {
            installations: {
              format: "{0} Installations",
            },
          },
          applyData: "installations",
          values: countries,
        },
      });
    } else {
      oldMap!.hidden = true;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-map": AnalyticsMap;
  }
}
