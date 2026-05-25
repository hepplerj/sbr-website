#!/usr/bin/env bash
# Build static/data/physio-great-plains.geojson — the Fenneman (1928)
# Great Plains physiographic province boundary as a single dissolved
# polygon, simplified for web delivery.
#
# Source: USGS physiographic divisions of the conterminous US.
#   https://water.usgs.gov/GIS/dsdl/physio_shp.zip
#   ESRI shapefile, NAD83 (EPSG:4269), Fenneman & Johnson 1946 update
#   of Fenneman 1928. Public domain.
#
# Requires GDAL (ogr2ogr) — install with `brew install gdal`.
#
# Unlike the Python build_* scripts, this is a shell script because the
# project's stdlib-only Python rule wouldn't accommodate shapefile I/O.
# The output is committed; re-run only if the upstream shapefile changes
# (which it won't — Fenneman's classification is historical).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CACHE="$ROOT/scripts/.cache/physio"
SRC_URL="https://water.usgs.gov/GIS/dsdl/physio_shp.zip"
OUT="$ROOT/static/data/physio-great-plains.geojson"

mkdir -p "$CACHE"

if [ ! -f "$CACHE/physio.zip" ]; then
  echo "  fetching $SRC_URL"
  curl -sL "$SRC_URL" -o "$CACHE/physio.zip"
fi

if [ ! -f "$CACHE/physio.shp" ]; then
  (cd "$CACHE" && unzip -q -o physio.zip)
fi

# Dissolve all sections of PROVINCE = 'GREAT PLAINS' into one polygon;
# simplify to ~2km tolerance (0.02 degrees). 70KB output is plenty
# faithful for a national-scale boundary overlay.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ogr2ogr -f GeoJSON "$TMP/dissolved.geojson" "$CACHE/physio.shp" \
  -sql "SELECT 'Great Plains' AS name, 'Fenneman 1928' AS source, ST_Union(geometry) AS geometry FROM physio WHERE PROVINCE = 'GREAT PLAINS'" \
  -dialect sqlite

ogr2ogr -f GeoJSON "$OUT" "$TMP/dissolved.geojson" -simplify 0.02

echo "wrote $(python3 -c "import os; print(os.path.relpath('$OUT', '$ROOT'))") ($(wc -c < "$OUT") bytes)"
