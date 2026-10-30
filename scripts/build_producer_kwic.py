"""Keyword-in-context shards for the *American Cattle Producer* corpus.

For every term in the lexicon defined in ``build_producer_terms.py``, extract
each occurrence with ±10 words of context plus an issue citation, so the
concordance atlas page can show any frequency curve's underlying lines and
deep-link each one to the archive.org reader.

Requires the OCR cache built by ``build_producer_terms.py`` (run
``make producer-terms`` first — this script does not download).

Output:
- static/data/producer-kwic/index.json — concept/term inventory with per-year
  occurrence counts (sparkline data, so the page never fetches a shard just
  to draw the picker).
- static/data/producer-kwic/{term}.json — one shard per term with all its
  KWIC lines. Fetched lazily by atlas.js when the term is selected.

Line records are compact: ``k`` is the issue-identifier suffix (e.g.
"1947-02_28_9" → date 1947-02, vol 28, iss 9); prepend
"sim_american-beef-producer_" to reconstruct the archive.org identifier.

Unlike the frequency counts (which run on lowercased text), context is
extracted from case-preserving text so the lines read like the page; the
same patterns are applied case-insensitively, so counts here match the
frequency build.
"""

from __future__ import annotations

import json
import re
import sys

from _common import DATA_DIR, write_json
from build_producer_terms import CACHE, LEXICON, TXT_DIR

OUT_DIR = DATA_DIR / "producer-kwic"
ID_PREFIX = "sim_american-beef-producer_"
CONTEXT_WORDS = 10
CONTEXT_CHARS = 90  # generous byte window before word-trimming


def clean_display(raw: str) -> str:
    """Dehyphenate linebreaks and collapse whitespace, preserving case."""
    text = re.sub(r"-\s*\n\s*", "", raw)
    return re.sub(r"\s+", " ", text)


def trim_words(s: str, n: int, *, tail: bool) -> str:
    words = s.split(" ")
    return " ".join(words[-n:] if tail else words[:n])


def main() -> None:
    docs = json.loads((CACHE / "manifest.json").read_text())
    docs = [d for d in docs if d.get("year")]
    docs.sort(key=lambda d: d.get("date", ""))
    years = sorted({int(d["year"]) for d in docs})
    yi = {y: i for i, y in enumerate(years)}

    terms = [
        (cid, clabel, tid, tlabel, re.compile(rx, re.IGNORECASE))
        for cid, clabel, term_list in LEXICON
        for tid, tlabel, rx in term_list
    ]
    lines: dict[str, list[dict]] = {tid: [] for _, _, tid, _, _ in terms}
    byyear: dict[str, list[int]] = {tid: [0] * len(years) for _, _, tid, _, _ in terms}

    for n, d in enumerate(docs, 1):
        ident = d["identifier"]
        suffix = ident.removeprefix(ID_PREFIX)
        year = int(d["year"])
        text = clean_display((TXT_DIR / f"{ident}.txt").read_text(errors="replace"))
        for _, _, tid, _, rx in terms:
            for m in rx.finditer(text):
                pre = text[max(0, m.start() - CONTEXT_CHARS) : m.start()]
                post = text[m.end() : m.end() + CONTEXT_CHARS]
                lines[tid].append(
                    {
                        "k": suffix,
                        "pre": trim_words(pre.strip(), CONTEXT_WORDS, tail=True),
                        "m": m.group(0),
                        "post": trim_words(post.strip(), CONTEXT_WORDS, tail=False),
                    }
                )
                byyear[tid][yi[year]] += 1
        if n % 100 == 0:
            print(f"scanned {n}/{len(docs)}", file=sys.stderr)

    concepts = []
    for cid, clabel, term_list in LEXICON:
        concepts.append(
            {
                "id": cid,
                "label": clabel,
                "terms": [
                    {
                        "id": tid,
                        "label": tlabel,
                        "total": sum(byyear[tid]),
                        "byyear": byyear[tid],
                    }
                    for tid, tlabel, _ in term_list
                ],
            }
        )

    write_json(
        OUT_DIR / "index.json",
        {
            "source": "American Cattle Producer (archive.org: pub_american-beef-producer)",
            "idprefix": ID_PREFIX,
            "years": years,
            "concepts": concepts,
        },
    )
    for cid, _, tid, tlabel, _ in terms:
        write_json(
            OUT_DIR / f"{tid}.json",
            {"term": tid, "label": tlabel, "concept": cid, "lines": lines[tid]},
        )
    total = sum(len(v) for v in lines.values())
    print(f"{total:,} KWIC lines across {len(terms)} terms", file=sys.stderr)


if __name__ == "__main__":
    main()
