#!/usr/bin/env python3
"""Build ``static/data/cattle-prices.json``.

Annual prices received by ranchers for cattle, US national average,
in dollars per hundredweight ($/cwt), with both nominal and
inflation-adjusted (CPI-U, last-full-year dollars) figures.

Why this matters: cattle prices are the ranchers'-eye-view of the
commodity that public-land grazing is fundamentally about. The series
runs back to the early 20th century, which makes the long 1970s
rancher-income squeeze (precursor to the 1979 Rebellion), the 1980s
Farm-Crisis collapse, and the post-2014 recovery legible against
the other rural-economy charts on this site.

Sources:
  - USDA NASS QuickStats — `CATTLE - PRICES RECEIVED, MEASURED IN
    $ / CWT` (national, annual). Requires a free NASS_API_KEY env
    var (see https://quickstats.nass.usda.gov/api).
  - Federal Reserve Bank of St. Louis (FRED) — CPIAUCNS (CPI-U for
    All Urban Consumers, all items, not seasonally adjusted, monthly
    back to 1913). Public CSV, no key required. Aggregated here to
    annual averages and used to deflate nominal prices.

Run: ``python scripts/build_cattle_prices.py``
"""

from __future__ import annotations

import csv
import io
import json
import os
import sys
import urllib.parse
import urllib.request
from collections import defaultdict

from _common import DATA_DIR, write_json

NASS_API = "https://quickstats.nass.usda.gov/api/api_GET/"
FRED_CPI_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCNS"

# NASS short_descs to fetch. The headline series is "CATTLE - PRICES
# RECEIVED"; the steers/heifers slaughter-cattle series and the
# beef-cow series tell sub-stories the headline averages over.
SERIES = [
    ("cattle", "CATTLE, GE 500 LBS - PRICE RECEIVED, MEASURED IN $ / CWT",
     "Cattle (≥500 lbs)",
     "Adult cattle (calves excluded) — the broadest rancher-price headline. Monthly back to 1909."),
    ("steers_heifers", "CATTLE, STEERS & HEIFERS, GE 500 LBS - PRICE RECEIVED, MEASURED IN $ / CWT",
     "Steers & heifers (≥500 lbs)",
     "Finished cattle ready for slaughter — the feedlot/finisher's selling price. Back to 1953."),
    ("calves", "CATTLE, CALVES - PRICE RECEIVED, MEASURED IN $ / CWT",
     "Calves",
     "Weaned calves sold off the range — the cow-calf operator's main income. Monthly back to 1909."),
]

MONTHS = {"JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"}


def fetch_nostore(url: str, ua: str = "") -> bytes:
    """Fetch a URL with an optional User-Agent (some hosts, notably
    FRED, reject the project's default UA for keyless CSV downloads,
    so we let the caller choose)."""
    req = urllib.request.Request(url)
    if ua:
        req.add_header("User-Agent", ua)
    with urllib.request.urlopen(req) as r:
        return r.read()


def nass(short_desc: str) -> list[dict]:
    """Fetch a NASS QuickStats series, national annual."""
    key = os.environ.get("NASS_API_KEY")
    if not key:
        sys.exit(
            "NASS_API_KEY is not set.\n"
            "Get a free key at https://quickstats.nass.usda.gov/api and\n"
            "    export NASS_API_KEY=YOUR-KEY-HERE"
        )
    q = {
        "key": key,
        "format": "JSON",
        "short_desc": short_desc,
        "agg_level_desc": "NATIONAL",
        # Annual values appear as `reference_period_desc == "YEAR"`. We
        # filter for them after fetch rather than in the API call —
        # NASS rejects some over-constrained queries with HTTP 400.
    }
    body = fetch_nostore(NASS_API + "?" + urllib.parse.urlencode(q),
                         ua="governing-ground-pipeline/1.0")
    return json.loads(body).get("data", [])


def to_float(s: str) -> float | None:
    if not s or s in ("(D)", "(NA)", "(Z)"):
        return None
    try:
        return float(s.replace(",", "").replace("$", ""))
    except ValueError:
        return None


