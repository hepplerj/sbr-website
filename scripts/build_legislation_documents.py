#!/usr/bin/env python3
"""Scaffold Documents-archive page-bundles from ``legislation.md``.

Splits the transcribed state sagebrush bills into one page-bundle per
bill under ``content/documents/<slug>/index.md``, matching the existing
federal-statute documents. The bill *text* is lifted verbatim from
``legislation.md`` (the same source the text-reuse pipeline reads, so the
two never diverge); the *frontmatter* is the curated ``META`` below.

**Write-if-absent.** This only creates documents that do not yet exist —
it never overwrites, so hand-edits and added annotations are safe. Delete
a generated file and re-run to regenerate just that one.

Several fields are marked TODO in provenance and left as empty
``source.url``: the print sources are named where the transcript states
them, but canonical URLs and a couple of exact enactment dates still need
Jason's confirmation before these leave ``draft: true``.

Run: ``python scripts/build_legislation_documents.py``
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "legislation.md"
DOCS = ROOT / "content" / "documents"

# Curated per-bill frontmatter. `date` uses the enactment/approval date
# where confirmed, else the operative/effective date stated in the act
# (flagged in provenance). `weight` orders the bills chronologically
# after the federal statutes (which sit at weight 50).
META = {
    "nevada": {
        "title": "Nevada Sagebrush Rebellion Act (Assembly Bill 413, 1979)",
        "shorttitle": "Nevada A.B. 413",
        "date": "1979-02-15",
        "doctype": "statute",
        "sponsors": ["Assemblyman Dean Rhoads (lead) and 36 co-sponsors"],
        "citation": "Nev. Assemb. B. 413, 60th Sess. (1979)",
        "source_name": "Transcribed from the enrolled Assembly Bill No. 413",
        "provenance": (
            "The original 1979 Nevada act — the model text the other state bills "
            "reuse. Full text as introduced February 15, 1979. Source URL to be "
            "confirmed. Analyzed as the root of the genealogy in the text-reuse sightlines."
        ),
        "weight": 60,
    },
    "new-mexico": {
        "title": "New Mexico Public Lands Act (Laws 1980, Chapter 153)",
        "shorttitle": "New Mexico Ch. 153",
        "date": "1980-03-05",
        "doctype": "statute",
        "sponsors": ["New Mexico House of Representatives (House Bill 79)"],
        "citation": "N.M. Laws 1980, Ch. 153 (H.B. 79); codified at N.M. Stat. Ann. §§ 19-15-1 to 19-15-8",
        "source_name": "Transcribed from the session laws (Laws 1980, Ch. 153)",
        "provenance": (
            "House Bill 79, as amended; approved March 5, 1980. Adds the tax-rolls "
            "provision that Nevada's original lacks and that Arizona later reused. "
            "Source URL to be confirmed."
        ),
        "weight": 61,
    },
    "wyoming": {
        "title": "Wyoming State Control of Certain Land Act (Enrolled Act 38, 1980)",
        "shorttitle": "Wyoming Act 38",
        "date": "1980-03-30",
        "doctype": "statute",
        "sponsors": ["Wyoming House of Representatives (House Bill 6)"],
        "citation": "Wyo. Enrolled Act No. 38 (H.B. 6), 45th Leg. (1980); codified at Wyo. Stat. §§ 36-12-101 to 36-12-109",
        "source_name": "Transcribed from Enrolled Act No. 38",
        "provenance": (
            "Original House Bill No. 6, Forty-Fifth Legislature (1980 Session). Date "
            "shown is the operative date stated in the act (§ 36-12-103, \"after March 30, "
            "1980\"); exact enactment date and source URL to be confirmed."
        ),
        "weight": 62,
    },
    "utah": {
        "title": "Utah State Land Act (Senate Bill 5, 1980 Budget Session)",
        "shorttitle": "Utah S.B. 5",
        "date": "1980-07-01",
        "doctype": "statute",
        "sponsors": [
            "Ivan M. Matheson", "E. Verl Asay", "William N. Jones",
            "Sherman A. Wayment", "Jack M. Bangerter", "Eldon A. Money",
            "Miles 'Cap' Ferry",
        ],
        "citation": "Utah S.B. 5, 1980 Budget Sess.",
        "source_name": "Transcribed from the enrolled copy of S.B. No. 5",
        "provenance": (
            "Enrolled copy, 1980 Budget Session. Date shown is the effective date "
            "stated in the act (§ 10, \"take effect July 1, 1980\"); duties take effect "
            "only on a final adjudication of constitutionality (§ 7(6)). Source URL to be confirmed."
        ),
        "weight": 63,
    },
    "arizona": {
        "title": "Arizona State Claims to Public Lands (Laws 1980, Chapter 38)",
        "shorttitle": "Arizona Ch. 38",
        "date": "1980-07-31",
        "doctype": "statute",
        "sponsors": ["Arizona State Legislature"],
        "citation": "Ariz. Laws 1980, Ch. 38, § 2 (eff. July 31, 1980); codified at Ariz. Rev. Stat. §§ 37-901 to 37-909",
        "source_name": "Arizona Revised Statutes Annotated, Vol. 11A (1975–1983 Supp. Pamphlet)",
        "provenance": (
            "Chapter 5, \"State Claims to Public Lands,\" added by Laws 1980, Ch. 38, "
            "effective July 31, 1980; includes the earlier § 37-723 (Taylor Grazing "
            "distribution). The heaviest reuse edge in the corpus: closely follows New "
            "Mexico's elaborated text, tax-rolls provision and all. § 37-909 conditionally "
            "enacted pending a constitutionality adjudication. Source URL to be confirmed."
        ),
        "weight": 64,
    },
    "north-dakota": {
        "title": "North Dakota Sagebrush Rebellion Resolution (HCR 3036, 1981)",
        "shorttitle": "North Dakota HCR 3036",
        "date": "1981-03-25",
        "doctype": "resolution",
        "sponsors": [
            "Reps. O. Hanson, Marsden, Houmann",
            "Sens. Adams, Sorum, Parker",
        ],
        "citation": "N.D. House Concurrent Resolution No. 3036, 47th Legis. Assemb. (1981)",
        "source_name": "Transcribed from House Concurrent Resolution No. 3036",
        "provenance": (
            "A concurrent resolution expressing support for the Sagebrush Rebellion — "
            "rhetorical endorsement rather than a claim-of-title statute, which is why it "
            "sits apart in the text-reuse analysis. Passed March 25, 1981. Source URL to be confirmed."
        ),
        "weight": 65,
    },
    "south-dakota": {
        "title": "South Dakota Public Lands Transfer Act (Senate Bill 131, 1981)",
        "shorttitle": "South Dakota S.B. 131",
        "date": "1981-02-06",
        "doctype": "statute",
        "sponsors": [
            "Sens. Allen, Brown, Manke, Lyndell Petersen, Samuelson",
            "Reps. Marsden, Freeman, Jorgensen, Kocer, Lyon, Pederson, Van Gerpen",
        ],
        "citation": "S.D. Sen. B. 131, 56th Legis. Sess. (1981) (vetoed)",
        "source_name": "Transcribed from the engrossed Senate Bill No. 131",
        "provenance": (
            "Fifty-Sixth Session, 1981. The engrossed text as introduced is preserved "
            "here; a conference committee struck Sections 1–25, leaving only the Section "
            "26 prohibition on federal land acquisition, and the measure was ultimately "
            "vetoed. Date shown is Senate passage (Feb 6, 1981). Source URL to be confirmed."
        ),
        "weight": 66,
    },
    "alaska": {
        "title": "Alaska 'Tundra Rebellion' Initiative (Ballot Measure No. 5, 1982)",
        "shorttitle": "Alaska Ballot Measure 5",
        "date": "1982-11-02",
        "doctype": "initiative",
        "sponsors": ["Rep. Dick Randolph (sponsor); Initiative No. 80-01"],
        "citation": "Alaska Ballot Measure No. 5 / Initiative No. 80-01 (1982); amending AS 38.05.500–38.05.590",
        "source_name": "State of Alaska Official Election Pamphlet, Ballot Measure No. 5 (1982)",
        "provenance": (
            "A voter initiative — the \"Tundra Rebellion\" — passed 75% to 25% on November "
            "2, 1982. Transcript includes the Legislative Affairs Agency summary and the "
            "pro/con ballot statements alongside the full text. Its shared language runs "
            "through Wyoming's constitutional-sovereignty findings rather than Nevada's. "
            "Source URL to be confirmed."
        ),
        "weight": 67,
    },
}


def parse_blocks(md: str) -> dict:
    parts = re.split(r"(?m)^#\s+(.+?)\s*$", md)
    out = {}
    for i in range(1, len(parts), 2):
        name = parts[i].strip()
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        out[slug] = parts[i + 1].strip()
    return out


def yaml_list(key: str, items: list[str]) -> str:
    lines = [f"{key}:"]
    for it in items:
        lines.append(f'  - "{it}"')
    return "\n".join(lines)


def q(s: str) -> str:
    """Double-quoted YAML scalar with inner quotes/backslashes escaped."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def frontmatter(slug: str, m: dict) -> str:
    fm = ["---"]
    fm.append(f'title: {q(m["title"])}')
    fm.append(f'shortTitle: {q(m["shorttitle"])}')
    fm.append(f'date: {m["date"]}')
    fm.append(f'doctype: {m["doctype"]}')
    fm.append(yaml_list("sponsors", m["sponsors"]))
    fm.append("jurisdiction: state")
    fm.append(f'citation: {q(m["citation"])}')
    fm.append("source:")
    fm.append(f'  name: {q(m["source_name"])}')
    fm.append('  url: ""            # TODO: canonical source URL')
    fm.append("provenance: |")
    for line in _wrap(m["provenance"], 68):
        fm.append(f"  {line}")
    fm.append("themes: [public-lands, sagebrush-rebellion-1979]")
    fm.append(f'weight: {m["weight"]}')
    fm.append("draft: true")
    fm.append("toc: false")
    fm.append("---")
    return "\n".join(fm)


def _wrap(text: str, width: int) -> list[str]:
    words, line, out = text.split(), "", []
    for w in words:
        if line and len(line) + 1 + len(w) > width:
            out.append(line)
            line = w
        else:
            line = f"{line} {w}".strip()
    if line:
        out.append(line)
    return out


def main() -> None:
    blocks = parse_blocks(SRC.read_text(encoding="utf-8"))
    created, skipped, missing = [], [], []
    for slug, m in META.items():
        if slug not in blocks:
            missing.append(slug)
            continue
        dest = DOCS / slug / "index.md"
        if dest.exists():
            skipped.append(slug)
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(frontmatter(slug, m) + "\n\n" + blocks[slug] + "\n", encoding="utf-8")
        created.append(slug)
    print(f"  created: {', '.join(created) or '(none)'}")
    if skipped:
        print(f"  skipped (already exist): {', '.join(skipped)}")
    if missing:
        print(f"  WARNING — no block in legislation.md for: {', '.join(missing)}")


if __name__ == "__main__":
    main()
