# CIE Metadatabase — Web Tool

A self-contained, single-file web application for curating **CIEmetaDigitalProduct**
(DataCite v4-based) metadata: import, browse, create, edit, validate and export
metadata records, with full git-like change history and safe concurrent-edit merging.

Modelled on the termdat curation workflow. Runs entirely in the browser from a
local file — **no server, no network access, no external/CDN dependencies.**

**Interface version 1.7.0** (shown in the header).

A **? Help** button in the toolbar opens an in-app summary of the features below,
including the link to the Crossref deposit validator.

## Files

| File | Purpose |
|------|---------|
| `CIEmetaDB.html` | The application. Open it in a browser. Self-contained (logo, styles, code, hashers, validator all embedded). |
| `CIEmetaDB_schema.json` | JSON Schema (draft-07) for the metadatabase envelope — the **data model**. |
| `CIEmetaDB_starter.json` | Starter database built from the 36 records in `../../examples/`. |
| `examples/` | Example Excel workbooks for the **New entry from .xlsx** feature (spectral, numerical, text). |
| `README.md` | This file. |

The metadata payload of each entry conforms to
`../../schema/CIEmetaDigitalProduct_schema_04.json`.

## Running

Double-click `CIEmetaDB.html`, or open it via *File → Open* in Chrome, Edge or
Firefox. On first use you are asked for an **editor identity** (name or initials);
this is stamped onto every change and stored locally in your browser.

**No database is open at startup.** Click **Open DB…** and choose
`CIEmetaDB_starter.json` (or your own database file), or **New DB** to start an
empty one. A background working copy is kept in browser `localStorage`; if the page
was closed with unsaved work, the tool offers to **restore** it on the next launch
(it has no linked file, so its first save behaves like *Save DB As…*).

### Saving

- **Save DB** writes back to the *same file you opened* — no prompt.
- **Save DB As…** always asks for a new location and adopts it as the current file.
- A brand-new database, or a restored working copy (neither has a linked file), asks
  for a location on its first save.
- The status bar (top-right of the toolbar) shows the current file name and a
  **● unsaved** marker when there are changes not yet written to it. Closing or
  reloading the page with unsaved changes triggers a browser warning.

> **Browsers:** in-place saving and parallel-edit detection require a **Chromium**
> browser (Chrome/Edge) via the File System Access API. In **Firefox/Safari**,
> **Save DB** downloads a copy instead and cannot detect parallel changes.

## Browsing the list

The entry list can be sorted by **Title (A–Z)**, **Publication year** or
**Modification date** via the *Sort* dropdown (the ▲/▼ button toggles ascending /
descending; clicking a column header also sorts). Search and the domain/status
filters narrow the list, and a counter shows **how many entries are shown of the
total** (e.g. *Showing 12 of 36 entries (filtered)*).

The **related-publication** filter is a dropdown listing the titles of every
related item (publication) referenced across the database; picking one shows only
the datasets related to that publication. It is keyed by the publication's DOI (so
identical titles group correctly) and combines with the other filters and search.

## Default values

The fields auto-filled on a new entry (publisher, language, creator, resource type,
format, rights, and the data-table interpolation/extrapolation/data-quality methods)
come from an editable **`defaults`** block stored in the database — one value per
field. Manage them with **Edit defaults…** in the toolbar (*Restore built-in
defaults* resets them to the CIE standard values). Publication year is not stored;
new entries always use the current year.

The same dialog also holds the **Crossref deposit-header defaults** — depositor name
and email, registrant, database title, publisher name and the institution fields
(name, acronym, place, department). These are organisation-wide values used by
**Export Crossref XML** (see below); set them once and they apply to every deposit.

In the entry editor, **Revert to defaults** (in the action bar at the top, next to
*Update DOI*) resets **all** default-managed fields of the current entry — creators,
publisher, language, resource type, format, rights and the data-table methods — to
the database defaults. Title, identifier, publication year, subjects, descriptions,
related items, checksums and validations are left untouched. Like other edits it
becomes *unsaved* until you Save the entry.

## Data model (metadatabase envelope)

The database is a single JSON object: metadata about the DB, an editable catalogue
of **domains**, an editable **defaults** block, and an array of **entries**.

DB-level metadata includes a **`title`** and **`description`** (free text) plus
**`lastModifiedDate`** / **`lastModifiedBy`**, which are stamped automatically on
every change. View them — and edit the title and description — with the **ⓘ DB info**
button in the toolbar (next to *Save DB*).

Each entry wraps the DataCite payload with curation metadata:

