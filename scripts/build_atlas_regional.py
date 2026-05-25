#!/usr/bin/env python3
"""Build the regional cosponsorship atlas.

For each Congress in CONGRESS_RANGE (default 96th–119th, covering 1979
to present — the full standalone-cosponsorship era), aggregate
cosponsorship activity by:

  state-delegation region × CRS policy area × chamber × party

and write:

  static/data/atlas-regional-{congress}.json   — one per Congress
  static/data/atlas-regional-timeseries.json   — combined long-form

Data sources (dispatched on Congress number):

  108th and later (2003+):
    GPO ``govinfo.gov`` BILLSTATUS bulk-data ZIPs, one per chamber-
    type per Congress. Keyless, fast (~50MB/Congress), parsed locally.

  96th–107th (1979–2002):
    ``api.congress.gov`` v3 JSON API. Requires CONGRESS_API_KEY env
    var (free at https://api.congress.gov/sign-up/). Each bill needs
    a detail fetch (for policyArea + sponsor) and conditional cosp
    fetch (only when count > 0). All API responses cached to
    ``scripts/.cache/atlas/cgapi/{cong}/{type}/`` so reruns are
    local-only. A full 96th–107th sweep is ~186k API calls; throttled
    at 18,000/hour (safely under the 20k/hr key limit) this takes
    ~10 hours. The script is resumable — re-running picks up cached
    bills and continues from where it left off.

Bill types included: hr, s, hjres, sjres. Resolutions (sres, hres,
sconres, hconres) excluded — procedural/honorific.

The 96th Congress (1979–80) is the institutional floor for this
metric: cosponsorship was rule-prohibited in the House until 1967
and cosponsor counts were capped at 25 per bill until the 95th–96th
turnover in 1979. Pre-96th cosponsorship data exists but is not
comparable.

Run::

    python scripts/build_atlas_regional.py                   # 96–119
    python scripts/build_atlas_regional.py 117               # single
    python scripts/build_atlas_regional.py 96 107            # range
    python scripts/build_atlas_regional.py --smoketest       # tiny end-to-end test

Environment::

    CONGRESS_API_KEY   required for any Congress < 108
    ATLAS_API_DELAY    seconds between API calls; default 0.2 (=18k/hr)
"""

from __future__ import annotations

import io
import json
import os
import re
import sys
import time
import http.client
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from _common import DATA_DIR, fetch, write_json, UA

ROOT       = Path(__file__).resolve().parent.parent
CACHE_DIR  = ROOT / "scripts" / ".cache" / "atlas"
API_CACHE  = CACHE_DIR / "cgapi"
BULK       = "https://www.govinfo.gov/bulkdata/BILLSTATUS"
API_BASE   = "https://api.congress.gov/v3"
API_KEY    = os.environ.get("CONGRESS_API_KEY", "")
API_DELAY  = float(os.environ.get("ATLAS_API_DELAY", "0.05"))   # post-call breath
API_WORKERS = int(os.environ.get("ATLAS_API_WORKERS", "6"))      # parallel fetchers

BILL_TYPES = ["hr", "s", "hjres", "sjres"]

GOVINFO_FLOOR = 108  # Congresses < this use the Congress.gov API path

# Congress → "YYYY-YY" label. 108th = 2003-04 (Jan 3, 2003 onwards).
def years_label(cong: int) -> str:
    start = 1789 + (cong - 1) * 2
    return f"{start}-{(start + 1) % 100:02d}"

DEFAULT_RANGE = (96, 119)

REGIONS = {
    "great-plains": {
        "label":  "Great Plains",
        "states": ["MT", "WY", "CO", "ND", "SD", "NE", "KS"],
    },
    "rest-west": {
        "label":  "American West",
        "states": ["AK", "AZ", "CA", "HI", "ID", "NM", "NV", "OR", "UT", "WA"],
    },
    "corn-belt": {
        "label":  "Midwest",
        "states": ["IA", "IL", "IN", "MI", "MN", "MO", "OH", "WI"],
    },
}

POLICY_AREAS = [
    "Public Lands and Natural Resources",
    "Agriculture and Food",
    "Environmental Protection",
    "Water Resources Development",
    "Energy",
    "Animals",
]

STATE_TO_REGION = {
    st: slug for slug, r in REGIONS.items() for st in r["states"]
}


