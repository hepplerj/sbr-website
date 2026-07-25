// ─────────────────────────────────────────────
// Governing Ground — D3 map renderer (AlbersUSA, TopoJSON)
// Sister module to maps.js. Activates on elements with
// data-viz="map" whose config.renderer === "d3".
//
// Config shape (lowercase to match Hugo's .Params lowercasing):
//   {
//     renderer: "d3",
//     src: "/data/fedland.topojson",
//     statesobject: "states",    // topojson object key for state polygons
//     dataobject:   "fedland",   // topojson object key for the thematic polygons
//     colorfield:   "type",      // property on data features to color by
//     palette:      { BLM: "#...", USFS: "#...", default: "#..." },
//     labels:       { BLM: "Bureau of Land Management", ... },
//     infotitle:    "US federal lands",
//     infoprompt:   "Hover a parcel..."
//   }
//
// OPTIONAL — federal-interest overlays (`layers`). When absent the map
// behaves exactly as above: one pre-projected fee layer, legend filtering,
// hover-for-agency. When present, a toggle panel appears and the hover
// readout becomes a composite of every interest present at the cursor.
//
//     feelabel: "Federal fee lands",   // label for the always-present base layer
//     floatinfo: true,                 // readout tracks the cursor
//     layers: [
//       { id: "trust", kind: "polygons", src: "/data/...json",
//         label: "Trust lands", color: "#a94b2b", texture: "hatch",
//         namefield: "name", on: false, note: "..." },
//       { id: "easements", kind: "points", src: "/data/...json",
//         label: "Easements", color: "#5b7a8c", on: false,
//         yearfilter: true, yearlabel: "Acquired", ... },
//       { id: "greatplains", kind: "outline", src: "/data/...geojson",
//         label: "Great Plains (Fenneman)", color: "#5a3a28", width: 2.2 }
//     ]
//
// Three layer kinds: `polygons` (filled, optional `texture: "hatch"`),
// `points` (canvas stipple + quadtree hover; `yearfilter` adds a range
// control over the data's own year extent), and `outline` (stroke-only
// context boundaries — excluded from the hover probe, since they aren't
// interests in land).
//
// Overlay data is ordinary EPSG:4326 GeoJSON, projected in the browser. The
// base fedland TopoJSON is *pre-projected* to AlbersUSA screen coordinates,
// so the two have to be reconciled: `alignProjection()` derives the exact
// scale/translate of that baked-in projection by matching a live
// d3.geoAlbersUsa() against the file's own state outlines. See its comment.
// ─────────────────────────────────────────────