```
entry
├─ entryId        internal stable id (independent of the DOI; used for merge matching)
├─ rev            revision counter, ++ on every committed change
├─ contentHash    sha256 of the canonical payload (concurrency/merge anchor)
├─ status         draft | review | published
├─ landingPage    URL the DOI resolves to (Crossref <resource>); envelope-level, per entry
├─ domains        [ CIE-division codes ]
├─ audit          createdBy/Date, modifiedBy/Date, modifiedComment
├─ payload        the CIEmetaDigitalProduct (DataCite) record (carries metadataRevision, mirroring rev)
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
- **`metadataRevision`:** the payload carries an optional integer `metadataRevision` that mirrors
  the entry `rev` — the revision of the **metadata file itself**. It is stamped automatically and
  advances **only when the metadata content changes**, never on envelope-only edits (status, domains,
  DOI landing page). It is exported with the `*.csv_metadata.json` file (unlike the envelope `rev`),
  is shown read-only in the *Database entry* section of the Form tab, and is distinct from the DataCite
  `version` field (which versions the described resource). Legacy files without it are treated as
  revision 1.

## Identifiers (DOI)

CIE dataset DOIs follow `10.25039/CIE.DS.$$$$$$$$` where the 8-character suffix is
drawn from alphanumerics **excluding the confusable characters `o O l L 1 I 0`**.

The **Update DOI** action (and the **New entry** dialog) generates a compliant
suffix and checks uniqueness within the database.
For translations, which reuse the number with an appended ISO-639-1 language suffix
(e.g. `10.25039/CIE.DS.mifmy4x4.ES`), enter the DOI manually in the identifier field.

The DOI shown under the entry title is a link to `https://doi.org/<identifier>`
(opens in a new tab).

**DOIs must be unique.** If two entries ever share the same DOI (via a manual edit,
an "import anyway" choice, or a merge), a red **warning banner** appears above the
list naming the duplicated DOI(s) with a *must be fixed* message, the affected rows
get a **duplicate DOI** badge, the editor shows an inline warning, and saving a
colliding DOI asks for confirmation. Clicking a DOI in the banner filters the list
to the offending entries. Note that translated datasets use a distinct
language-suffixed identifier (e.g. `…mifmy4x4.ES`) and therefore do not collide.

### DOI landing page

Every entry carries a **DOI landing page** — the URL the DOI resolves to, i.e. the
Crossref `<resource>`. It is an **envelope-level** field (stored per entry, kept out
of exported DataCite `*.csv_metadata.json` files), shown as a link next to the DOI
in the entry header and editable in the **Database entry** section of the Form tab.
Like other envelope changes (status, domains) it saves without a version bump.

It is required for Crossref deposit: if it is empty when you **Export Crossref XML**,
the tool prompts for the URL and saves it on the entry. Existing landing pages can be
recovered from a registered DOI via the Crossref REST API
(`https://api.crossref.org/works/<doi>` → `resource.primary.URL`) or by following
`https://doi.org/<doi>`.

## Column headers — bulk paste from Excel

Each data-table entry's **Column headers** (Form tab → *Data table info*) can be
filled in one at a time, or in bulk via the paste box shown above the list:

- Prepare **7 rows** — Title, Quantity, Unit, Description, Wavelength first,
  Wavelength last, Wavelength step — with **one column per data column**,
  column-for-column with the CSV. A leading label column (e.g. "Title" in
  column A) is optional and auto-detected and stripped.
