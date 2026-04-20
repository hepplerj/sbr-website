PY ?= python3

.PHONY: data federal-lands conus-temperature conus-precipitation regions-climate bankhead-jones us-federal-lands farm-bankruptcies cosponsorship timeline bibliography clean-data site serve

data: federal-lands conus-temperature conus-precipitation regions-climate bankhead-jones us-federal-lands farm-bankruptcies cosponsorship timeline bibliography

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

farm-bankruptcies:
	$(PY) scripts/build_farm_bankruptcies.py

cosponsorship:
	$(PY) scripts/build_cosponsorship_network.py

timeline:
	$(PY) scripts/build_timeline.py

bibliography:
	$(PY) scripts/build_bibliography.py

# Build the site (requires Hugo extended)
site:
	hugo --gc --minify

serve:
	hugo server -D

clean-data:
	@echo "Not removing anything — rerun the build scripts instead."
	@echo "Files live in static/data/ and are under version control."