def fetch_zip(congress: int, btype: str) -> bytes | None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    dest = CACHE_DIR / f"BILLSTATUS-{congress}-{btype}.zip"
    if dest.exists() and dest.stat().st_size > 1024:
        return dest.read_bytes()
    url = f"{BULK}/{congress}/{btype}/BILLSTATUS-{congress}-{btype}.zip"
    print(f"    fetching {url}", file=sys.stderr)
    try:
        return fetch(url, dest=dest, binary=True)
    except Exception as e:
        print(f"    !! fetch failed: {e}", file=sys.stderr)
        return None


# ─────────────────── Congress.gov API path (96th–107th) ───────────────────

# Extract (party, state) from a Congress.gov fullName like
# "Rep. Anderson, John B. [R-IL-16]" or "Sen. McCain, John [R-AZ]".
# The cosponsors endpoint returns state=null for pre-108th data, so we
# rely on this prefix instead.
_NAME_TAG_RE = re.compile(r"\[([A-Z]{1,3})-([A-Z]{2})(?:-\d+)?\]")


def parse_name_tag(full: str) -> tuple[str, str]:
    """Return (state, party) parsed from fullName; ("","") if not found."""
    m = _NAME_TAG_RE.search(full or "")
    return (m.group(2), m.group(1)) if m else ("", "")


