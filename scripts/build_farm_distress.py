#!/usr/bin/env python3
"""Build ``static/data/farm-distress.json``.

EXPERIMENT (see plan/STATUS.md): a combined view of the two ways a
farm exit becomes a statistic — USDA's foreclosure/forced-transfer
rate (1913-1981, then discontinued) and the farmer-bankruptcy filing
rate (1899-2024, with the 1980-86 tabulation hole) — on one shared
time axis, both in per-1,000-farms units. The point of the pairing is
the coverage asymmetry itself: the 1930s crisis is legible as
foreclosures, the 1980s crisis as bankruptcies, and each series' gap
band falls where the other carries the story.

No new data: this script merges the outputs of
``build_farm_foreclosures.py`` (``foreclosures`` rate) and
``build_farm_bankruptcies.py`` (``per_1k`` filing rate), which must be
built first — the Makefile target declares both as prerequisites.

Run: ``python scripts/build_farm_distress.py``
"""

from __future__ import annotations

import json

from _common import DATA_DIR, write_json

SOURCE = (
    "Merged from farm-foreclosures.json (USDA farm real estate transfer "
    "series, hand-transcribed, 1913-1981) and farm-bankruptcies.json "
    "(Stam/ERS and US Courts via Dinterman, 1899-2024), both as rates "
    "per 1,000 farms. See those files for full source detail."
)


def main() -> None:
    fore = json.loads((DATA_DIR / "farm-foreclosures.json").read_text())
    bank = json.loads((DATA_DIR / "farm-bankruptcies.json").read_text())

    fore_by_year = {r["year"]: r["foreclosures"] for r in fore["series"]}
    bank_by_year = {r["year"]: r.get("per_1k") for r in bank["national_annual"]}

    years = range(
        min(min(fore_by_year), min(bank_by_year)),
        max(max(fore_by_year), max(bank_by_year)) + 1,
    )
    rows = [
        {
            "year": y,
            "foreclosures": fore_by_year.get(y),
            "bankruptcies": bank_by_year.get(y),
        }
        for y in years
    ]

    assert any(r["foreclosures"] is not None for r in rows)
    assert any(r["bankruptcies"] is not None for r in rows)

    write_json(
        DATA_DIR / "farm-distress.json",
        {
            "title": "Farm foreclosure and farmer-bankruptcy rates, 1899–2024",
            "source": SOURCE,
            "data": rows,
        },
    )


if __name__ == "__main__":
    main()