(function () {
  "use strict";
  if (typeof d3 === "undefined" || typeof topojson === "undefined") return;

  // The fedland.topojson is already pre-projected to AlbersUSA screen
  // coordinates for a 960x500 canvas (see its `transform` block). We render
  // with a null/identity projection; applying another projection would mangle it.
  const VIEW_W = 960;
  const VIEW_H = 500;

  function initMap(container) {
    if (container.dataset.initialized === "true") return;

    const id = container.id;
    const configEl = document.getElementById(id + "-config");
    if (!configEl) return;

    let cfg;
    try { cfg = JSON.parse(configEl.textContent); }
    catch (err) { console.error("Invalid D3 map config for", id, err); return; }

    if (cfg.renderer !== "d3") return;
    container.dataset.initialized = "true";
    container.classList.add("viz-embed__frame--live", "d3-map");
    container.innerHTML = "";

    // Hugo lowercases .Params keys, so palette/label entries arrive as
    // {blm: "#...", fs: "#..."}, while the topojson data's `type` property
    // is uppercase ("BLM", "FS"). Normalize both sides to lowercase on lookup.
    const palette = lowerKeys(cfg.palette || {});
    const labels  = lowerKeys(cfg.labels  || {});
    const unknown = palette.default || "#c4b8e0";
    const lookup  = (code) => String(code || "").toLowerCase();

    // ── Overlay layers (optional) ──────────────
    const overlays = (Array.isArray(cfg.layers) ? cfg.layers : []).map((l) => ({
      cfg: l,
      id: l.id,
      visible: l.on === true,
      data: null,
      feet: null,   // projected screen coords, points layers only
      tree: null,   // quadtree over `feet`, for hover
    }));
    const hasOverlays = overlays.length > 0;

    // Split layout, only when there are overlay layers: the controls (layer
    // toggles + year filter + agency legend) live in one column on the left,
    // the map is a stage on the right. The published map has no overlays and
    // keeps its corner-anchored legend over the map, exactly as before.
    let stage = container;      // the map's positioning context
    let controls = null;        // the left column, when split
    if (hasOverlays) {
      container.classList.add("d3-map--split");
      controls = document.createElement("div");
      controls.className = "d3-map__controls";
      stage = document.createElement("div");
      stage.className = "d3-map__stage";
      container.appendChild(controls);
      container.appendChild(stage);
    }

    const svg = d3.select(stage).append("svg")
      .attr("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.infotitle || "Federal lands map");

    const gBase   = svg.append("g").attr("class", "d3-map__base");
    const gData   = svg.append("g").attr("class", "d3-map__data");
    const gBounds = svg.append("g").attr("class", "d3-map__bounds");

    const info = document.createElement("div");
    info.className = "info-panel d3-map__info";
    // `floatinfo` makes the readout track the cursor instead of sitting in the
    // corner, so the eye never leaves the place it's asking about. Opt-in:
    // without it the panel stays anchored exactly as before.
    if (cfg.floatinfo) info.classList.add("d3-map__info--float");
    info.innerHTML = infoHTML(cfg);
    stage.appendChild(info);

    const legend = document.createElement("div");
    legend.className = "legend d3-map__legend";
    // Split → the legend is the lower section of the left column; published →
    // it floats in the corner over the map.
    (controls || container).appendChild(legend);

    let projection = null;   // lon/lat -> the base file's baked-in screen space
    let stipple = null;      // <canvas> for point layers
    let panel = null;
    let feeVisible = true;
    let hoverFee = null;     // properties of the fee polygon under the cursor

    if (hasOverlays) {
      stipple = document.createElement("canvas");
      stipple.className = "d3-map__stipple";
      stage.insertBefore(stipple, info);   // above the SVG, below the readout

      panel = document.createElement("div");
      panel.className = "legend d3-map__layers";
      controls.insertBefore(panel, legend);   // toggles above the legend
    }

    // The base map, a lon/lat reference for projection alignment, then one
    // fetch per overlay. Overlay failures are non-fatal: a missing easement
    // file should cost you that layer, not the whole map.
    const jobs = [d3.json(cfg.src)];
    if (hasOverlays) {
      jobs.push(d3.json(cfg.alignsrc || "/data/states.json"));
      overlays.forEach((l) => jobs.push(d3.json(l.cfg.src).catch(() => null)));
    }

    Promise.all(jobs)
      .then(([topo, ref, ...datasets]) => {
        overlays.forEach((l, i) => { l.data = datasets[i]; });
        render(topo, ref);
      })
      .catch((err) => {
        container.classList.add("viz-embed__frame--error");
        container.innerHTML = `<div class="viz-embed__error">Map could not load: ${err.message}</div>`;
      });

    function render(topo, ref) {
      const states = topojson.feature(topo, topo.objects[cfg.statesobject || "states"]);
      const data   = topojson.feature(topo, topo.objects[cfg.dataobject   || "fedland"]);

      // Identity path — data is pre-projected into the viewBox coordinate space.
      const path = d3.geoPath();

      // States fill (soft paper) + thematic polygons on top
      gBase.selectAll("path.d3-map__state")
        .data(states.features)
        .join("path")
        .attr("class", "d3-map__state")
        .attr("d", path);

      gData.selectAll("path.d3-map__feature")
        .data(data.features)
        .join("path")
        .attr("class", (d) => "d3-map__feature feat-" + safe(d.properties[cfg.colorfield]))
        .attr("d", path)
        .attr("fill", (d) => palette[lookup(d.properties[cfg.colorfield])] || unknown)
        .on("mouseover", function (event, d) {
          d3.select(this).classed("is-hover", true);
          hoverFee = d.properties;
          if (!hasOverlays) updateInfo(d.properties);
        })
        .on("mouseout", function () {
          d3.select(this).classed("is-hover", false);
          hoverFee = null;
          if (!hasOverlays) updateInfo();
        });

      // State boundaries on top
      gBounds.append("path")
        .attr("class", "d3-map__state-boundary")
        .datum(topojson.mesh(topo, topo.objects[cfg.statesobject || "states"], (a, b) => a !== b))
        .attr("d", path);

      // National boundary
      gBounds.append("path")
        .attr("class", "d3-map__national-boundary")
        .datum(topojson.mesh(topo, topo.objects[cfg.statesobject || "states"], (a, b) => a === b))
        .attr("d", path);

      renderLegend(data.features);

      if (hasOverlays) {
        projection = alignProjection(states, ref);
        prepareOverlays();
        renderPolygonOverlays();
        renderLayerPanel();
        mountStipple();
        bindProbe();
      }
    }

    // ── Projection alignment ───────────────────
    // The fee layer arrives pre-projected: someone ran AlbersUSA over it years
    // ago and baked the screen coordinates into the file. New overlays are
    // lon/lat, so we need the *same* projection to draw them on top. Rather
    // than guess the scale and translate that were used, we recover them:
    // project a live reference (us-atlas states) with a default
    // d3.geoAlbersUsa(), measure both bounding boxes, and solve for the affine
    // that maps one onto the other. AlbersUSA is a composite (Alaska and
    // Hawaii are inset), but scale and translate transform the whole composite
    // uniformly, so a single scale factor and offset is exact.
    function alignProjection(preStates, refTopo) {
      const proj = d3.geoAlbersUsa();
      if (!refTopo) return proj;

      const key = Object.keys(refTopo.objects || {})[0];
      if (!key) return proj;
      const refStates = topojson.feature(refTopo, refTopo.objects[key]);

      const live = d3.geoPath(proj).bounds(refStates);      // default scale/translate
      const baked = d3.geoPath().bounds(preStates);         // identity: file coords
      const liveW = live[1][0] - live[0][0];
      if (!(liveW > 0)) return proj;

      const k = (baked[1][0] - baked[0][0]) / liveW;
      const cLive = [(live[0][0] + live[1][0]) / 2, (live[0][1] + live[1][1]) / 2];
      const cBaked = [(baked[0][0] + baked[1][0]) / 2, (baked[0][1] + baked[1][1]) / 2];

      // Default translate is [480, 250]; solving x' = k(x - cLive) + cBaked.
      return proj
        .scale(proj.scale() * k)
        .translate([cBaked[0] + k * (480 - cLive[0]), cBaked[1] + k * (250 - cLive[1])]);
    }

    // ── Overlay preparation ────────────────────
    function prepareOverlays() {
      overlays.forEach((l) => {
        if (!l.data) return;
        if (l.cfg.kind === "points") {
          const rows = l.data.tracts || [];
          const codes = l.data.codes || [];
          const units = l.data.units || [];
          const feet = [];
          rows.forEach((r) => {
            // [programIdx, lon, lat, acres, unitIdx, year]
            const pt = projection([r[1], r[2]]);
            if (!pt) return;   // AlbersUSA returns null outside its composite
            feet.push({
              x: pt[0],
              y: pt[1],
              program: codes[r[0]] || "",
              acres: r[3],
              unit: units[r[4]] || "",
              year: r[5],
            });
          });
          l.feet = feet;
          const yrs = feet.map((f) => f.year).filter((y) => y != null);
          l.yearExtent = yrs.length ? [Math.min(...yrs), Math.max(...yrs)] : null;
          l.yearRange = l.yearExtent ? l.yearExtent.slice() : null;
          l.undated = feet.length - yrs.length;
          applyYearFilter(l);
        } else {
          // Cache lon/lat bounds so the hover probe can reject most polygons
          // with two comparisons before paying for d3.geoContains.
          (l.data.features || []).forEach((f) => {
            f.__bbox = d3.geoBounds(f);
          });
        }
      });
    }

    // Recompute the visible subset of a point layer and rebuild its quadtree
    // from that subset — the hover probe searches the tree, so if the two ever
    // drift apart the map will happily report an easement that isn't drawn.
    function applyYearFilter(l) {
      const r = l.yearRange;
      const full = !r || !l.yearExtent ||
        (r[0] <= l.yearExtent[0] && r[1] >= l.yearExtent[1]);

      // Undated tracts are shown only at full extent. Once the reader narrows
      // to a period, a tract with no acquisition date can't honestly be
      // claimed to fall inside it.
      l.shown = full ? l.feet : l.feet.filter((f) => f.year != null && f.year >= r[0] && f.year <= r[1]);
      l.tree = d3.quadtree().x((d) => d.x).y((d) => d.y).addAll(l.shown);
    }

    function renderPolygonOverlays() {
      const gOver = svg.insert("g", ".d3-map__bounds").attr("class", "d3-map__overlays");
      const gPath = d3.geoPath(projection);

      overlays.filter((l) => l.cfg.kind !== "points" && l.data).forEach((l) => {
        const color = l.cfg.color || "#a94b2b";
        const g = gOver.append("g")
          .attr("class", `d3-map__overlay d3-map__overlay--${safe(l.id)}`)
          .attr("data-layer", l.id)
          .style("display", l.visible ? null : "none");

        // Outline layers are boundaries, not interests: stroke only, with a
        // pale halo underneath so the line stays legible over any fill.
        // Because nothing is filled, ring winding can't bite here.
        if (l.cfg.kind === "outline") {
          const feats = l.data.features || [];
          g.selectAll("path.halo").data(feats).join("path")
            .attr("class", "halo").attr("d", gPath)
            .attr("fill", "none").attr("stroke", "var(--color-bone, #fffaf3)")
            .attr("stroke-width", 4.5).attr("stroke-linejoin", "round").attr("opacity", 0.85);
          g.selectAll("path.line").data(feats).join("path")
            .attr("class", "line").attr("d", gPath)
            .attr("fill", "none").attr("stroke", color)
            .attr("stroke-width", l.cfg.width || 2.2)
            .attr("stroke-linejoin", "round").attr("opacity", 0.95);
          return;
        }

        if (l.cfg.texture === "hatch") defineHatch(l.id, color);
        g.selectAll("path")
          .data(l.data.features || [])
          .join("path")
          .attr("d", gPath)
          .attr("fill", l.cfg.texture === "hatch" ? `url(#hatch-${safe(l.id)})` : color)
          .attr("stroke", color)
          .attr("stroke-width", 0.4);
      });
    }

    function defineHatch(id, color) {
      let defs = svg.select("defs");
      if (defs.empty()) defs = svg.append("defs");
      const p = defs.append("pattern")
        .attr("id", `hatch-${safe(id)}`)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 4).attr("height", 4)
        .attr("patternTransform", "rotate(45)");
      p.append("rect").attr("width", 4).attr("height", 4).attr("fill", color).attr("fill-opacity", 0.18);
      p.append("line")
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 4)
        .attr("stroke", color).attr("stroke-width", 1.6);
    }

    // ── Point layers on canvas ─────────────────
    // 43,000 easement tracts is well past what SVG handles gracefully, and
    // they carry no per-element interaction (the hover probe uses a quadtree),
    // so they go to a canvas sized to the SVG's rendered box.
    function mountStipple() {
      const draw = () => drawStipple();
      draw();
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(draw).observe(container);
      } else {
        window.addEventListener("resize", draw);
      }
    }

    function viewTransform() {
      const r = svg.node().getBoundingClientRect();
      const k = Math.min(r.width / VIEW_W, r.height / VIEW_H) || 0;
      return {
        k,
        ox: (r.width - VIEW_W * k) / 2,
        oy: (r.height - VIEW_H * k) / 2,
        w: r.width,
        h: r.height,
        rect: r,
      };
    }

    function drawStipple() {
      if (!stipple) return;
      const t = viewTransform();
      if (!(t.w > 0 && t.h > 0)) return;
      const dpr = window.devicePixelRatio || 1;

      stipple.width = Math.round(t.w * dpr);
      stipple.height = Math.round(t.h * dpr);
      stipple.style.width = t.w + "px";
      stipple.style.height = t.h + "px";

      const ctx = stipple.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, t.w, t.h);

      overlays.filter((l) => l.cfg.kind === "points" && l.visible && l.shown).forEach((l) => {
        const r = (l.cfg.dotradius || 1.1) * Math.max(t.k, 0.5);
        ctx.fillStyle = l.cfg.color || "#5b7a8c";
        ctx.globalAlpha = l.cfg.opacity != null ? l.cfg.opacity : 0.75;
        ctx.beginPath();
        l.shown.forEach((p) => {
          const x = t.ox + p.x * t.k;
          const y = t.oy + p.y * t.k;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        });
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    // ── Layer toggle panel ─────────────────────
    function renderLayerPanel() {
      const rows = [layerRow("fee", cfg.feelabel || "Federal fee lands", null, feeVisible, null)];

      overlays.forEach((l) => {
        const n = l.data ? (l.feet ? l.feet.length : (l.data.features || []).length) : 0;
        const noun = l.cfg.kind === "points" ? "tract" : "area";
        const count = l.data
          ? (l.cfg.kind === "outline" ? "" : `${fmt(n)} ${noun}${n === 1 ? "" : "s"}`)
          : "unavailable";
        rows.push(layerRow(l.id, l.cfg.label || l.id, l.cfg.color, l.visible, count, !l.data));
        if (l.cfg.yearfilter && l.yearExtent) rows.push(yearControl(l));
      });

      panel.innerHTML =
        `<h4>${cfg.layerstitle || "Federal interests"}</h4>` + rows.join("");

      panel.querySelectorAll(".layer-item").forEach((el) => {
        el.addEventListener("click", () => toggleLayer(el.dataset.layer, el));
      });
      bindYearControls();
    }

    // Only the easement tracts carry a date, so this filters that layer alone
    // and says so — it is not a snapshot of the whole federal estate in a
    // given year, and shouldn't be dressed up as one.
    function yearControl(l) {
      const [lo, hi] = l.yearExtent;
      return `<div class="d3-map__years" data-layer="${l.id}">
        <label class="d3-map__years-readout">
          <span class="d3-map__years-label">${l.cfg.yearlabel || "Acquired"}</span>
          <output>${lo}–${hi}</output>
        </label>
        <input type="range" class="d3-map__year-lo" min="${lo}" max="${hi}" value="${lo}"
          aria-label="Earliest acquisition year">
        <input type="range" class="d3-map__year-hi" min="${lo}" max="${hi}" value="${hi}"
          aria-label="Latest acquisition year">
        <button type="button" class="d3-map__years-reset" hidden>Reset</button>
      </div>`;
    }

    function bindYearControls() {
      panel.querySelectorAll(".d3-map__years").forEach((box) => {
        const l = overlays.find((o) => o.id === box.dataset.layer);
        if (!l) return;
        const lo = box.querySelector(".d3-map__year-lo");
        const hi = box.querySelector(".d3-map__year-hi");
        const out = box.querySelector("output");
        const reset = box.querySelector(".d3-map__years-reset");

        const sync = (moved) => {
          // Keep the handles from crossing: the one the reader just moved
          // wins and pushes the other, rather than snapping back itself.
          let a = +lo.value, b = +hi.value;
          if (a > b) {
            if (moved === lo) { b = a; hi.value = b; }
            else { a = b; lo.value = a; }
          }
          l.yearRange = [a, b];
          out.textContent = `${a}–${b}`;

          const full = a <= l.yearExtent[0] && b >= l.yearExtent[1];
          reset.hidden = full;
          applyYearFilter(l);
          box.classList.toggle("is-narrowed", !full);

          // Turning the slider on is a strong hint the reader wants to see it.
          if (!l.visible) {
            const btn = panel.querySelector(`.layer-item[data-layer="${l.id}"]`);
            if (btn) toggleLayer(l.id, btn);
          } else {
            drawStipple();
          }
          updateCount(l, full);
          updateComposite();
        };

        lo.addEventListener("input", () => sync(lo));
        hi.addEventListener("input", () => sync(hi));
        reset.addEventListener("click", () => {
          lo.value = l.yearExtent[0];
          hi.value = l.yearExtent[1];
          sync(null);
        });
      });
    }

    function updateCount(l, full) {
      const el = panel.querySelector(`.layer-item[data-layer="${l.id}"] .layer-item__count`);
      if (!el) return;
      el.textContent = full
        ? `${fmt(l.feet.length)} tracts`
        : `${fmt(l.shown.length)} of ${fmt(l.feet.length)} tracts`;
    }

    function layerRow(id, label, color, on, count, disabled) {
      const swatch = color
        ? `<span class="legend-swatch" style="background:${color}"></span>`
        : `<span class="legend-swatch legend-swatch--multi"></span>`;
      return `<button type="button" class="layer-item${on ? " is-on" : ""}" data-layer="${id}"
        aria-pressed="${on ? "true" : "false"}"${disabled ? " disabled" : ""}>
        <span class="layer-item__box" aria-hidden="true"></span>${swatch}
        <span class="layer-item__label">${label}${count ? `<span class="layer-item__count">${count}</span>` : ""}</span>
      </button>`;
    }

    function toggleLayer(id, el) {
      if (id === "fee") {
        feeVisible = !feeVisible;
        gData.style("display", feeVisible ? null : "none");
        setRowState(el, feeVisible);
        updateComposite();
        return;
      }
      const l = overlays.find((o) => o.id === id);
      if (!l || !l.data) return;
      l.visible = !l.visible;
      setRowState(el, l.visible);
      if (l.cfg.kind === "points") drawStipple();
      else svg.select(`.d3-map__overlay--${safe(l.id)}`).style("display", l.visible ? null : "none");
      updateComposite();
    }

    function setRowState(el, on) {
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    }

    // ── Composite hover probe ──────────────────
    // Reports every federal interest present at the cursor, not just the one
    // whose polygon happens to be on top. That layering is the whole argument:
    // private surface and a federal easement are the same square mile.
    function bindProbe() {
      svg.on("mousemove", (event) => {
        const t = viewTransform();
        if (!(t.k > 0)) return;

        // Read fee title from whatever is actually under the cursor rather
        // than from mouseover/mouseout bookkeeping — moving from a parcel onto
        // bare state background otherwise leaves the last agency showing.
        // Overlays and the stipple canvas are pointer-events:none, so the fee
        // path is the hit target wherever one exists.
        const target = event.target;
        hoverFee = target && target.classList && target.classList.contains("d3-map__feature")
          ? (d3.select(target).datum() || {}).properties || null
          : null;

        const vx = (event.clientX - t.rect.left - t.ox) / t.k;
        const vy = (event.clientY - t.rect.top - t.oy) / t.k;
        probe(vx, vy);
        if (cfg.floatinfo) positionInfo(event);
      });
      svg.on("mouseleave", () => {
        hoverFee = null;
        probeHits = null;
        updateComposite();
        if (cfg.floatinfo) info.classList.remove("is-visible");
      });
      updateComposite();
    }

    let probeHits = null;

    // Park the readout next to the cursor, flipping to the other side when it
    // would run off the container rather than off the viewport — the map is
    // what the reader is looking at, so that's the box worth staying inside.
    function positionInfo(event) {
      info.classList.add("is-visible");
      const box = stage.getBoundingClientRect();
      const w = info.offsetWidth || 240;
      const h = info.offsetHeight || 80;
      const pad = 14;

      let x = event.clientX - box.left + pad;
      let y = event.clientY - box.top + pad;
      if (x + w > box.width - 4) x = event.clientX - box.left - w - pad;
      if (y + h > box.height - 4) y = event.clientY - box.top - h - pad;

      info.style.left = Math.max(4, x) + "px";
      info.style.top = Math.max(4, y) + "px";
    }

    function probe(vx, vy) {
      const lonlat = projection.invert ? projection.invert([vx, vy]) : null;
      const hits = { trust: null, points: [] };

      overlays.forEach((l) => {
        if (!l.visible || !l.data) return;

        if (l.cfg.kind === "points" && l.tree) {
          // Search radius in the base file's coordinate space, so the hit area
          // stays visually constant regardless of how large the map is drawn.
          const found = l.tree.find(vx, vy, l.cfg.hitradius || 3);
          if (found) hits.points.push({ layer: l, tract: found });
          return;
        }

        // Outline layers are context, not an interest in land — and their
        // rings aren't wound for containment testing, only for stroking.
        if (l.cfg.kind === "outline") return;

        if (lonlat && !hits.trust) {
          const f = (l.data.features || []).find((feat) => {
            const b = feat.__bbox;
            if (!b) return false;
            if (lonlat[0] < b[0][0] || lonlat[0] > b[1][0]) return false;
            if (lonlat[1] < b[0][1] || lonlat[1] > b[1][1]) return false;
            return d3.geoContains(feat, lonlat);
          });
          if (f) hits.trust = { layer: l, feature: f };
        }
      });

      probeHits = hits;
      updateComposite();
    }

    function updateComposite() {
      const rows = [];

      if (feeVisible) {
        const code = hoverFee ? hoverFee[cfg.colorfield] : null;
        rows.push(row(
          "Fee title",
          code ? (labels[lookup(code)] || code) : (cfg.feenone || "Not federally owned"),
          !!code
        ));
      }

      const trust = probeHits && probeHits.trust;
      if (trust) {
        const p = trust.feature.properties || {};
        const nf = trust.layer.cfg.namefield || "name";
        rows.push(row(probeKey(trust.layer, "Trust"), `${p[nf] || "Trust land"}${p.kind ? ` — ${p.kind}` : ""}`, true));
      }

      (probeHits ? probeHits.points : []).forEach((hit) => {
        const t = hit.tract;
        const progs = hit.layer.data.programs || {};
        const name = (progs[t.program] || {}).label || t.program || "Easement";
        const bits = [name];
        if (t.acres) bits.push(`${fmt(t.acres)} acres`);
        if (t.year) bits.push(`acquired ${t.year}`);
        rows.push(row(probeKey(hit.layer, "Easement"), bits.join(" · "), true, t.unit));
      });

      if (!rows.length) {
        if (cfg.floatinfo) info.classList.remove("is-visible");
        info.innerHTML = infoHTML(cfg);
        return;
      }
      info.innerHTML = `<h4>${cfg.probetitle || "Federal interests here"}</h4>${rows.join("")}`;
    }

    // Panel labels can be long ("Federal easements on private land"); the
    // readout's key column wants a word or two, so layers may set `probelabel`.
    function probeKey(layer, fallback) {
      return layer.cfg.probelabel || layer.cfg.label || fallback;
    }

    function row(key, value, present, sub) {
      return `<div class="d3-map__probe-row${present ? "" : " is-absent"}">
        <span class="d3-map__probe-key">${key}</span>
        <span class="d3-map__probe-val">${value}${sub ? `<span class="d3-map__probe-sub">${sub}</span>` : ""}</span>
      </div>`;
    }

    function updateInfo(props) {
      if (!props) { info.innerHTML = infoHTML(cfg); return; }
      const code = props[cfg.colorfield];
      const name = labels[lookup(code)] || code || "Federal parcel";
      info.innerHTML = `<h4>${name}</h4>${code ? `<div class="detail">${code}</div>` : ""}`;
    }

    // Active-agency filter: when a legend item is clicked, only that
    // agency's polygons stay full-opacity; everything else dims.
    // Click the same item again (or the legend title/"All") to clear.
    let activeCode = null;

    function applyFilter() {
      gData.selectAll("path.d3-map__feature")
        .classed("is-dim",   (d) => activeCode != null && lookup(d.properties[cfg.colorfield]) !== activeCode)
        .classed("is-focus", (d) => activeCode != null && lookup(d.properties[cfg.colorfield]) === activeCode);
      legend.querySelectorAll(".legend-item").forEach((el) => {
        const code = el.dataset.code || "";
        const on = activeCode != null && code === activeCode;
        el.classList.toggle("is-active",  on);
        el.classList.toggle("is-inactive", activeCode != null && !on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function renderLegend(features) {
      const presentLc = new Set(features.map((f) => lookup(f.properties[cfg.colorfield])));
      const pool = cfg.legendorder || Object.keys(palette).filter((k) => k !== "default");
      // Sort alphabetically by display label (falling back to the code).
      const entries = pool
        .filter((k) => presentLc.has(lookup(k)))
        .sort((a, b) => {
          const la = (labels[lookup(a)] || a).toLowerCase();
          const lb = (labels[lookup(b)] || b).toLowerCase();
          return la.localeCompare(lb);
        });
      const title = cfg.legendtitle || "Managing agency";
      const items = entries.map((k) => {
        const code = lookup(k);
        const sw = palette[code] || unknown;
        const lbl = labels[code] || k;
        return `<button type="button" class="legend-item" data-code="${code}" aria-pressed="false"><span class="legend-swatch" style="background:${sw}"></span>${lbl}</button>`;
      });
      legend.innerHTML = `<h4>${title}</h4>${items.join("")}<button type="button" class="legend-reset" hidden>Clear filter</button>`;

      legend.querySelectorAll(".legend-item").forEach((el) => {
        el.addEventListener("click", () => {
          const code = el.dataset.code;
          activeCode = (activeCode === code) ? null : code;
          legend.querySelector(".legend-reset").hidden = (activeCode == null);
          applyFilter();
        });
      });
      const resetBtn = legend.querySelector(".legend-reset");
      resetBtn.addEventListener("click", () => {
        activeCode = null;
        resetBtn.hidden = true;
        applyFilter();
      });
    }
  }

  function infoHTML(cfg) {
    return `<h4>${cfg.infotitle || "Hover a parcel"}</h4><div class="detail">${
      cfg.infoprompt || "Details will appear here."
    }</div>`;
  }

  function safe(s) { return String(s || "unknown").replace(/[^a-z0-9]/gi, ""); }

  function fmt(n) { return Number(n).toLocaleString("en-US"); }

  function lowerKeys(obj) {
    const out = {};
    for (const k in obj) out[k.toLowerCase()] = obj[k];
    return out;
  }

  function boot() {
    document.querySelectorAll('[data-viz="map"]').forEach(initMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