def api_get(path: str, params: dict | None = None,
            retries: int = 8) -> dict | None:
    """GET a Congress.gov v3 endpoint with rate-limit throttling and retries.

    Returns the parsed JSON, or None on 404. Raises on terminal failure."""
    if not API_KEY:
        raise RuntimeError("CONGRESS_API_KEY not set — required for pre-108th data")
    qs = dict(params or {})
    qs.setdefault("format", "json")
    qs["api_key"] = API_KEY
    url = f"{API_BASE}/{path.lstrip('/')}?{urllib.parse.urlencode(qs)}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            time.sleep(API_DELAY)
            return json.loads(body.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code == 429 or e.code >= 500:
                wait = (2 ** attempt) * 4
                print(f"    !! API {e.code}, retry in {wait}s ({path})",
                      file=sys.stderr)
                time.sleep(wait)
                continue
            raise
        except (urllib.error.URLError,
                http.client.HTTPException,
                TimeoutError, ConnectionError, OSError) as e:
            wait = (2 ** attempt) * 4
            print(f"    !! network error, retry in {wait}s: {type(e).__name__} {e}",
                  file=sys.stderr, flush=True)
            time.sleep(wait)
    raise RuntimeError(f"API_GET gave up after {retries} attempts: {path}")


def _cache_path(congress: int, btype: str, num: str, kind: str) -> Path:
    """Disk-cache path: cgapi/{cong}/{type}/{kind}-{num}.json"""
    p = API_CACHE / str(congress) / btype
    p.mkdir(parents=True, exist_ok=True)
    return p / f"{kind}-{num}.json"


def fetch_detail(congress: int, btype: str, num: str) -> dict | None:
    cache = _cache_path(congress, btype, num, "detail")
    if cache.exists():
        return json.loads(cache.read_text())
    body = api_get(f"bill/{congress}/{btype}/{num}")
    if body is None:
        return None
    cache.write_text(json.dumps(body, separators=(",", ":")))
    return body


def fetch_cosp_pages(congress: int, btype: str, num: str) -> list[dict]:
    """All cosponsor records for a bill, paginated and cached."""
    cache = _cache_path(congress, btype, num, "cosp")
    if cache.exists():
        return json.loads(cache.read_text())
    all_cosp = []
    offset = 0
    while True:
        page = api_get(f"bill/{congress}/{btype}/{num}/cosponsors",
                       {"limit": 250, "offset": offset})
        if page is None:
            break
        items = page.get("cosponsors", []) or []
        all_cosp.extend(items)
        nxt = (page.get("pagination") or {}).get("next")
        if not nxt or not items:
            break
        offset += len(items)
        if offset > 2500:  # paranoia
            break
    cache.write_text(json.dumps(all_cosp, separators=(",", ":")))
    return all_cosp


def list_all_bill_numbers(congress: int, btype: str) -> list[str]:
    """Enumerate every bill number of type ``btype`` in this Congress."""
    cache = _cache_path(congress, btype, "_all", "numbers")
    if cache.exists():
        return json.loads(cache.read_text())
    print(f"    listing {congress}/{btype}…", file=sys.stderr, flush=True)
    out, offset = [], 0
    while True:
        page = api_get(f"bill/{congress}/{btype}",
                       {"limit": 250, "offset": offset})
        if page is None:
            break
        items = page.get("bills", []) or []
        for b in items:
            n = str(b.get("number", "")).strip()
            if n:
                out.append(n)
        nxt = (page.get("pagination") or {}).get("next")
        if not nxt or not items:
            break
        offset += len(items)
    print(f"    listed {congress}/{btype}: {len(out)} bills",
          file=sys.stderr, flush=True)
    cache.write_text(json.dumps(out, separators=(",", ":")))
    return out


def _from_record(rec):
    """Normalize a sponsor/cosponsor JSON record to our tuple shape.
    For pre-108th data the cosp endpoint returns state=null and an
    embedded '[R-IL-16]' suffix in fullName; we parse that as fallback."""
    bio   = (rec.get("bioguideId") or "").strip()
    full  = (rec.get("fullName")   or "").strip()
    state = (rec.get("state")      or "").strip()
    party = (rec.get("party")      or "").strip()
    if not state or not party:
        s, p = parse_name_tag(full)
        state = state or s
        party = party or p
    return (bio, full, state, party)


def _fetch_bill_combined(congress: int, btype: str, num: str):
    """Worker: detail + optional cosp, returns a (num, payload) pair.
    payload = (policy_area, sponsors, cosponsors) or None on failure."""
    try:
        detail = fetch_detail(congress, btype, num)
    except Exception as e:
        return num, None
    if detail is None:
        return num, None
    bill = detail.get("bill", {}) or {}
    pa = (bill.get("policyArea") or {}).get("name") or "Uncategorized"
    sponsors = [_from_record(s) for s in bill.get("sponsors", []) or []]
    cosp_count = ((bill.get("cosponsors") or {}).get("count") or 0)
    cosponsors = []
    if cosp_count:
        try:
            raw = fetch_cosp_pages(congress, btype, num)
            cosponsors = [_from_record(r) for r in raw]
        except Exception:
            pass
    return num, (pa, sponsors, cosponsors)


def iter_bills_api(congress: int):
    """Yield (bill_id, policy_area, sponsors[], cosponsors[]) tuples for
    ``congress`` via the Congress.gov v3 API, cached aggressively.
    Uses a small thread pool (default 6 workers) so we're network-bound
    rather than latency-bound on each individual call."""
    for btype in BILL_TYPES:
        nums = list_all_bill_numbers(congress, btype)
        if not nums:
            continue
        print(f"    {btype}: {len(nums):,} bills (api, {API_WORKERS} workers)",
              file=sys.stderr, flush=True)
        done = 0
        with ThreadPoolExecutor(max_workers=API_WORKERS) as pool:
            futs = {pool.submit(_fetch_bill_combined, congress, btype, n): n
                    for n in nums}
            for fut in as_completed(futs):
                num, payload = fut.result()
                done += 1
                if done % 500 == 0:
                    print(f"      … {btype} {done:,}/{len(nums):,}",
                          file=sys.stderr, flush=True)
                if payload is None:
                    continue
                pa, sponsors, cosponsors = payload
                yield f"{btype.upper()}-{num}", pa, sponsors, cosponsors


def chamber_of(full_name: str) -> str:
    """Derive 'house' or 'senate' from BILLSTATUS fullName prefix."""
    if full_name.startswith("Sen."):  return "senate"
    if full_name.startswith("Rep."):  return "house"
    if full_name.startswith("Del."):  return "house"
    if full_name.startswith("Res."):  return "house"   # Resident Commissioner
    return "house"  # safe default; almost no other prefixes appear


def party_bucket(p: str) -> str:
    p = (p or "").upper()
    if p == "D": return "d"
    if p == "R": return "r"
    return "i"


def iter_bills(congress: int):
    """Dispatch to the right data path based on Congress number."""
    if congress >= GOVINFO_FLOOR:
        yield from iter_bills_bulk(congress)
    else:
        yield from iter_bills_api(congress)


def iter_bills_bulk(congress: int):
    for btype in BILL_TYPES:
        zbytes = fetch_zip(congress, btype)
        if zbytes is None:
            continue
        try:
            zf = zipfile.ZipFile(io.BytesIO(zbytes))
        except zipfile.BadZipFile:
            print(f"    !! bad zip for {congress}/{btype}", file=sys.stderr)
            continue
        with zf:
            xml_names = [n for n in zf.namelist() if n.endswith(".xml")]
            print(f"    {btype}: {len(xml_names):,} bills", file=sys.stderr)
            for name in xml_names:
                try:
                    with zf.open(name) as fh:
                        root = ET.parse(fh).getroot()
                except (ET.ParseError, KeyError):
                    continue
                bill = root.find("bill")
                if bill is None:
                    continue
                num = bill.findtext("number", "").strip()
                bid = f"{btype.upper()}-{num}"
                pa  = bill.findtext("policyArea/name", "") or "Uncategorized"

                def people(parent_tag):
                    out = []
                    for it in bill.findall(f"{parent_tag}/item"):
                        out.append((
                            (it.findtext("bioguideId") or "").strip(),
                            (it.findtext("fullName")   or "").strip(),
                            (it.findtext("state")      or "").strip(),
                            (it.findtext("party")      or "").strip(),
                        ))
                    return out

                yield bid, pa, people("sponsors"), people("cosponsors")


def build_one(congress: int) -> dict:
    """Build the per-Congress aggregate and return its dict (also writes
    the per-Congress JSON file)."""
    print(f"\n[Congress {congress}]", file=sys.stderr)

    # Per-region per-PA buckets
    cell_cosp   = Counter()                  # (region, bucket)
    cell_bills  = defaultdict(set)
    cell_by_ch  = defaultdict(Counter)       # (region, bucket) → Counter({chamber: n})
    cell_by_pty = defaultdict(Counter)       # (region, bucket) → Counter({party: n})

    members     = {}
    delegation  = defaultdict(set)
    delegation_by_ch = defaultdict(lambda: defaultdict(set))  # region → chamber → {bio}

    pa_totals   = Counter()
    seen_bills  = 0
    kept_bills  = 0

    for bid, pa, sponsors, cosponsors in iter_bills(congress):
        seen_bills += 1
        bucket = pa if pa in POLICY_AREAS else "Other"
        attached = sponsors + cosponsors
        if not attached:
            continue
        kept_bills += 1
        for bio, full, state, party in attached:
            region = STATE_TO_REGION.get(state)
            if region is None:
                continue
            ch  = chamber_of(full)
            pty = party_bucket(party)
            delegation[region].add(bio)
            delegation_by_ch[region][ch].add(bio)
            cell_cosp[(region, bucket)] += 1
            cell_bills[(region, bucket)].add(bid)
            cell_by_ch[(region, bucket)][ch] += 1
            cell_by_pty[(region, bucket)][pty] += 1
            pa_totals[bucket] += 1
            m = members.setdefault(bio, {
                "bioguide": bio, "name": full, "state": state,
                "party": party, "chamber": ch, "region": region,
                "totals": Counter(), "total": 0,
            })
            m["totals"][bucket] += 1
            m["total"] += 1

    region_totals = {slug: 0 for slug in REGIONS}
    for (region, _bucket), n in cell_cosp.items():
        region_totals[region] += n

    # Build cells (one per region × surfaced PA)
    cells = []
    for slug in REGIONS:
        mem_total = len(delegation[slug]) or 1
        mem_house = len(delegation_by_ch[slug]["house"]) or 1
        mem_sen   = len(delegation_by_ch[slug]["senate"]) or 1
        for area in POLICY_AREAS:
            n = cell_cosp.get((slug, area), 0)
            bills_n = len(cell_bills.get((slug, area), ()))
            share = n / region_totals[slug] if region_totals[slug] else 0
            by_ch = cell_by_ch.get((slug, area), Counter())
            by_pty = cell_by_pty.get((slug, area), Counter())
            cells.append({
                "region":         slug,
                "policyArea":     area,
                "cosponsorships": n,
                "bills":          bills_n,
                "perMember":      round(n / mem_total, 2),
                "shareOfRegion":  round(share, 4),
                "byChamber": {
                    "house":  {"cosp": by_ch["house"],
                               "perMem": round(by_ch["house"]  / mem_house, 2)},
                    "senate": {"cosp": by_ch["senate"],
                               "perMem": round(by_ch["senate"] / mem_sen,   2)},
                },
                "byParty": {
                    "d": by_pty["d"],
                    "r": by_pty["r"],
                    "i": by_pty["i"],
                },
            })

    region_records = []
    for slug, info in REGIONS.items():
        region_records.append({
            "slug":         slug,
            "label":        info["label"],
            "states":       info["states"],
            "memberCount":  len(delegation[slug]),
            "memberHouse":  len(delegation_by_ch[slug]["house"]),
            "memberSenate": len(delegation_by_ch[slug]["senate"]),
            "totalCosp":    region_totals[slug],
        })

    member_records = []
    for m in members.values():
        totals = {a: m["totals"].get(a, 0) for a in POLICY_AREAS}
        totals["Other"] = m["totals"].get("Other", 0)
        member_records.append({
            "bioguide": m["bioguide"], "name": m["name"],
            "state": m["state"], "party": m["party"],
            "chamber": m["chamber"], "region": m["region"],
            "totals": totals, "total": m["total"],
        })
    member_records.sort(key=lambda r: (-r["total"], r["name"]))

    out = {
        "congress":      congress,
        "years":         years_label(congress),
        "billTypes":     BILL_TYPES,
        "policyAreas":   POLICY_AREAS,
        "regions":       region_records,
        "cells":         cells,
        "members":       member_records,
        "billsSeen":     seen_bills,
        "billsKept":     kept_bills,
    }

    dest = DATA_DIR / f"atlas-regional-{congress}.json"
    write_json(dest, out)

    # Console summary
    print(f"  {seen_bills:,} bills seen, {kept_bills:,} with attachments",
          file=sys.stderr)
    for r in region_records:
        print(f"    {r['label']:<40s}  {r['memberCount']:>3d} members "
              f"({r['memberHouse']}H/{r['memberSenate']}S), "
              f"{r['totalCosp']:>7,d} cosponsorships", file=sys.stderr)
    return out


def build_timeseries(per_congress: list[dict]) -> None:
    """Combined long-form file for trend visualizations."""
    cells = []
    for d in per_congress:
        for c in d["cells"]:
            row = dict(c)
            row["congress"] = d["congress"]
            cells.append(row)
    cong_meta = {
        str(d["congress"]): {
            "years":     d["years"],
            "billsKept": d["billsKept"],
            "regionSize": {
                r["slug"]: {
                    "total":  r["memberCount"],
                    "house":  r["memberHouse"],
                    "senate": r["memberSenate"],
                }
                for r in d["regions"]
            },
        }
        for d in per_congress
    }
    regions = per_congress[-1]["regions"] if per_congress else []
    out = {
        "regions":      [{"slug": r["slug"], "label": r["label"], "states": r["states"]}
                         for r in regions],
        "policyAreas":  POLICY_AREAS,
        "congresses":   [d["congress"] for d in per_congress],
        "congressMeta": cong_meta,
        "cells":        cells,
    }
    write_json(DATA_DIR / "atlas-regional-timeseries.json", out)


def smoketest() -> None:
    """Tiny end-to-end check of the API path. Pulls the 107th sjres set
    (~75 bills) and prints summary stats. ~1-2 minutes."""
    print("Smoke test: 107th Congress, sjres only (api path)", file=sys.stderr)
    nums = list_all_bill_numbers(107, "sjres")
    print(f"  bill numbers: {len(nums)}", file=sys.stderr)
    pas = Counter()
    with_cosp = 0
    for num in nums[:25]:
        d = fetch_detail(107, "sjres", num)
        if d is None:
            continue
        b = d.get("bill", {}) or {}
        pas[(b.get("policyArea") or {}).get("name") or "—"] += 1
        if ((b.get("cosponsors") or {}).get("count") or 0) > 0:
            with_cosp += 1
    print(f"  first 25 sampled: {with_cosp} have cosponsors", file=sys.stderr)
    print(f"  policy areas: {dict(pas)}", file=sys.stderr)
    print(f"  cache dir: {API_CACHE / '107' / 'sjres'}", file=sys.stderr)


def main(argv: list[str]) -> None:
    if len(argv) >= 2 and argv[1] == "--smoketest":
        smoketest()
        return
    if len(argv) == 1:
        cong_lo, cong_hi = DEFAULT_RANGE
    elif len(argv) == 2:
        c = int(argv[1]); cong_lo = cong_hi = c
    elif len(argv) >= 3:
        cong_lo, cong_hi = int(argv[1]), int(argv[2])
    else:
        cong_lo, cong_hi = DEFAULT_RANGE

    per_congress = []
    for c in range(cong_lo, cong_hi + 1):
        try:
            per_congress.append(build_one(c))
        except Exception as e:
            print(f"  !! skipped {c}: {e}", file=sys.stderr)

    if len(per_congress) > 1:
        build_timeseries(per_congress)
        print(f"\nWrote combined time-series: {len(per_congress)} Congresses",
              file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv)
