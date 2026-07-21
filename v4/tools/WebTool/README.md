# CIE Metadatabase — Web Tool

A self-contained, single-file web application for curating **CIEmetaDigitalProduct**
(DataCite v4-based) metadata: import, browse, create, edit, validate and export
metadata records, with full git-like change history and safe concurrent-edit merging.

Modelled on the termdat curation workflow. Runs entirely in the browser from a
local file — **no server, no network access, no external/CDN dependencies.**

## Files

| File | Purpose |
|------|---------|
| `CIEmetaDB.html` | The application. Open it in a browser. Self-contained (logo, styles, code, hashers, validator all embedded). |
| `CIEmetaDB_schema.json` | JSON Schema (draft-07) for the metadatabase envelope — the **data model**. |
| `CIEmetaDB_starter.json` | Starter database built from the 36 records in `../../examples/`. |
| `README.md` | This file. |

The metadata payload of each entry conforms to
`../../schema/CIEmetaDigitalProduct_schema_04.json`.

## Running

Double-click `CIEmetaDB.html`, or open it via *File → Open* in Chrome, Edge or
Firefox. On first use you are asked for an **editor identity** (name or initials);
this is stamped onto every change and stored locally in your browser.

To load data, click **Open DB…** and choose `CIEmetaDB_starter.json` (or your own
database file). The working copy is auto-saved to browser `localStorage`, so your
session survives a reload; use **Save DB** to write the file back to disk.

> **Browsers:** Chrome/Edge additionally offer the File System Access API, so
> **Save DB** writes straight back to the opened file. Firefox falls back to a
> normal download.

## Data model (metadatabase envelope)

The database is a single JSON object: metadata about the DB, an editable catalogue
of **domains**, and an array of **entries**. Each entry wraps the DataCite payload
with curation metadata:

```
entry
├─ entryId        internal stable id (independent of the DOI; used for merge matching)
├─ rev            revision counter, ++ on every committed change
├─ contentHash    sha256 of the canonical payload (concurrency/merge anchor)
├─ status         draft | review | published
├─ idProposed     true when the DOI was generated locally, not yet assigned by CIE CB
├─ domains        [ CIE-division codes ]
├─ audit          createdBy/Date, modifiedBy/Date, modifiedComment
├─ payload        the CIEmetaDigitalProduct (DataCite) record
└─ history[]      append-only revision log (see below)
```

See `CIEmetaDB_schema.json` for the authoritative definition.

### Change history — hybrid model

Each entry keeps its **current full payload** *plus* an append-only `history` of
field-level **RFC-6902 JSON-Patch** diffs. Every history record carries the
revision number, author, date and change comment.

- **Why hybrid:** entries and edits are small. Storing the full current payload
  makes rendering and export trivial and crash-safe (no patch chain to replay),
  while the compact patch log gives git-like per-field history, lets the tool show
  *exactly what changed*, and can reconstruct any earlier revision by replaying
  patches `1..N` onto the empty document.
- **Restore:** the History tab can load any prior revision back into the editor;
  saving it commits a **new** revision (history is never rewritten).

## Identifiers (DOI)

CIE dataset DOIs follow `10.25039/CIE.DS.$$$$$$$$` where the 8-character suffix is
drawn from alphanumerics **excluding the confusable characters `o O l L 1 I 0`**.
Translations reuse the number with an appended ISO-639-1 language suffix, e.g.
`10.25039/CIE.DS.mifmy4x4.ES`.

The **Generate DOI** action produces a compliant suffix, checks uniqueness within
the database, and marks the entry `proposed`. Real DOIs are assigned by **CIE CB** —
clear the *proposed* flag once the official DOI is in place.

## Validation against the CSV data file

Open an entry → **Validation** tab → pick the associated CSV data file
(header-less, comma-separated, RFC 4180; `NaN` for undefined values). The tool
computes, from the file:

- `md5` and `sha256` checksums,
- number of rows / columns,
- per-column sums,
- a sample row (1-based),
- the wavelength range (first / last / step) from column 1.

You can then either:

- **Check** the computed values against the stored metadata (matches and
  mismatches are highlighted), or
- **Generate / fill** the `checksums`, `datatableInfo.validations`
  (`sumOfColumns`, `sampleRow`, `numberOfRows`, `numberOfColumns`) and the
  column-1 `wavelength_first/last/step` fields directly into the entry.

Numeric comparisons use a relative tolerance to absorb floating-point formatting;
checksums and the sample row are compared exactly.

## Concurrency — optimistic per-entry merge

Because the database is a shared JSON file, two curators may edit copies in
parallel. **Import / Merge…** reconciles an incoming database against the current
one, per entry (matched by `entryId`):

- **Identical** (`contentHash` equal) → kept as-is.
- **Fast-forward** — one side's current state appears in the other's history →
  the newer side is taken automatically, no prompt.
- **True conflict** — both sides changed since their common ancestor → a
  side-by-side dialog lets you **keep mine**, **take theirs**, or **keep both**
  (the incoming version is added as a new draft copy).

New entries present only in the incoming file are added.

## Domains (CIE activity divisions)

The **Domains…** dialog manages the catalogue of CIE activity domains. Defaults to
the active CIE Divisions (D1, D2, D3, D4, D6, D8); edit freely and assign zero or
more per entry. Entries can be filtered by domain in the list.

## Export

- **Save DB** / **Save DB As…** — the whole metadatabase (with history and audit).
- **Export DataCite…** (toolbar) or **Export DataCite file** (per entry) — emits
  standard `*.csv_metadata.json` files matching the format in `../../examples/`
  (envelope, history and audit stripped), ready for publication.

## Notes

- Fully offline and self-contained; no data leaves the browser.
- Editing sentinel wavelength values (`:unap`, `:null`, …) is best done in the
  **JSON** tab; the form's wavelength inputs are numeric.
- Per METAS policy, if committing this tool: branch `feature/…` off `develop`
  (never commit directly to `main`/`develop`) and use Conventional Commits.
