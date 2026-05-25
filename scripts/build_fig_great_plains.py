#!/usr/bin/env python3
"""Build ``static/figures/great-plains-physiographic.svg``.

A static figure for the narrative section: contiguous-US state outlines
with the Fenneman (1928) Great Plains physiographic province
highlighted in dark rust. The visual point is that the geographic
Plains don't follow state lines — the boundary cuts diagonally through
eastern MT, WY, CO and the western edges of MN, IA, MO, AR.

Inputs (already committed):
  static/data/states.json                   us-atlas states-10m (TopoJSON, WGS84)
  static/data/physio-great-plains.geojson   Fenneman GP polygon (WGS84)

Output:
  static/figures/great-plains-physiographic.svg   (single static SVG)

Projection: Albers Conic Equal Area, US standard parameters
(parallels 29.5°N / 45.5°N, origin 23°N -96°W). Pure-Python math,
no GDAL or third-party libs required.

Run: ``python scripts/build_fig_great_plains.py``
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT   = Path(__file__).resolve().parent.parent
STATES = ROOT / "static" / "data" / "states.json"
PHYSIO = ROOT / "static" / "data" / "physio-great-plains.geojson"
OUT    = ROOT / "static" / "figures" / "great-plains-physiographic.svg"

# ── Albers Conic Equal Area, US standard parameters ─────────────────────
RAD = math.pi / 180
CENTER_LAT = 23.0 * RAD
CENTER_LON = -96.0 * RAD
PAR1 = 29.5 * RAD
PAR2 = 45.5 * RAD
N = (math.sin(PAR1) + math.sin(PAR2)) / 2
C = math.cos(PAR1) ** 2 + 2 * N * math.sin(PAR1)
RHO0 = math.sqrt(C - 2 * N * math.sin(CENTER_LAT)) / N

# Exclude non-CONUS states from the figure (AK, HI, PR territories).
EXCLUDE_FIPS = {"02", "15", "72"}


def project(lon_deg: float, lat_deg: float) -> tuple[float, float]:
    """Project (lon, lat) in degrees to Albers x,y in unitless map coords."""
    lon = lon_deg * RAD
    lat = lat_deg * RAD
    rho = math.sqrt(max(0.0, C - 2 * N * math.sin(lat))) / N
    theta = N * (lon - CENTER_LON)
    return rho * math.sin(theta), RHO0 - rho * math.cos(theta)


def decode_topojson_arcs(topo: dict) -> list[list[tuple[float, float]]]:
    """Decode the arcs array of a quantized TopoJSON file to absolute
    (lon, lat) coordinate sequences."""
    transform = topo.get("transform", {})
    sx, sy = transform.get("scale",     [1.0, 1.0])
    tx, ty = transform.get("translate", [0.0, 0.0])
    out = []
    for raw_arc in topo["arcs"]:
        coords = []
        x = y = 0
        for dx, dy in raw_arc:
            x += dx
            y += dy
            coords.append((x * sx + tx, y * sy + ty))
        out.append(coords)
    return out


def assemble_rings(geom: dict, arcs: list) -> list[list[tuple[float, float]]]:
    """Walk a TopoJSON geometry's arc indices and return its rings as
    lists of (lon, lat). Handles Polygon and MultiPolygon. Negative
    arc indices mean reversed traversal (TopoJSON convention)."""
    if geom["type"] == "Polygon":
        polys = [geom["arcs"]]
    elif geom["type"] == "MultiPolygon":
        polys = geom["arcs"]
    else:
        return []
    rings = []
    for poly in polys:
        for ring_arc_idxs in poly:
            ring = []
            for idx in ring_arc_idxs:
                if idx >= 0:
                    ring.extend(arcs[idx])
                else:
                    ring.extend(reversed(arcs[~idx]))
            rings.append(ring)
    return rings


def geojson_rings(geom: dict) -> list[list[tuple[float, float]]]:
    """Flatten a GeoJSON Polygon/MultiPolygon geometry to a list of rings."""
    if geom["type"] == "Polygon":
        polys = [geom["coordinates"]]
    elif geom["type"] == "MultiPolygon":
        polys = geom["coordinates"]
    else:
        return []
    return [[(p[0], p[1]) for p in ring] for poly in polys for ring in poly]


def path_d(rings, to_svg) -> str:
    """Build an SVG path 'd' attribute from a list of (lon, lat) rings."""
    parts = []
    for ring in rings:
        if len(ring) < 2:
            continue
        xs, ys = zip(*[to_svg(lon, lat) for lon, lat in ring])
        parts.append(f"M{xs[0]:.1f},{ys[0]:.1f}")
        for i in range(1, len(xs)):
            parts.append(f"L{xs[i]:.1f},{ys[i]:.1f}")
        parts.append("Z")
    return "".join(parts)


def main() -> None:
    topo   = json.loads(STATES.read_text())
    physio = json.loads(PHYSIO.read_text())
    arcs   = decode_topojson_arcs(topo)

    # Per-state rings (excluding non-CONUS).
    state_rings: list[tuple[str, list]] = []
    for geom in topo["objects"]["states"]["geometries"]:
        fid = str(geom.get("id", "")).zfill(2)
        if fid in EXCLUDE_FIPS:
            continue
        state_rings.append((fid, assemble_rings(geom, arcs)))

    # Great Plains rings.
    gp_rings = []
    for feat in physio["features"]:
        gp_rings.extend(geojson_rings(feat["geometry"]))

    # Compute Albers-projected bounds across all state rings, then a
    # uniform scale-to-fit into the SVG viewport.
    xs, ys = [], []
    for _fid, rings in state_rings:
        for ring in rings:
            for lon, lat in ring:
                x, y = project(lon, lat)
                xs.append(x); ys.append(y)
    xmin, xmax = min(xs), max(xs)
    ymin, ymax = min(ys), max(ys)

    W, H, PAD = 960, 540, 24
    sx = (W - 2 * PAD) / (xmax - xmin)
    sy = (H - 2 * PAD) / (ymax - ymin)
    scale = min(sx, sy)
    offx = PAD + (W - 2 * PAD - (xmax - xmin) * scale) / 2 - xmin * scale
    offy = PAD + (H - 2 * PAD - (ymax - ymin) * scale) / 2 + ymax * scale

    def to_svg(lon: float, lat: float) -> tuple[float, float]:
        x, y = project(lon, lat)
        return x * scale + offx, -y * scale + offy

    state_paths = [path_d(rings, to_svg) for _fid, rings in state_rings]
    gp_d = path_d(gp_rings, to_svg)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"',
        # Explicit width/height + preserveAspectRatio so the SVG renders
        # at a sensible intrinsic size when embedded via <img>. Without
        # these, browsers fall back to the 300×150 default for SVGs
        # that only declare a viewBox.
        f'     width="{W}" height="{H}" preserveAspectRatio="xMidYMid meet"',
        '     role="img" aria-labelledby="gp-fig-title gp-fig-desc">',
        '  <title id="gp-fig-title">The Great Plains as a physiographic region</title>',
        '  <desc id="gp-fig-desc">The contiguous United States with the '
        'Fenneman (1928) Great Plains physiographic province highlighted '
        'in dark rust. The boundary cuts diagonally through eastern '
        'Montana, Wyoming, and Colorado, and the western edges of '
        'Minnesota, Iowa, Missouri, and Arkansas — independent of state '
        'lines.</desc>',
        f'  <rect width="{W}" height="{H}" fill="#fffaf3"/>',
        '  <g class="states" fill="#ece2cf" stroke="#b8a079" '
        'stroke-width="0.6" stroke-linejoin="round">',
    ]
    for d in state_paths:
        parts.append(f'    <path d="{d}"/>')
    parts.extend([
        '  </g>',
        '  <g class="great-plains" fill="#a94b2b" fill-opacity="0.18" '
        'stroke="#5a3a28" stroke-width="2.4" stroke-linejoin="round">',
        f'    <path d="{gp_d}"/>',
        '  </g>',
        '</svg>',
    ])
    OUT.write_text("\n".join(parts) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size:,} bytes)",
          file=sys.stderr)


if __name__ == "__main__":
    main()
