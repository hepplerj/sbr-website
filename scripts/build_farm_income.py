"""
build_farm_income.py — USDA ERS Farm Income and Wealth Statistics

Downloads the ERS Farm Income and Wealth Statistics bulk CSV release and
extracts U.S.-level time series for six metrics:

  • Net farm income          (million $, 1910–2026)
  • Farm assets, Dec. 31    (million $, 1910–2026)
  • Farm debt, Dec. 31      (million $, 1910–2026)
  • Farm equity, Dec. 31    (million $, 1910–2026)
  • Government payments     (million $, ~1933–2026)
  • Debt-to-asset ratio     (converted to %, 1910–2026)

Output: static/data/farm-income.json

Source:
  https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/
  February 2026 release ZIP:
  https://www.ers.usda.gov/media/7007/february-5-2026-release.zip

No API key required. The ZIP (~20 MB compressed, ~104 MB unzipped) contains
a single CSV with 460 k rows; we scan it once and keep only U.S.-aggregate
rows for the six target variables.
"""

from __future__ import annotations

import csv
import io
import zipfile

from _common import DATA_DIR, fetch, write_json

URL = (
    "https://www.ers.usda.gov/media/7007/february-5-2026-release.zip"
)

# VariableDescriptionTotal values to capture → output field name.
# Exact strings from the February 2026 release CSV.
VARS: dict[str, str] = {
    "Net farm income":                                          "net_farm_income",
    "Dec. 31 value of farm assets, excl. operator dwellings":  "farm_assets",
    "Dec. 31 value of farm debt, all, excl. operator dwelling": "farm_debt",
    "Dec. 31 value of farm equity, all, excl. operator dwelling": "farm_equity",
    "Value of government payments, total":                      "govt_payments",
    "Debt to asset ratio, excl. operator dwellings":            "debt_asset_ratio",
}

# Dollar fields are in $1,000 units in the CSV; convert to billions (÷ 1,000,000).
# The debt-to-asset ratio is already in Percent — no conversion needed.
DOLLAR_FIELDS = {
    "net_farm_income", "farm_assets", "farm_debt", "farm_equity", "govt_payments"
}


def main() -> None:
    print("Downloading ERS Farm Income and Wealth Statistics ZIP …")
    raw = fetch(URL, binary=True)
    print(f"  Downloaded {len(raw):,} bytes.")

    rows: dict[int, dict] = {}

    with zipfile.ZipFile(io.BytesIO(raw)) as zf:
        csv_names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        if not csv_names:
            raise RuntimeError("No CSV file found inside the ZIP.")
        csv_name = csv_names[0]
        print(f"  Parsing {csv_name} …")

        with zf.open(csv_name) as raw_f:
            reader = csv.DictReader(
                io.TextIOWrapper(raw_f, encoding="latin-1")
            )
            for row in reader:
                # U.S. aggregate only (not state rows)
                if row.get("State", "").strip().upper() != "US":
                    continue

                var = row.get("VariableDescriptionTotal", "").strip()
                if var not in VARS:
                    continue

                year_str = row.get("Year", "").strip()
                if not year_str.isdigit():
                    continue
                year = int(year_str)

                raw_amount = row.get("Amount", "").strip()
                try:
                    amount: float | None = float(raw_amount)
                except (ValueError, TypeError):
                    amount = None

                field = VARS[var]

                if year not in rows:
                    rows[year] = {"year": year}

                if field == "debt_asset_ratio":
                    # Already reported in Percent by ERS; store as-is.
                    rows[year][field] = (
                        round(amount, 2) if amount is not None else None
                    )
                else:
                    # Dollar fields: CSV units are $1,000. Convert to billion $.
                    rows[year][field] = (
                        round(amount / 1_000_000, 3) if amount is not None else None
                    )

    if not rows:
        raise RuntimeError(
            "No matching rows found. Check that variable names still match "
            "the ERS CSV schema."
        )

    # Build a sorted, gap-filled list (one dict per year).
    all_fields = list(VARS.values())
    data = []
    for year in sorted(rows):
        rec: dict = {"year": year}
        for f in all_fields:
            rec[f] = rows[year].get(f)
        data.append(rec)

    year_range = f"{data[0]['year']}–{data[-1]['year']}"
    print(f"  {len(data)} years ({year_range}), {len(all_fields)} fields.")

    out = {
        "source": (
            "USDA Economic Research Service, Farm Income and Wealth Statistics, "
            "February 2026 release. "
            "https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/"
        ),
        "units": {
            "net_farm_income":  "Billion dollars (nominal)",
            "farm_assets":      "Billion dollars (nominal)",
            "farm_debt":        "Billion dollars (nominal)",
            "farm_equity":      "Billion dollars (nominal)",
            "govt_payments":    "Billion dollars (nominal)",
            "debt_asset_ratio": "Percent",
        },
        "data": data,
    }

    write_json(DATA_DIR / "farm-income.json", out)


if __name__ == "__main__":
    main()
