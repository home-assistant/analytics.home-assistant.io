import svgMap from "svgmap";
import "svgmap/dist/svgMap.min.css";
import {
  customElement,
  LitElement,
  property,
  PropertyValues,
} from "lit-element";
import { Analytics } from "./data";

const isDarkMode = matchMedia("(prefers-color-scheme: dark)").matches;
const isMobile = matchMedia("(max-width: 600px)").matches;

@customElement("analytics-map")
export class AnalyticsMap extends LitElement {
  @property({ attribute: false }) public lastDataEntry?: Analytics;

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    if (!isMobile) {
      const container = document.createElement("div");
      const mapStyle = document.createElement("style");
      const map = document.createElement("div");

      container.id = "mapContainer";
      map.id = "svgMap";

      mapStyle.innerHTML = `
      #mapContainer {
        width: 1440px;
        height: 720px;
        position: absolute;
        top: 72px;
      }
      .svgMap-map-wrapper {
        background-color: ${isDarkMode ? "#1c1c1c" : "#d9ecff"};
      }
      .svgMap-tooltip {
        background-color: ${isDarkMode ? "#1c1c1c" : "#fafafa"};
      }
    `;

      container.appendChild(mapStyle);
      container.appendChild(map);
      window.document.body.appendChild(container);

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
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "analytics-map": AnalyticsMap;
  }
}
