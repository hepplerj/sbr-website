#!/usr/bin/env python3
"""Build ``static/data/grasslands-cosponsorship-network.json``.

A second, parallel cosponsorship network — the *grasslands*
counterpart to the sagebrush-rebellion network at
``cosponsorship-network.json``. Same pipeline, different bill set.

Where the sagebrush network is heavy on Intermountain-West
transfer / disposal / Antiquities-Act-reform bills (BLM-dominated
politics), this network curates standalone bills on Plains
grasslands politics: Conservation Reserve Program (CRP) modifications,
sodsaver / native-sod protection, lesser prairie chicken
listing-and-delisting, sage-grouse, bison restoration, the
landmark North American Grasslands Conservation Act, and a few
National Grassland-specific items.

The analytical move: grasslands politics tends to be more
bipartisan (Thune + Klobuchar repeatedly co-sponsor sodsaver
bills; Heinrich + tribal allies on bison; Wyden / Klobuchar /
Bennet on NAGCA) than the sagebrush network. Reading the two
graphs side-by-side surfaces that contrast.

Same data sources as the sister script:
  108th Congress and later — GPO govinfo.gov BILLSTATUS XML (no key).
  Pre-108th — api.congress.gov v3 (requires CONGRESS_API_KEY env var).

Run: ``python scripts/build_grasslands_cosponsorship_network.py``
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import xml.etree.ElementTree as ET
from collections import Counter

from _common import DATA_DIR, fetch, write_json
from legislators import load_lookup as load_legislator_lookup

BULK     = "https://www.govinfo.gov/bulkdata/BILLSTATUS"
API_BASE = "https://api.congress.gov/v3"
API_KEY  = os.environ.get("CONGRESS_API_KEY", "")

# Bill list. Each entry: (congress, chamber-type, number, short-label, category).
# Categories: "grassland" | "crp" | "sodsaver" | "chicken" | "sage-grouse" | "bison".
#
# Routing: congress >= 108 → govinfo BILLSTATUS XML; congress < 108 → Congress.gov v3.
BILLS = [
    # ── 103rd–104th: Tallgrass Prairie National Preserve ─────────────────────
    # The 1994 attempt and the 1996 version that passed as Pub.L. 104-333
    # (via the Omnibus Parks act). Both standalone bills by Kassebaum (R-KS).
    (103, "s",  2412, "Tallgrass Prairie National Preserve Act (103rd, Kassebaum)",            "grassland"),
    (104, "s",  695,  "Tallgrass Prairie National Preserve Act (104th, Kassebaum)",            "grassland"),

    # ── 111th–112th: Buffalo Gap NG boundary mods ────────────────────────────
    (111, "hr", 5153, "Minuteman Missile NHS Boundary Modification (111th)",                   "grassland"),
    (112, "s",  1478, "Minuteman Missile NHS Boundary Modification (112th)",                   "grassland"),

    # ── 113th: First Thune-Klobuchar sodsaver; first LPC delisting push ──────
    (113, "s",  801,  "Prairie Protection Act (113th, Thune-Klobuchar)",                       "sodsaver"),
    (113, "hr", 4866, "Lesser Prairie Chicken Voluntary Recovery Act (113th)",                 "chicken"),

    # ── 114th: LPC re-intro ──────────────────────────────────────────────────
    (114, "hr", 659,  "Lesser Prairie Chicken Voluntary Recovery Act (114th)",                 "chicken"),

    # ── 115th: Sage-grouse + American Prairie Conservation Act re-intro ──────
    # S. 273 also appears in the sagebrush network — sage-grouse straddles
    # both stories. Noted on both sightline pages.
    (115, "s",  273,  "Greater Sage-Grouse Protection Act (115th, Risch)",                     "sage-grouse"),
    (115, "s",  1913, "American Prairie Conservation Act (115th, Thune-Klobuchar)",            "sodsaver"),

    # ── 117th: North American Grasslands Conservation Act, Senate intro ──────
    (117, "s",  4639, "North American Grasslands Conservation Act (117th, Wyden)",             "grassland"),

    # ── 118th: CRP, sodsaver, bison, NAGCA House intro ──────────────────────
    (118, "s",  1539, "American Prairie Conservation Act (118th, Thune-Klobuchar)",            "sodsaver"),
    (118, "hr", 4017, "Conservation Reserve Program Improvement Act (118th)",                  "crp"),
    (118, "hr", 8270, "Conservation Reserve Program Modernization Act (118th)",                "crp"),
    (118, "s",  5115, "Tribal Heritage & American Bison Restoration Act (118th, Heinrich)",    "bison"),
    (118, "hr", 9695, "Tribal Heritage & American Bison Restoration Act (118th, House)",       "bison"),
    (118, "hr", 9945, "North American Grasslands Conservation Act (118th, House)",             "grassland"),

    # ── 119th: LPC delisting push ────────────────────────────────────────────
    (119, "hr", 587,  "Lesser Prairie-Chicken delisting (119th, Mann)",                        "chicken"),
]

# Lower thresholds than the sagebrush network because this is a smaller set
# (16 bills vs 57). EDGE_MIN_WEIGHT=2 still keeps the graph readable.
EDGE_MIN_WEIGHT = 2
NODE_MIN_BILLS  = 2


# ── govinfo (108th+) ─────────────────────────────────────────────────────────

def govinfo_url(congress: int, btype: str, number: int) -> str:
    return f"{BULK}/{congress}/{btype}/BILLSTATUS-{congress}{btype}{number}.xml"


def parse_bill_xml(xml_text: str) -> dict:
    """Parse BILLSTATUS XML → {title, primary, cosponsors}."""
    root = ET.fromstring(xml_text)
    def g(el, tag):
        child = el.find(tag)
        return child.text if child is not None and child.text else ""
    def record(item: ET.Element) -> dict:
        return {
            "bioguide": g(item, "bioguideId"),
            "name":     g(item, "fullName"),
            "first":    g(item, "firstName"),
            "last":     g(item, "lastName"),
            "party":    g(item, "party"),
            "state":    g(item, "state"),
            "district": g(item, "district"),
        }
    primary    = [record(i) for i in root.findall(".//sponsors/item")]
    cosponsors = [record(i) for i in root.findall(".//cosponsors/item")]
    title_el   = root.find(".//title")
    title      = title_el.text if title_el is not None and title_el.text else ""
    return {"title": title, "primary": primary, "cosponsors": cosponsors}


# ── Congress.gov API (pre-108th) ─────────────────────────────────────────────

def fetch_bill_api(congress: int, btype: str, number: int) -> dict:
    """Fetch bill data from api.congress.gov → {title, primary, cosponsors}."""
    if not API_KEY:
        raise RuntimeError(
            "CONGRESS_API_KEY env var not set — required for pre-108th bills. "
            "Get a free key at https://api.congress.gov/sign-up/"
        )
    base = f"{API_BASE}/bill/{congress}/{btype}/{number}"
    bill_data = json.loads(fetch(f"{base}?api_key={API_KEY}&format=json"))
    bill      = bill_data.get("bill", {})
    title     = bill.get("title", "")

    def norm(s: dict) -> dict:
        district = s.get("district")
        return {
            "bioguide": s.get("bioguideId", ""),
            "name":     s.get("fullName", ""),
            "first":    s.get("firstName", ""),
            "last":     s.get("lastName", ""),
            "party":    s.get("party", ""),
            "state":    s.get("state", ""),
            "district": str(district) if district is not None else "",
        }

    primary = [norm(s) for s in bill.get("sponsors", [])]
    cosponsors: list[dict] = []
    limit, offset = 250, 0
    while True:
        url  = f"{base}/cosponsors?api_key={API_KEY}&format=json&limit={limit}&offset={offset}"
        data = json.loads(fetch(url))
        for s in data.get("cosponsors", []):
            if not s.get("sponsorshipWithdrawnDate"):
                cosponsors.append(norm(s))
        total  = data.get("pagination", {}).get("count", 0)
        offset += limit
        if offset >= total:
            break
        time.sleep(0.2)

    return {"title": title, "primary": primary, "cosponsors": cosponsors}


# ── Main pipeline ─────────────────────────────────────────────────────────────

def main() -> None:
    leg_lookup = load_legislator_lookup()
    if leg_lookup:
        print(f"  loaded {len(leg_lookup):,} legislators from cache",
              file=sys.stderr)

    legislator:    dict[str, dict]        = {}
    bill_cosps:    dict[tuple, list[str]] = {}
    bill_title:    dict[tuple, str]       = {}
    bill_category: dict[tuple, str]       = {}
    bill_primary:  dict[tuple, str | None] = {}
    leg_bills:     dict[str, list[tuple]] = {}

    for congress, btype, number, label, category in BILLS:
        try:
            if congress >= 108:
                body   = fetch(govinfo_url(congress, btype, number))
                parsed = parse_bill_xml(body)
            else:
                parsed = fetch_bill_api(congress, btype, number)
        except (urllib.error.HTTPError, urllib.error.URLError) as err:
            print(f"  skip {label!s:60s} [{err}]", file=sys.stderr)
            continue
        except ET.ParseError as err:
            print(f"  skip {label!s:60s} [parse error: {err}]", file=sys.stderr)
            continue
        except RuntimeError as err:
            print(f"  ERROR: {err}", file=sys.stderr)
            sys.exit(1)

        bkey = (congress, btype, number, label)
        bill_title[bkey]    = (parsed.get("title") or "").strip()
        bill_category[bkey] = category
        primary_people     = parsed["primary"]
        cosponsors         = parsed["cosponsors"]
        bill_primary[bkey] = primary_people[0]["bioguide"] if primary_people else None
        total              = len(primary_people) + len(cosponsors)
        src = "api" if congress < 108 else "govinfo"
        print(f"  [{src}] {congress}-{btype}-{number}: {total:3d} (co)sponsors  [{label}]",
              file=sys.stderr)

        bioguide_ids: list[str] = []
        for s in primary_people:
            bid = s["bioguide"]
            if not bid: continue
            bioguide_ids.append(bid)
            _ensure_leg(legislator, bid, s, leg_lookup)
            leg_bills.setdefault(bid, []).append((bkey, "sponsor"))
        for s in cosponsors:
            bid = s["bioguide"]
            if not bid: continue
            bioguide_ids.append(bid)
            _ensure_leg(legislator, bid, s, leg_lookup)
            leg_bills.setdefault(bid, []).append((bkey, "cosponsor"))

        bill_cosps[bkey] = bioguide_ids

    bill_count: Counter = Counter()
    for bids in bill_cosps.values():
        for b in set(bids):
            bill_count[b] += 1

    kept_ids = {b for b, n in bill_count.items() if n >= NODE_MIN_BILLS}
    kept_ids |= {sponsors[0] for sponsors in bill_cosps.values() if sponsors}

    shared: Counter = Counter()
    for bids in bill_cosps.values():
        kept = sorted(b for b in set(bids) if b in kept_ids)
        for i in range(len(kept)):
            for j in range(i + 1, len(kept)):
                shared[(kept[i], kept[j])] += 1

    nodes = []
    for bid in sorted(kept_ids):
        leg = legislator.get(bid)
        if not leg: continue
        cosponsored = []
        for (bkey, role) in sorted(leg_bills.get(bid, []),
                                   key=lambda x: (x[0][0], x[0][1], x[0][2])):
            c, t, n, lbl = bkey
            cosponsored.append({
                "congress": c, "type": t, "number": n, "label": lbl,
                "title": bill_title.get(bkey, ""), "role": role,
                "category": bill_category.get(bkey, ""),
            })
        nodes.append({
            **leg,
            "type":        party_to_type(leg["party"]),
            "role":        describe_legislator(leg, bill_count[bid]),
            "bills":       bill_count[bid],
            "cosponsored": cosponsored,
        })

    links = [
        {"source": a, "target": b, "weight": w, "type": "cosponsored"}
        for (a, b), w in shared.items() if w >= EDGE_MIN_WEIGHT
    ]

    in_edges = {n for e in links for n in (e["source"], e["target"])}
    nodes    = [n for n in nodes if n["id"] in in_edges]

    out = {
        "title": "Cosponsorship network on Plains grasslands bills",
        "source": (
            "GPO govinfo.gov BILLSTATUS (108th Congress+) and api.congress.gov "
            f"(pre-108th). Nodes: legislators cosponsoring ≥{NODE_MIN_BILLS} "
            f"bills; edges: pairs sharing ≥{EDGE_MIN_WEIGHT} cosponsorships. "
            "Sister network to cosponsorship-network.json. See "
            "scripts/build_grasslands_cosponsorship_network.py for the bill list."
        ),
        "bills": [
            {
                "congress": c, "type": t, "number": n, "label": lbl,
                "category": cat,
                "cosponsor_count": len(bill_cosps.get((c, t, n, lbl), [])),
            }
            for (c, t, n, lbl, cat) in BILLS
        ],
        "nodes": nodes,
        "links": links,
    }
    write_json(DATA_DIR / "grasslands-cosponsorship-network.json", out)
    print(f"\n{len(nodes)} legislators, {len(links)} edges "
          f"(weights ≥ {EDGE_MIN_WEIGHT})", file=sys.stderr)


def clean_name(full: str, first: str, last: str) -> str:
    def tc(s: str) -> str:
        return s[:1].upper() + s[1:].lower() if s.isupper() else s
    initial = (first[:1].upper() + ".") if first else ""
    return f"{initial} {tc(last)}".strip()


def _ensure_leg(registry: dict[str, dict], bid: str, record: dict,
                lookup: dict[str, dict] | None = None) -> None:
    """Register a legislator on first sight, then backfill missing fields
    from later records and from the unitedstates/congress-legislators
    YAML lookup. "Best wins" merge — see build_cosponsorship_network.py
    for the policy details (state/district authoritative from YAML,
    party prefers per-bill record). The two scripts share the same
    legislator helper module (scripts/legislators.py) but each keeps
    its own copy of this thin wrapper for clarity."""
    canonical = (lookup or {}).get(bid, {})
    new_entry = {
        "id":       bid,
        "label":    clean_name(record["name"], record["first"], record["last"]),
        "party":    record["party"] or "",
        "state":    record["state"] or canonical.get("state", ""),
        "district": record["district"] or "",
    }
    if bid not in registry:
        if not new_entry["party"]:
            new_entry["party"] = canonical.get("party", "")
        if not new_entry["district"] and canonical.get("type") == "rep":
            new_entry["district"] = canonical.get("district", "")
        registry[bid] = new_entry
        return
    existing = registry[bid]
    for field in ("state", "party", "district"):
        if not existing.get(field):
            existing[field] = new_entry.get(field, "") or canonical.get(field, "")


def party_to_type(party: str) -> str:
    return {"R": "republican", "D": "democrat", "I": "independent"}.get(party, "other")


def describe_legislator(leg: dict, n_bills: int) -> str:
    state    = leg["state"]
    district = leg["district"]
    chamber  = "Sen." if not district else f"Rep., {state}-{district}"
    party    = {"R": "R", "D": "D", "I": "I"}.get(leg["party"], "")
    tail     = f"{party}-{state}" if party else state
    return f"{chamber} ({tail}) · {n_bills} bills in set"


if __name__ == "__main__":
    main()
