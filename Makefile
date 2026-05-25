PY ?= python3

# Auto-load scripts/.env if present, so API keys (NASS_API_KEY,
# CONGRESS_API_KEY) come through to recipes without a manual
# `source`. The file is gitignored; see scripts/.env for the format.
ifneq (,$(wildcard scripts/.env))
  include scripts/.env
  export
endif

.PHONY: data federal-lands conus-temperature conus-precipitation regions-climate bankhead-jones us-federal-lands grazing-districts usfs-allotments grazing-allotments farm-bankruptcies farm-consolidation farm-income cattle-prices follow-the-money cosponsorship grasslands-cosponsorship atlas-regional timeline bibliography clean-data site site-fast serve

data: federal-lands conus-temperature conus-precipitation regions-climate bankhead-jones us-federal-lands grazing-districts usfs-allotments grazing-allotments farm-consolidation farm-bankruptcies farm-income follow-the-money cosponsorship grasslands-cosponsorship atlas-regional timeline bibliography

federal-lands:
	$(PY) scripts/build_federal_lands.py

conus-temperature:
	$(PY) scripts/build_conus_temperature.py

conus-precipitation:
	$(PY) scripts/build_conus_precipitation.py

regions-climate:
	$(PY) scripts/build_regions_climate.py

bankhead-jones:
	$(PY) scripts/build_bankhead_jones.py

us-federal-lands:
	$(PY) scripts/build_us_federal_lands.py

grazing-districts:
	$(PY) scripts/build_grazing_districts.py

usfs-allotments:
	$(PY) scripts/build_usfs_allotments.py

grazing-allotments:
	$(PY) scripts/build_grazing_allotments.py

farm-bankruptcies:
	$(PY) scripts/build_farm_bankruptcies.py

follow-the-money:
	$(PY) scripts/build_follow_the_money.py

# Requires NASS_API_KEY env var (free at quickstats.nass.usda.gov/api).
farm-consolidation:
	$(PY) scripts/build_farm_consolidation.py

# Requires NASS_API_KEY env var. Also pulls CPI from FRED (no key).
cattle-prices:
	$(PY) scripts/build_cattle_prices.py


farm-income:
	$(PY) scripts/build_farm_income.py
cosponsorship:
	$(PY) scripts/build_cosponsorship_network.py

# Sister network — grasslands / Plains-conservation bills. Same key
# requirement as cosponsorship (CONGRESS_API_KEY for pre-108th bills,
# none for 108th+).
grasslands-cosponsorship:
	$(PY) scripts/build_grasslands_cosponsorship_network.py

# Atlas: regional cosponsorship profile by CRS policy area, 96th–119th
# Congresses (1979–present). The 108th+ uses keyless govinfo bulk-data
# ZIPs (fast); 96th–107th uses the keyed api.congress.gov v3 path
# (slow — full backfill is ~10 hours throttled at 18k/hr).
#
# Override the range with CONGRESS_RANGE (e.g. "117 117" for a single
# Congress, or "96 107" for just the legacy backfill).
#   make atlas-regional CONGRESS_RANGE="117 117"
CONGRESS_RANGE ?= 96 119
atlas-regional:
	$(PY) scripts/build_atlas_regional.py $(CONGRESS_RANGE)

atlas-regional-smoketest:
	$(PY) scripts/build_atlas_regional.py --smoketest

# Fenneman (1928) Great Plains physiographic-province boundary overlay
# for the sightlines mini-map. One-off shell script — requires GDAL
# (ogr2ogr); install with `brew install gdal`. Output is committed,
# so only re-run if the upstream USGS shapefile is updated (effectively
# never — it's a historical classification).
physio-great-plains:
	bash scripts/build_physio_great_plains.sh

timeline:
	$(PY) scripts/build_timeline.py

bibliography:
	$(PY) scripts/build_bibliography.py

# Build the site (requires Hugo extended) and the Pagefind search
# index. Pagefind runs after Hugo, indexing the built public/ tree
# into public/pagefind/. Requires Node/npx (no global install needed).
site:
	hugo --gc --minify
	npx --yes pagefind@latest --site public

# Hugo build only — skips the search index. Faster for content checks.
site-fast:
	hugo --gc --minify

serve:
	hugo server -D

clean-data:
	@echo "Not removing anything — rerun the build scripts instead."
	@echo "Files live in static/data/ and are under version control."
