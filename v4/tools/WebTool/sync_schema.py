#!/usr/bin/env python3
"""Keep the schema embedded in CIEmetaDB.html byte-identical to the schema file.

CIEmetaDB.html is a single-file offline tool: it runs from file://, where fetch()
is blocked by CORS, so it cannot load ../../schema/CIEmetaDigitalProduct_schema_04.json
at runtime. Instead the schema is embedded verbatim in a

    <script type="application/json" id="cieSchemaSource">

block, and the tool parses that block for both structural validation and its enum
catalogues. The schema is therefore written down once, not twice.

This script maintains that invariant.

    python sync_schema.py            re-embed the schema file into the HTML
    python sync_schema.py --check    verify they match; exit 1 if they do not

Run --check in CI on any change to either file. Because the comparison is
byte-for-byte, it cannot miss a divergence the way eyeballing two differently
written schemas can - which is how the wavelength_* and titleType defects both
survived review while the schema was maintained in two places.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
HTML = HERE / "CIEmetaDB.html"
SCHEMA = HERE.parent.parent / "schema" / "CIEmetaDigitalProduct_schema_04.json"

BLOCK = re.compile(
    r'(?P<open><script type="application/json" id="cieSchemaSource">\n)'
    r"(?P<body>.*?)"
    r'(?P<close></script>)',
    re.DOTALL,
)


def read(path: Path) -> str:
    """Read a file preserving its line endings exactly.

    newline="" keeps CRLF/LF as written; Path.read_text only accepts it from
    Python 3.13, so open() is used directly.
    """
    with open(path, encoding="utf-8", newline="") as fh:
        return fh.read()


def write(path: Path, text: str) -> None:
    """Write text without translating line endings."""
    with open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write(text)


def lf(text: str) -> str:
    """Normalise line endings to LF.

    The schema file is stored CRLF and CIEmetaDB.html LF, and the repository has
    no .gitattributes, so line endings vary by contributor and platform. They are
    irrelevant to JSON.parse and to the meaning of the schema, so the embedded
    copy is written LF (matching its host file, keeping the HTML from becoming
    mixed-ending) and comparison ignores them. What is enforced is that the two
    are character-for-character identical apart from newlines.
    """
    return text.replace("\r\n", "\n").replace("\r", "\n")


def locate(html: str) -> re.Match[str]:
    match = BLOCK.search(html)
    if match is None:
        sys.exit(
            f"error: no <script type=\"application/json\" id=\"cieSchemaSource\"> "
            f"block found in {HTML.name}"
        )
    return match


def guard(schema: str) -> None:
    """Refuse to embed content that would terminate the script element early."""
    lowered = schema.lower()
    for token in ("</script", "<!--", "<script"):
        if token in lowered:
            sys.exit(f"error: schema contains {token!r}; unsafe to embed verbatim")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify the embedded copy matches the schema file; do not write",
    )
    args = parser.parse_args()

    for path in (HTML, SCHEMA):
        if not path.exists():
            sys.exit(f"error: {path} not found")

    html, schema = read(HTML), read(SCHEMA)
    guard(schema)
    match = locate(html)
    embedded, wanted = match.group("body"), lf(schema)

    # --check passes on content identity (line endings are not content).
    # Write mode additionally normalises the stored form to LF, so the HTML never
    # ends up with mixed line endings just because the schema file is CRLF.
    if lf(embedded) == wanted and (args.check or embedded == wanted):
        print(f"OK: embedded schema matches {SCHEMA.name} ({len(wanted)} chars)")
        return 0

    if args.check:
        first = next(
            (
                i
                for i, (a, b) in enumerate(zip(lf(embedded).splitlines(), wanted.splitlines()), 1)
                if a != b
            ),
            min(len(lf(embedded).splitlines()), len(wanted.splitlines())) + 1,
        )
        print(
            f"FAIL: the schema embedded in {HTML.name} has drifted from "
            f"{SCHEMA.name}.\n"
            f"      first difference at schema line {first}\n"
            f"      embedded: {len(lf(embedded))} chars\n"
            f"      file:     {len(wanted)} chars\n"
            f"      Edit the schema file (never the embedded copy), then run:\n"
            f"          python {Path(__file__).name}",
            file=sys.stderr,
        )
        return 1

    write(HTML, html[: match.start("body")] + wanted + html[match.end("body") :])
    print(f"updated: re-embedded {SCHEMA.name} into {HTML.name} ({len(wanted)} chars, LF)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
