import svgMap from "svgmap";
import "svgmap/dist/svgMap.min.css";
import { customElement, UpdatingElement, property } from "lit-element";
import { AnalyticsDataCurrent } from "../../worker/src/data";

@customElement("analytics-map")
export class AnalyticsMap extends UpdatingElement {
  @property({ type: Boolean }) public showMap = true;

  @property({ type: Boolean }) public isDarkMode = false;

  @property({ attribute: false }) public currentData?: AnalyticsDataCurrent;

  private _svgMap?;

  public constructor() {
    super();
    window.addEventListener("resize", () => this._resizeMap(), false);
  }

  protected update(changedProps) {
    super.update(changedProps);
    this._setMap();
  }

  private _setMap() {
    if (this.showMap) {
      const countries: Record<string, Record<string, number>> = {};
      for (const country of Object.keys(this.currentData?.countries || {})) {
        countries[country] = {
          installations: this.currentData?.countries[country] || 0,
        };
      }
      if (this._svgMap) {
        this._svgMap.applyData({
          ...this._svgMap.options.data,
          values: countries,
        });
        return;
      }
      this._svgMap = new svgMap({
        targetElementID: "svgMap",
        colorMin: "#80CBC4",
        colorMax: "#004D40",
        colorNoData: this.isDarkMode ? "#202020" : "#d9d9d9",
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
    } else if (this._svgMap) {
      this._svgMap.mapWrapper.remove();
      this._svgMap = undefined;
    }
  }

  private _resizeMap() {
    if (!this._svgMap) {
      return;
    }
    this._svgMap.mapPanZoom.resize();
    this._svgMap.mapPanZoom.fit();
    this._svgMap.mapPanZoom.center();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-map": AnalyticsMap;
  }
}