def best_annual(records: list[dict]) -> dict[int, float]:
    """Reduce per-year records to a single value per year. NASS only
    tags 1996+ records with reference_period_desc == "YEAR"; for
    earlier years (back to ~1909 for some series), only monthly
    records exist. So: prefer the published YEAR value when present,
    otherwise compute a simple annual mean from the 12 monthlies."""
    yearly: dict[int, float] = {}
    monthly: dict[int, list[float]] = {}
    for r in records:
        period = r.get("reference_period_desc", "")
        try:
            y = int(r["year"])
        except (KeyError, ValueError):
            continue
        v = to_float(r.get("Value", ""))
        if v is None:
            continue
        if period == "YEAR":
            yearly[y] = v
        elif period in MONTHS:
            monthly.setdefault(y, []).append(v)

    out: dict[int, float] = {}
    # Use YEAR where published
    out.update(yearly)
    # Fill in earlier years from monthly mean (require ≥10 months so a
    # half-reported year doesn't show up as a misleading anomaly).
    for y, vs in monthly.items():
        if y in out:
            continue
        if len(vs) >= 10:
            out[y] = sum(vs) / len(vs)
    return out


def fetch_cpi_annual() -> dict[int, float]:
    """Fetch CPIAUCNS monthly from FRED, return annual means."""
    body = fetch_nostore(FRED_CPI_URL)
    reader = csv.reader(io.StringIO(body.decode("utf-8")))
    rows = list(reader)
    header = rows[0]
    # Defensive — FRED has used both "DATE" and "observation_date".
    date_idx = next(i for i, h in enumerate(header)
                    if h.lower() in ("date", "observation_date"))
    val_idx = next(i for i, h in enumerate(header) if h.upper() == "CPIAUCNS")
    by_year: dict[int, list[float]] = defaultdict(list)
    for row in rows[1:]:
        if len(row) <= max(date_idx, val_idx):
            continue
        try:
            y = int(row[date_idx][:4])
            v = float(row[val_idx])
        except (ValueError, IndexError):
            continue
        by_year[y].append(v)
    # Only fully-observed years (12 months) — drop a half-year tail
    # so the latest "annual" CPI isn't a partial-year underestimate.
    return {y: sum(vs) / len(vs) for y, vs in by_year.items() if len(vs) >= 12}


def main() -> None:
    cpi = fetch_cpi_annual()
    if not cpi:
        sys.exit("FRED CPI fetch returned no rows")
    base_year = max(cpi)            # deflate to the latest full year
    base_cpi = cpi[base_year]
    print(f"CPI base year: {base_year} (index = {base_cpi:.2f})")

    series_out = []
    all_years: set[int] = set()
    for key, short_desc, label, blurb in SERIES:
        rows = nass(short_desc)
        nominal = best_annual(rows)
        all_years |= set(nominal)
        data = []
        for y in sorted(nominal):
            n = nominal[y]
            cpi_y = cpi.get(y)
            real = round(n * base_cpi / cpi_y, 2) if cpi_y else None
            data.append({"year": y, "nominal": round(n, 2), "real": real})
        series_out.append({
            "key": key,
            "label": label,
            "description": blurb,
            "data": data,
        })
        last = data[-1]
        real_s = f"${last['real']:.2f}" if last.get("real") is not None else "n/a"
        print(f"  {key:<16} {len(data)} years "
              f"({data[0]['year']}–{last['year']}), "
              f"latest nominal ${last['nominal']:.2f}/cwt, "
              f"real {real_s}/cwt")

    years = sorted(all_years)
    # Wide-format `data` array for the line-chart renderer. Each row
    # carries the real and nominal prices for each series as separate
    # columns; cells with no data come through as null/missing.
    by_year_wide: dict[int, dict] = {y: {"year": y} for y in years}
    for s in series_out:
        for row in s["data"]:
            wide = by_year_wide[row["year"]]
            wide[s["key"]] = row["real"]
            wide[s["key"] + "_nominal"] = row["nominal"]
    data_wide = [by_year_wide[y] for y in years]

    out = {
        "title": "Cattle prices received by ranchers, US national average",
        "unit_nominal": "USD per hundredweight ($/cwt), nominal",
        "unit_real":    f"USD per hundredweight ($/cwt), {base_year} dollars",
        "base_year":    base_year,
        "year_range":   [years[0], years[-1]] if years else [],
        "series":       series_out,   # long form, with per-row {nominal, real}
        "data":         data_wide,     # wide form, for the line-chart renderer
        "source": (
            "Nominal prices: USDA NASS QuickStats, "
            "'CATTLE [classes] - PRICE RECEIVED, MEASURED IN $ / CWT', "
            "national annual where published, else simple mean of monthly "
            "values (≥10 months required). CPI deflator: Federal Reserve "
            "Bank of St. Louis (FRED), CPIAUCNS, annual mean. Real prices "
            f"in {base_year} dollars."
        ),
    }
    write_json(DATA_DIR / "cattle-prices.json", out)


if __name__ == "__main__":
    main()