- Copy that range in Excel, click the paste box and press **Ctrl+V**. This
  **replaces the whole Column headers list** (with a confirmation dialog if it
  wasn't already empty).
- **Copy current as text** does the reverse — copies the current column
  headers back out in the same row/column layout, for editing in Excel and
  pasting back.
- Each column-header box is labelled **Column N** so a long list (e.g. 100
  columns, as in some CIE colour-fidelity tables) stays legible while
  scrolling.

## New entry from an Excel workbook (.xlsx)

The **+ New entry** dialog can build an entry directly from an Excel workbook.
Under **Related data file** you first pick a **file type** — the default is **No
data file** (blank draft); choosing any data-file type opens the file dialog
automatically, filtered to that type. Choose **Excel .xlsx (7 header rows + data
table)** and pick a **single-worksheet** workbook laid out as:

- **Rows 1–7**, starting at cell **A1** (no leading label column), describe the
  columns — **one worksheet column per data column**, in the order **Title,
  Quantity, Unit, Description, Wavelength first, Wavelength last, Wavelength
  step** (the same 7 fields as the bulk paste above).
- **Row 8 onward** is the data table itself.

On **Create entry** the tool fills the entry's **column headers** and
**`datatableInfo.validations`**, computes the `md5`/`sha256` checksums, and
**generates the header-less CSV** — named from the **File name** field (keep it
concise, e.g. `CIE_xxx.csv`, matching the files in `published/`) — which is
downloaded automatically. The generated CSV is what gets published and what the
stored checksums and sums describe; the workbook itself is only the authoring
source.

Both **numeric** data (spectral/wavelength tables and plain numerical tables) and
**text** data (e.g. multilingual vocabularies) are supported. For non-spectral
columns, put `:unap` in the wavelength rows. `sumOfColumns` is written **only when
every column is numeric**, so text/mixed tables get the sample row and row/column
counts but no misleading sums.

Ready-made examples are in **`examples/`**:
`example_spectral_wavelength.xlsx`, `example_numerical.xlsx` and
`example_text_vocabulary.xlsx`.

> **Browsers:** reading `.xlsx` uses the built-in `DecompressionStream`
> (Chromium/Edge, Firefox, Safari — 2020+). No external library is bundled.

## Validation against the CSV data file

Open an entry → **Validation** tab → pick the associated CSV data file
(header-less, comma-separated, RFC 4180; `NaN` for undefined values). The tool
computes, from the file:

- `md5` and `sha256` checksums,
- number of rows / columns,
- per-column sums,
- a sample row (1-based),
- the wavelength range (first / last / step) from column 1.

On selection it immediately **checks** the computed values against the stored
metadata (matches/mismatches highlighted), including the **file name** against the
`fileName` alternate identifier, plus md5/sha256, row/column counts, column sums,
the stored sample row and the column-1 wavelength range. **Column sums are computed
exactly** using arbitrary-precision integer (`BigInt`) fixed-point arithmetic — the
decimal values are scaled to a common power of ten and summed as integers, so no
IEEE-754 rounding error occurs even when a column mixes very small and very large
numbers (high dynamic range) — and `sumOfColumns` is generated, displayed and compared
at that exact precision (the stored decimal must equal the exact sum rounded to its own
decimal places). Other numeric comparisons (wavelength range) use a relative tolerance
to absorb floating-point formatting; checksums, file name and the sample row are
compared exactly.

You can then:

- **Generate / fill** the `checksums`, `datatableInfo.validations`
  (`sumOfColumns`, `sampleRow`, `numberOfRows`, `numberOfColumns`) and the
  column-1 `wavelength_first/last/step` fields directly into the entry. The sample
  row defaults to the one **already stored** in the metadata if present; otherwise
  it is auto-chosen — row 120, or the **middle row** for files with fewer than 120
  rows — so short files get a valid representative row.
- **Log this validation to the entry** — records the run (date, editor, file name,
  md5, sha256, overall pass/fail and every per-check result) into the entry's
  append-only `validationLog`, stored in the database. Past logged validations are
  listed under **Logged validations** in the same tab.

## Compare an entry with an external metadata file

Open an entry → **Compare with file…** (action bar, next to *Revert to defaults*) →
pick a `*.csv_metadata.json` file. The tool compares that file against the entry's
**stored** payload and lists the differences. It is **read-only** — nothing is
imported, applied or changed.

- **All fields are compared**, and arrays are compared **element by element**, so a
  single changed value is pinpointed to its exact path (e.g.
  `/checksums/1/checksum`) instead of showing a whole array as changed.
- Differences use the same colours as the History diff: **~ changed**
  (database → file), **+ only in file**, **− only in database**. A green banner
  confirms when the file matches the entry exactly.
- If the file's **DOI** or **file name** differs from the entry, a warning banner is
  shown but the comparison still runs (so you can compare deliberately). The file is
  also validated against the schema and any issues are noted. Both payloads are shown
  raw, side by side, for context.
- The bookkeeping `metadataRevision` field is **excluded** from the field comparison
  (exported files do not carry it) but stays visible in the raw side-by-side view.

Use it, for example, to confirm an exported file matches the database, or to see
exactly what changed between a stored entry and an older published file.

## Concurrency — optimistic per-entry merge

Because the database is a shared JSON file, two curators may edit copies in
parallel. The tool guards against lost updates in two ways: automatically **at save
time**, and on demand via **Import / Merge…**. Both use the same per-entry merge
engine.

### Automatic parallel-change check on Save (Chromium)

**Save DB** re-reads the file on disk before overwriting it. It compares the file's
content hash to the state you loaded (the *base hash*): if another curator saved
changes in the meantime, the on-disk version is merged with yours entry by entry —
non-conflicting changes are combined automatically, and genuine both-sides edits
open the conflict-resolution dialog (below) — and the **merged** result is written.
This needs the File System Access API (Chromium); in Firefox/Safari, where Save only
downloads a copy, no re-read is possible and the check is skipped.

### Import / Merge…

**Import / Merge…** reconciles an incoming database against the current one, per
entry (matched by `entryId`):

- **Identical** (`contentHash` equal) → kept as-is.
- **Fast-forward** — one side's current state appears in the other's history →
  the newer side is taken automatically, no prompt.
- **True conflict** — both sides changed since their common ancestor → a
  side-by-side dialog lets you **keep mine**, **take theirs**, or **keep both**
  (the incoming version is added as a new draft copy).

New entries present only in the incoming file are added — unless an incoming entry
has a **DOI that already exists** under a different internal id, in which case it is
raised as a conflict (same dialog) rather than silently duplicated.

### Importing DataCite files — DOI check

When importing individual `*.csv_metadata.json` files, each incoming DOI is checked
against the database (and against others in the same batch). A file whose DOI is
already present raises a **DOI-conflict** dialog per entry, with the existing entry
and the imported file shown side by side, and three choices:

- **Skip** — keep the existing entry, ignore the import.
- **Update existing (new revision)** — apply the imported metadata to the existing
  entry as a new tracked revision (history preserved).
- **Import anyway (duplicate DOI)** — add it as a separate entry (use with care).

Files without a DOI identifier are reported and not imported.

## Domains (CIE activity divisions)

The **Domains…** dialog manages the catalogue of CIE activity domains. Defaults to
the active CIE Divisions (D1, D2, D3, D4, D6, D8); edit freely and assign zero or
more per entry. Entries can be filtered by domain in the list.

## Export

- **Save DB** / **Save DB As…** — the whole metadatabase (with history and audit).
- **Export Metadata…** (toolbar) or **Export Metadata file** (per entry) — emits
  standard `*.csv_metadata.json` files matching the format in `../../examples/`
  (envelope, history and audit stripped), ready for publication.
- **Export Crossref XML…** (per entry) — see below.

### Export to Crossref XML (DOI registration)

The per-entry **Export Crossref XML…** button (entry action bar) generates a
**Crossref 5.3.1 `<doi_batch>`** deposit file for the selected entry, ready to
register the DOI. The file is named `<dataset>(<YYYYMMDDHHMMSS>).xml`.

- The **deposit header** (`depositor` name/email, `registrant`) and the
  **`<database_metadata>`** block (database title, publisher, institution) are filled
  from the Crossref defaults in **Edit defaults…**.
- The entry maps to a `<dataset dataset_type="collection">`: title, description,
  format (MIME), contributors (from `creators` — organisations go in `<surname>`,
  people as `<given_name>`/`<surname>`), the DOI, and the `<resource>` landing page.
- **Related items** are emitted under the Crossref relations `<program>`, mapping each
  DataCite `relationType` to the correct `inter_work_relation` / `intra_work_relation`
  (e.g. `IsPartOf`, `IsReferencedBy`, `IsDerivedFrom` → inter; `IsVersionOf`,
  `IsIdenticalTo` → intra). Relations with **no Crossref equivalent** (`IsDescribedBy`,
  `Describes`, `HasMetadata`, `IsMetadataFor`, `IsPublishedIn`) are **skipped and
  reported** in a message so the file still generates. The mapping table lives in
  `CIEmetaDB.html` (`CROSSREF_RELATION_MAP`) and is easy to adjust.
- If the entry has no **DOI landing page**, you are prompted for it first (and it is
  saved on the entry).

**Validate** a generated file with the Crossref deposit parser:
<https://data.crossref.org/reports/parser.html>. Reference schemas:
[`crossref5.3.1.xsd`](https://data.crossref.org/schemas/crossref5.3.1.xsd),
[`common5.3.1.xsd`](https://data.crossref.org/schemas/common5.3.1.xsd),
[`relations.xsd`](https://data.crossref.org/schemas/relations.xsd).

## Notes

- Fully offline and self-contained; no data leaves the browser.
- Editing sentinel wavelength values (`:unap`, `:null`, …) is best done in the
  **JSON** tab; the form's wavelength inputs are numeric.
- Per METAS policy, if committing this tool: branch `feature/…` off `develop`
  (never commit directly to `main`/`develop`) and use Conventional Commits.
