# Data build scripts

Every dataset published to `static/data/` is produced by one script in this
directory. Running the scripts re-fetches the raw source and rebuilds the
file checked into the repository. Together they document the provenance of
everything a visitor sees on the site.

## Requirements

Python 3.9 or newer. No third-party packages — the scripts use only the
standard library. (This is a deliberate choice so they stay portable.)

## Running

From the project root:

```sh
make                     # build everything
make farm-bankruptcies   # rebuild a single dataset
python scripts/build_conus_temperature.py   # or invoke directly
```

All scripts write to `../static/data/` relative to the `scripts/` directory.

## What each script produces

| Script | Output | Primary source |
| ------ | ------ | -------------- |
| `build_federal_lands.py` | `federal-lands.geojson` | `PublicaMundi/MappingAPI` state boundaries + CRS R42346 ownership-share table |
| `build_conus_temperature.py` | `conus-temperature.json` | NOAA NCEI Climate at a Glance, national region 110 (monthly tavg → annual mean → anomaly) |
| `build_conus_precipitation.py` | `conus-precipitation.json` | NOAA NCEI Climate at a Glance, national region 110 (monthly pcp → annual sum → anomaly) |
| `build_regions_climate.py` | `regions-precipitation.json`, `regions-temperature.json` | NOAA NCEI Climate at a Glance, regional time series (nClimDiv) — Northern Rockies & Plains, Southwest, Northwest, West |
| `build_bankhead_jones.py` | `national_grasslands.geojson`, `land_utilization_projects.geojson`, `federal_lands.geojson` | USDA Forest Service Enterprise Data Warehouse, via the author's earlier Bankhead-Jones project |
| `build_us_federal_lands.py` | `fedland.topojson` | PAD-US + Census state boundaries, pre-projected to AlbersUSA (the file is 2014-vintage) |
| `build_farm_bankruptcies.py` | `farm-bankruptcies.json` | `rdinter/historical-bankruptcies` (Stam ERS compilation + US Courts Table F-2) |
| `build_cosponsorship_network.py` | `cosponsorship-network.json` | GPO `govinfo.gov` BILLSTATUS bulk data (free, no API key); curated bill list in the script |
| `build_timeline.py` | `timeline.json` | Hand-curated 30-event federal-public-lands chronology (agencies + statutes + proclamations + rebellions), 1872–2024 |
| `build_bibliography.py` | `data/bibliography.json` | `Articles.bibtex` + `Books.bibtex` at the project root (Zotero / BibDesk exports) |

## What is *not* produced by these scripts

- **`bundy-network.json`** is hand-curated from historical sources (press
  coverage of Bunkerville 2014 and Malheur 2016; McCann, *Shadowlands*,
  2019; Temple, *Up in Arms*, 2019; federal trial records). It has no
  upstream to fetch. The file is edited by hand and versioned here.

## Updating

When upstream sources refresh, rerun the relevant script. The source URLs
are at the top of each file; update them if NOAA or the Administrative
Office of the US Courts reorganizes their publication paths.

If a script's logic changes (new bins, new state added to the choropleth,
a different baseline period for anomalies), the script is the place to
change it — not the generated JSON. Treat the JSON in `static/data/` as
build output.
