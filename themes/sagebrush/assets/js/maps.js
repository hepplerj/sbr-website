// ─────────────────────────────────────────────
// Between the Fences — map renderer
// Config is read from a <script type="application/json" id="{mapId}-config">
// tag sitting next to the map container, bypassing the HTML minifier's
// JS handling. Supports two shapes:
//   1. Single-layer:  { src, valuefield, labelfield, ... }
//   2. Multi-layer:   { layers: [ {src, style, label, ...}, ... ], center, zoom }
// Note: all config keys are lowercase because Hugo's .Params
// lowercases frontmatter keys, and the shortcode follows suit.
// Hooks into any element with data-viz="map" on the page.
// ─────────────────────────────────────────────

(function () {
  "use strict";

  if (typeof L === "undefined") return;

  // ─── Style presets — keyed to the site palette ──────────────────────
  // Each preset defines default + highlight style. Use "context" for
  // non-interactive background layers; the rest are for thematic layers.
  const presets = {
    context: {
      interactive: false,
      style: { color: "#8a7cb8", weight: 0.4, opacity: 0.4, fillColor: "#c4b8e0", fillOpacity: 0.3 },
    },
    sage: {
      style:     { color: "#4a5640", weight: 0.6, opacity: 0.9, fillColor: "#a8b394", fillOpacity: 0.45 },
      highlight: { color: "#4a5640", weight: 2.0, fillOpacity: 0.7 },
    },
    green: {
      style:     { color: "#2c6e3f", weight: 0.75, opacity: 0.9, fillColor: "#4a9e5c", fillOpacity: 0.5 },
      highlight: { color: "#1a4d2e", weight: 2.0, fillOpacity: 0.7 },
    },
    gold: {
      style:     { color: "#8b6914", weight: 0.75, opacity: 0.85, fillColor: "#c9a94e", fillOpacity: 0.45 },
      highlight: { color: "#6b4f0a", weight: 2.0, fillOpacity: 0.65 },
    },
    rust: {
      style:     { color: "#7c3519", weight: 0.75, opacity: 0.9, fillColor: "#a94b2b", fillOpacity: 0.5 },
      highlight: { color: "#5a2411", weight: 2.0, fillOpacity: 0.7 },
    },
    navy: {
      style:     { color: "#1f2a44", weight: 0.75, opacity: 0.9, fillColor: "#2f3e62", fillOpacity: 0.45 },
      highlight: { color: "#141c30", weight: 2.0, fillOpacity: 0.65 },
    },
  };

  // Choropleth ramp for valuefield-driven layers (cream → rust).
  // Bins resolve both Plains states (1–6 %) and the high-federal
  // Intermountain states (60–80 %) within the same visual range.
  const ramp = [
    { stop:   5, color: "#f5efe1" }, // cream
    { stop:  15, color: "#e5d6b3" },
    { stop:  30, color: "#d1b587" },
    { stop:  45, color: "#b88c5d" },
    { stop:  60, color: "#9a6439" },
    { stop:  75, color: "#7c3519" }, // rust-dark
    { stop: 100, color: "#5a1f0a" },
  ];

  const basemap = {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  };

  function fmt(n, digits) {
    if (n == null || isNaN(n)) return "—";
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits ?? 1 });
  }

  function rampColor(v) {
    for (const step of ramp) if (v <= step.stop) return step.color;
    return ramp[ramp.length - 1].color;
  }

  // Normalize a single-layer config to the layers-array shape.
  function normalize(cfg) {
    if (!cfg) return { layers: [] };
    if (cfg.layers) return cfg;
    if (cfg.src) {
      return Object.assign({}, cfg, {
        layers: [
          {
            src: cfg.src,
            style: "sage",
            label: cfg.infotitle || "",
            labelfield: cfg.labelfield,
            valuefield: cfg.valuefield,
            valueunit: cfg.valueunit,
            popupnote: cfg.popupnote,
            legendtitle: cfg.legendtitle,
            choropleth: !!cfg.valuefield,
            fallbacklabel: cfg.fallbacklabel,
          },
        ],
      });
    }
    return { layers: [] };
  }

  // ─── Per-container initialization ───────────────────────────────────
  function initMap(container) {
    const id = container.id;
    const configEl = document.getElementById(id + "-config");
    let raw = {};
    if (configEl) {
      try { raw = JSON.parse(configEl.textContent); }
      catch (err) { console.error("Invalid map config for", id, err); }
    }
    // Skip — another renderer (e.g. d3-maps.js) will handle this one.
    if (raw.renderer && raw.renderer !== "leaflet") return;
    if (container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";
    const cfg = normalize(raw);

    container.innerHTML = "";
    container.classList.add("viz-embed__frame--live");

    const mapOpts = {
      zoomControl: true,
      scrollWheelZoom: cfg.fullbleed === true,
    };
    // Accept center as [lat, lon] or "lat,lon"
    let center = cfg.center;
    if (typeof center === "string") center = center.split(",").map(Number);
    mapOpts.center = (Array.isArray(center) && center.length === 2) ? center : [42.0, -112.0];
    mapOpts.zoom = cfg.zoom != null ? Number(cfg.zoom) : 5;

    const map = L.map(container, mapOpts);

    if (!cfg.fullbleed) {
      map.on("click", () => map.scrollWheelZoom.enable());
      map.on("mouseout", () => map.scrollWheelZoom.disable());
    }

    L.tileLayer(basemap.url, {
      attribution: basemap.attribution,
      subdomains: basemap.subdomains,
      maxZoom: basemap.maxZoom,
    }).addTo(map);

    // Hover info panel
    const info = L.control({ position: "topright" });
    info.onAdd = function () {
      this._div = L.DomUtil.create("div", "info-panel");
      this.update();
      return this._div;
    };
    info.update = function (label, detail) {
      if (!label) {
        this._div.innerHTML = `<h4>${cfg.infotitle || "Hover a feature"}</h4><div class="detail">${
          cfg.infoprompt || "Details will appear here."
        }</div>`;
        return;
      }
      this._div.innerHTML = `<h4>${label}</h4>${detail ? `<div class="detail">${detail}</div>` : ""}`;
    };
    info.addTo(map);

    // Load all layers, then render in order
    const rendered = [];
    const overlays = {};
    let anyChoropleth = false;

    Promise.all(cfg.layers.map((l) => fetch(l.src).then((r) => r.json().then((data) => ({ layer: l, data })))))
      .then((loaded) => {
        // Render bottom-up (first in array = bottom of the stack)
        loaded.forEach(({ layer, data }) => {
          const preset = presets[layer.style] || presets.sage;
          const isContext = preset.interactive === false;
          if (layer.choropleth) anyChoropleth = true;

          const geo = L.geoJSON(data, {
            style: (feat) => styleFeature(feat, layer, preset),
            interactive: !isContext,
            onEachFeature: isContext ? undefined : (feat, lyr) => {
              bindFeature(feat, lyr, { map, info, layer, preset, getLayer: () => geo });
            },
          }).addTo(map);
          rendered.push({ layer, geo });
          if (layer.label) overlays[layer.label] = geo;
        });

        // Fit to the topmost non-context layer, or all thematic bounds
        const thematic = rendered.filter((r) => (presets[r.layer.style] || presets.sage).interactive !== false);
        if (thematic.length) {
          try {
            const group = L.featureGroup(thematic.map((r) => r.geo));
            map.fitBounds(group.getBounds(), { padding: [30, 30] });
          } catch (_) {}
        }

        // Layer control if more than one interactive layer (or explicit opt-in)
        if (Object.keys(overlays).length > 1 || cfg.forcelayercontrol) {
          L.control.layers(null, overlays, { position: "topright", collapsed: false }).addTo(map);
        }

        // Legend
        renderLegend(map, cfg, rendered, anyChoropleth);
      })
      .catch((err) => {
        container.classList.add("viz-embed__frame--error");
        container.innerHTML = `<div class="viz-embed__error">Map could not load: ${err.message}</div>`;
      });
  }

  function styleFeature(feature, layer, preset) {
    const base = Object.assign({}, preset.style);
    if (layer.choropleth && layer.valuefield) {
      base.fillColor = rampColor(feature.properties[layer.valuefield]);
      base.fillOpacity = 0.7;
    }
    return base;
  }

  function featureLabel(props, layer) {
    const name = layer.labelfield ? props[layer.labelfield] : (props.name || props.NAME);
    return name || layer.fallbacklabel || layer.label || "Feature";
  }

  function featureDetail(props, layer) {
    if (!layer.valuefield) return "";
    const v = props[layer.valuefield];
    const unit = layer.valueunit || "";
    return `${fmt(v)}${unit}`;
  }

  function bindFeature(feature, lyr, ctx) {
    const { map, info, layer, preset, getLayer } = ctx;
    const p = feature.properties || {};
    const label = featureLabel(p, layer);
    const detail = featureDetail(p, layer);

    const popup = `
      <div class="map-popup">
        <h3>${label}</h3>
        ${detail ? `<div class="map-popup__value">${detail}</div>` : ""}
        ${layer.popupnote ? `<div class="map-popup__note">${layer.popupnote}</div>` : ""}
      </div>
    `;
    lyr.bindPopup(popup);

    const highlight = preset.highlight || {};
    lyr.on({
      mouseover: (e) => {
        e.target.setStyle(highlight);
        e.target.bringToFront();
        info.update(label, detail);
      },
      mouseout: (e) => {
        getLayer().resetStyle(e.target);
        info.update();
      },
      click: (e) => {
        map.fitBounds(e.target.getBounds(), { padding: [40, 40] });
      },
    });
  }

  function renderLegend(map, cfg, rendered, hasChoropleth) {
    if (!rendered.length) return;
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "legend");
      const title = cfg.legendtitle || (hasChoropleth ? "Legend" : "Layers");

      // If any layer is a choropleth, show the ramp
      if (hasChoropleth) {
        const cho = rendered.find((r) => r.layer.choropleth);
        const unit = cho?.layer.valueunit || "";
        const items = ramp.slice(0, -1).map((step, i) => {
          const prev = i === 0 ? "<" : ramp[i - 1].stop;
          const label = i === 0 ? `< ${step.stop}${unit}` : `${prev}–${step.stop}${unit}`;
          return `<div class="legend-item"><span class="legend-swatch" style="background:${step.color}"></span>${label}</div>`;
        });
        div.innerHTML = `<h4>${title}</h4>${items.join("")}`;
        return div;
      }

      // Otherwise, swatch per thematic layer
      const items = rendered
        .filter((r) => (presets[r.layer.style] || presets.sage).interactive !== false)
        .concat(rendered.filter((r) => (presets[r.layer.style] || presets.sage).interactive === false))
        .map((r) => {
          const p = presets[r.layer.style] || presets.sage;
          return `<div class="legend-item"><span class="legend-swatch" style="background:${p.style.fillColor};border-color:${p.style.color}"></span>${r.layer.label || ""}</div>`;
        });
      div.innerHTML = `<h4>${title}</h4>${items.join("")}`;
      return div;
    };
    legend.addTo(map);
  }

  // ─── Boot ───────────────────────────────────────────────────────────
  function boot() {
    document.querySelectorAll('[data-viz="map"]').forEach(initMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
