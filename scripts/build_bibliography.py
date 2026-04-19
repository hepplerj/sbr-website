#!/usr/bin/env python3
"""Build ``data/bibliography.json`` from the project's BibTeX sources.

Input: ``Articles.bibtex`` and ``Books.bibtex`` at the repo root, as
exported from the author's reference manager. The entries arrive without
explicit cite keys (``@book{\\n  title = ...``); this script generates
stable keys of the form ``{lastname}{year}{firstword}`` with alphabetic
suffixes on collision.

Output: a single flat map at ``data/bibliography.json``. Hugo reads it as
``.Site.Data.bibliography``. The ``{{< cite >}}`` shortcode looks up by
key; the Sources page iterates the whole map and groups by ``type``.

Each entry carries both the structured fields (for inline citations and
filtering) and a pre-rendered ``chicago`` HTML string (for display in the
bibliography).

Run: ``python scripts/build_bibliography.py``
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
SOURCES = [ROOT / "Articles.bibtex", ROOT / "Books.bibtex"]

STOPWORDS = {
    "the", "a", "an", "of", "and", "or", "in", "on", "at", "to",
    "for", "from", "by", "with", "as", "is", "are", "be", "that", "this",
}


# ── BibTeX parsing (stdlib only) ────────────────────────────────────────
def parse_file(text: str) -> list[tuple[str, str]]:
    """Return a list of (entry_type, body) tuples from a BibTeX string."""
    entries: list[tuple[str, str]] = []
    i = 0
    while i < len(text):
        at = text.find("@", i)
        if at == -1:
            break
        brace = text.find("{", at)
        if brace == -1:
            break
        entry_type = text[at + 1 : brace].strip().lower()
        # Find the matching closing brace (brace-balanced)
        depth = 1
        j = brace + 1
        while j < len(text) and depth > 0:
            c = text[j]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            j += 1
        if depth != 0:
            break
        body = text[brace + 1 : j - 1]
        entries.append((entry_type, body))
        i = j
    return entries


def parse_fields(body: str) -> dict[str, str]:
    """Pull fields out of a BibTeX entry body."""
    fields: dict[str, str] = {}
    i = 0
    n = len(body)
    while i < n:
        # Skip leading whitespace/commas
        while i < n and body[i] in " \t\n,":
            i += 1
        if i >= n:
            break
        # Read key up to = or whitespace
        start = i
        while i < n and body[i] not in " \t\n=":
            i += 1
        key = body[start:i].strip().lower()
        if not key:
            break
        # Advance to '='
        while i < n and body[i] in " \t\n":
            i += 1
        if i >= n or body[i] != "=":
            break
        i += 1
        while i < n and body[i] in " \t\n":
            i += 1
        if i >= n:
            break
        # Value: {…} or "…" or bare token
        if body[i] == "{":
            depth = 1
            j = i + 1
            while j < n and depth > 0:
                if body[j] == "{":
                    depth += 1
                elif body[j] == "}":
                    depth -= 1
                j += 1
            value = body[i + 1 : j - 1]
            i = j
        elif body[i] == '"':
            j = i + 1
            while j < n and body[j] != '"':
                j += 1
            value = body[i + 1 : j]
            i = j + 1
        else:
            j = i
            while j < n and body[j] not in " \t\n,":
                j += 1
            value = body[i:j]
            i = j
        fields[key] = value
    return fields


# ── Field cleanup — strip protective braces, LaTeX escapes ──────────────
def clean(value: str) -> str:
    v = value.strip()
    # Protective double braces: {{Sagebrush}} → Sagebrush (repeatable)
    for _ in range(3):
        v = re.sub(r"\{\{([^{}]*)\}\}", r"\1", v)
    # Single protective braces, simple cases (no nesting left)
    v = re.sub(r"\{([^{}]*)\}", r"\1", v)
    # LaTeX escapes
    replacements = {
        r"\&": "&", r"\%": "%", r"\$": "$", r"\#": "#",
        r"\_": "_", r"\{": "{", r"\}": "}",
        "---": "—", "--": "–",
        "``": "\u201c", "''": "\u201d",
    }
    for a, b in replacements.items():
        v = v.replace(a, b)
    # Normalize whitespace
    v = re.sub(r"\s+", " ", v).strip()
    return v


# ── Author parsing ──────────────────────────────────────────────────────
def split_authors(author_str: str) -> list[str]:
    return [a.strip() for a in re.split(r"\s+and\s+", author_str) if a.strip()]


def author_lastname(author: str) -> str:
    """Return just the lastname from an author string (various formats)."""
    if "," in author:
        return author.split(",", 1)[0].strip()
    parts = author.split()
    return parts[-1] if parts else ""


def author_display(author: str) -> str:
    """'Lastname, First' → 'First Lastname'; else return as-is."""
    if "," in author:
        last, first = [s.strip() for s in author.split(",", 1)]
        return f"{first} {last}"
    return author


def author_inverted(author: str) -> str:
    """'First Lastname' → 'Lastname, First'; 'Last, First' passthrough."""
    if "," in author:
        return author
    parts = author.rsplit(" ", 1)
    if len(parts) == 2:
        return f"{parts[1]}, {parts[0]}"
    return author


# ── Cite key generation ─────────────────────────────────────────────────
def make_key(fields: dict[str, str], used: set[str]) -> str:
    author = fields.get("author", "") or fields.get("editor", "")
    first_author = split_authors(author)[0] if author else "anon"
    last = author_lastname(first_author)
    last = re.sub(r"[^a-z]", "", last.lower()) or "anon"

    year = re.sub(r"[^0-9]", "", fields.get("year", ""))[:4] or "nd"

    title = fields.get("shorttitle") or fields.get("title", "")
    # First substantive word, lowercased, alphanum-only
    words = re.findall(r"[A-Za-z]{3,}", title.lower())
    word = next((w for w in words if w not in STOPWORDS), "work")

    base = f"{last}{year}{word}"
    key = base
    suffix_idx = 0
    while key in used:
        suffix_idx += 1
        key = f"{base}{chr(ord('a') + suffix_idx - 1)}"
    used.add(key)
    return key


# ── Chicago-style rendering ─────────────────────────────────────────────
def format_authors_chicago(authors: list[str]) -> str:
    """Chicago bibliography-style author block. First author inverted,
    subsequent authors in natural order. "et al." for 4+. A trailing period
    is added unless the last author already ends in one (handles "Smith, J.")."""
    if not authors:
        return ""
    if len(authors) == 1:
        block = author_inverted(authors[0])
    elif len(authors) == 2:
        block = f"{author_inverted(authors[0])}, and {author_display(authors[1])}"
    elif len(authors) == 3:
        block = (
            f"{author_inverted(authors[0])}, {author_display(authors[1])}, "
            f"and {author_display(authors[2])}"
        )
    else:
        block = f"{author_inverted(authors[0])} et al"
    return block if block.endswith(".") else block + "."


def chicago(entry: dict, fields: dict[str, str]) -> str:
    """Return a Chicago-notes-bibliography formatted HTML string."""
    authors = split_authors(fields.get("author", ""))
    editors = split_authors(fields.get("editor", ""))

    parts: list[str] = []
    if authors:
        parts.append(format_authors_chicago(authors))
    elif editors:
        parts.append(format_authors_chicago(editors).rstrip(".") + ", ed.")

    title = fields.get("title", "")
    year = fields.get("year", "")
    kind = entry["type"]

    if kind == "article":
        parts.append(f'"{title}."')
        journal = fields.get("journal", "")
        volume = fields.get("volume", "")
        number = fields.get("number", "")
        pages = fields.get("pages", "")
        loc = ""
        if volume:
            loc = volume
            if number:
                loc += f", no. {number}"
        locator = f" {loc}" if loc else ""
        year_str = f" ({year})" if year else ""
        pages_str = f": {pages}." if pages else "."
        if journal:
            parts.append(f"<em>{journal}</em>{locator}{year_str}{pages_str}")

    elif kind in ("book", "mastersthesis", "techreport"):
        parts.append(f"<em>{title}</em>.")
        tail_bits: list[str] = []
        if kind == "book":
            loc = fields.get("location") or fields.get("address") or ""
            pub = fields.get("publisher", "")
            if loc and pub:
                tail_bits.append(f"{loc}: {pub}")
            elif pub:
                tail_bits.append(pub)
        elif kind == "mastersthesis":
            school = fields.get("school", "")
            tail_bits.append(f"Master's thesis, {school}" if school else "Master's thesis")
        elif kind == "techreport":
            inst = fields.get("institution", "") or fields.get("publisher", "")
            if inst:
                tail_bits.append(inst)
        if year:
            tail_bits.append(year)
        if tail_bits:
            parts.append(", ".join(tail_bits) + ".")

    elif kind == "incollection":
        parts.append(f'"{title}."')
        booktitle = fields.get("booktitle", "")
        in_bits: list[str] = []
        if booktitle:
            in_bits.append(f"In <em>{booktitle}</em>")
        if editors:
            in_bits.append(
                "edited by " + ", ".join(author_display(e) for e in editors)
            )
        pages = fields.get("pages", "")
        if pages:
            in_bits.append(pages)
        if in_bits:
            parts.append(", ".join(in_bits) + ".")
        tail_bits = []
        loc = fields.get("location") or fields.get("address") or ""
        pub = fields.get("publisher", "")
        if loc and pub:
            tail_bits.append(f"{loc}: {pub}")
        elif pub:
            tail_bits.append(pub)
        if year:
            tail_bits.append(year)
        if tail_bits:
            parts.append(", ".join(tail_bits) + ".")

    else:  # misc etc.
        if title:
            parts.append(f"<em>{title}</em>.")
        if year:
            parts.append(f"{year}.")

    doi = fields.get("doi", "")
    url = fields.get("url", "")
    if doi:
        parts.append(f'<a href="https://doi.org/{doi}">https://doi.org/{doi}</a>.')
    elif url:
        parts.append(f'<a href="{url}">{url}</a>.')

    return " ".join(p for p in parts if p).strip()


# ── Main ────────────────────────────────────────────────────────────────
def main() -> None:
    bibliography: dict[str, dict] = {}
    used_keys: set[str] = set()
    counts: dict[str, int] = {}

    for path in SOURCES:
        if not path.exists():
            print(f"skip: {path.name} not found", file=sys.stderr)
            continue
        raw = path.read_text(encoding="utf-8")
        for entry_type, body in parse_file(raw):
            raw_fields = parse_fields(body)
            fields = {k: clean(v) for k, v in raw_fields.items()}
            if not fields.get("title"):
                continue
            key = make_key(fields, used_keys)
            authors = split_authors(fields.get("author", ""))

            entry: dict = {
                "type": entry_type,
                "key": key,
                "title": fields.get("title", ""),
                "shorttitle": fields.get("shorttitle", ""),
                "author": fields.get("author", ""),
                "authors": [author_display(a) for a in authors],
                "authorlast": author_lastname(authors[0]) if authors else "",
                "year": fields.get("year", ""),
                "decade": f"{fields.get('year', '0000')[:3]}0s" if fields.get("year") else "",
                "publisher": fields.get("publisher", ""),
                "journal": fields.get("journal", ""),
                "volume": fields.get("volume", ""),
                "number": fields.get("number", ""),
                "pages": fields.get("pages", ""),
                "booktitle": fields.get("booktitle", ""),
                "editor": fields.get("editor", ""),
                "doi": fields.get("doi", ""),
                "url": fields.get("url", ""),
                "isbn": fields.get("isbn", ""),
                "institution": fields.get("institution", ""),
                "school": fields.get("school", ""),
            }
            entry["chicago"] = chicago(entry, fields)
            # Drop empty fields to keep the JSON tidy
            entry = {k: v for k, v in entry.items() if v not in ("", [], None)}

            bibliography[key] = entry
            counts[entry_type] = counts.get(entry_type, 0) + 1

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_DIR / "bibliography.json"
    out_path.write_text(json.dumps(bibliography, separators=(",", ":"), sort_keys=True))

    total = sum(counts.values())
    breakdown = ", ".join(f"{n} {t}" for t, n in sorted(counts.items()))
    print(f"wrote {out_path.relative_to(ROOT)} ({out_path.stat().st_size:,} bytes)", file=sys.stderr)
    print(f"entries: {total} ({breakdown})", file=sys.stderr)


if __name__ == "__main__":
    main()
