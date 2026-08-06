# CIE Metadatabase — Web Tool

A self-contained, single-file web application for curating **CIEmetaDigitalProduct**
(DataCite v4-based) metadata: import, browse, create, edit, validate and export
metadata records, with full git-like change history and safe concurrent-edit merging.

Modelled on the termdat curation workflow. Runs entirely in the browser from a
local file — **no server, no network access, no external/CDN dependencies.**

**Interface version 1.10.0** (shown in the header).

A **? Help** button in the toolbar opens an in-app summary of the features below,
including the link to the Crossref deposit validator.

## Files

| File | Purpose |
|------|---------|
| `CIEmetaDB.html` | The application. Open it in a browser. Self-contained (logo, styles, code, hashers, validator all embedded). |
| `CIEmetaDB_schema.json` | JSON Schema (draft-07) for the metadatabase envelope — the **data model**. |
| `CIEmetaDB_starter.json` | Starter database, built from the 36 example metadata files that used to live in `../../examples/` (that folder has since been emptied). |
| `CIEmetaDB_starter_short.json` | Nine-record subset of the starter database for quick testing, including two entries at revision 2 so the history views have something to show. |
| `examples/` | Example Excel workbooks for the **New entry from .xlsx** feature (spectral, numerical, text), plus three `*.csv` data files with their `*_metadata_v2.json` payloads for trying out metadata-file import and CSV validation. |
| `sync_schema.py` | Keeps the schema embedded in `CIEmetaDB.html` identical to the schema file. See below. |
| `checks/` | Every command-line check, with the reports two of them write. `db_integrity.js` (derived fields of a database — hashes and history), `selftest.js` (the tool's own migration and revision-pair code), `validate_published.js` (each CSV against its metadata) and `compare_published.js` (each database entry against its published metadata file). All four read `CIEmetaDB.html` and the databases from this folder; see below. |
| `README.md` | This file. |

The metadata payload of each entry conforms to
`../../schema/CIEmetaDigitalProduct_schema_04.json`.

### The embedded schema

`CIEmetaDB.html` contains a copy of `CIEmetaDigitalProduct_schema_04.json` in a
`<script type="application/json" id="cieSchemaSource">` block near the top of the
file. The application parses that block for both structural validation and the
enum catalogues behind the form dropdowns, so **the schema is written down once**.

It has to be embedded rather than loaded: the tool is designed to run from
`file://`, where `fetch()` is blocked by CORS. Embedding keeps the tool a
self-contained offline file while still having a single definition.

**Never edit the embedded copy.** Edit `../../schema/CIEmetaDigitalProduct_schema_04.json`,
then run:

```
python sync_schema.py            # re-embed the schema file into the HTML
python sync_schema.py --check    # verify they match; exit 1 if they do not
```

Run `--check` in CI on any change to either file. The comparison is
character-for-character (line endings excluded, since the two files differ there),
so it cannot miss a divergence.

This replaces an earlier arrangement in which the schema was restated by hand in
JavaScript inside `CIEmetaDB.html`. The two definitions drifted apart twice — the
tool accepted `wavelength_*` sentinel strings the published schema rejected, and
offered a `titleType` value (`""`) the schema did not allow — and neither was
caught by review.

### Database integrity

`CIEmetaDB_schema.json` is **documentation, not a runtime check.** The tool never
loads it — on opening a database it verifies `dbSchemaName` and `dbSchemaVersion` and
nothing else — so if you want a database checked against it, do so deliberately with
any draft-07 validator. Because nothing consulted it, the schema itself drifted from
the model it describes; the corrections are listed in its `$comment`.

Several fields of a database are **derived** from payload content, and that schema
says so: `contentHash` is the SHA-256 of the canonical payload, `history[].patch`
replays onto `{}` to reproduce any revision, `history[].baseHash` is the hash of the
payload before that patch, and the database `baseHash` fingerprints all entries.
Nothing enforced any of it, and it drifted too:

```
node checks/db_integrity.js --check    # report violations; exit 1 if any
node checks/db_integrity.js --fix      # repair the derived fields in place
```

With no file arguments both modes act on the three databases in this folder;
otherwise pass paths.

Getting this wrong is quiet rather than loud. A stale `contentHash` breaks
`historyContainsHash()`, the ancestry test the merge path uses to tell a
fast-forward from a real conflict — so instead of an error you get every entry
reported as a conflict on every merge. That is what happened: `migrateDb()` used to
backfill the schema-4.1 field `metadataRevision` into legacy payloads without
recomputing `contentHash` or recording it in the history, which left 38 of 39
entries in `CIEmetaDBdataset.json` (and every entry in both starter databases) with
a hash describing the pre-backfill payload. Both the data and `migrateDb()` have
been repaired.

The repair itself lives in **one** function, `repairDerivedFields()` in
`CIEmetaDB.html`. `migrateDb()` calls it on every entry it migrates — and reports
how many fields it had to repair, leaving the database marked unsaved so the repair
reaches the file instead of being redone on every open — and this script lifts the
same function rather than restating it. The tool and the checker therefore cannot
disagree about what a consistent entry looks like.

What it checks, per entry: `history` length and numbering (**E1**), the
`metadataRevision` the entry's kind implies (**E2**), that replaying the history
reproduces the payload (**E3**), `contentHash` (**E4**), the `history[].baseHash` chain
(**E5**), and that the stored `status` matches what `kindOf()` derives (**E6**). Across
the database: that each `revisionOf` resolves to exactly one published parent (**E7**),
and the database `baseHash` (**D1**).

E6 and E7 police the [three-state model](#draft-under-revision--published-workflow):
`status` is derived, not chosen — `draft` when `rev` is 0, `review` when `revisionOf` is
set, `published` otherwise — so a stored status that disagrees with `kindOf()` is stale,
and because `status` feeds the fingerprint behind `baseHash` it also puts that out of
step. E2 and E3 are keyed off `kindOf()` too rather than the stored status, so a status
that has gone stale reports once as E6 instead of cascading into unrelated failures.
Note that an *empty* revision — one whose payload still equals its parent's — is
perfectly legitimate: you start a revision before editing it, and it stays `review`
until published or discarded.

Three limits are deliberate:

- **It repairs derived fields only** — E1, E3, E4, E5, D1. Payload content is never
  rewritten, and neither is a `status` or a `revisionOf`.
- **It refuses to write if a repairable violation would survive the repair**, rather
  than replacing a stale hash with a fresh hash computed over a payload its own
  history contradicts. A visible defect is better than a hidden one. Violations it is
  *not* answerable for do not block the write — refusing to fix 38 stale hashes
  because one entry has an unrelated content problem helps nobody — but they are
  printed, so a repair never quietly hides one.
- **Only E2 is a warning.** A `metadataRevision` that disagrees with the entry's
  revision is a value the tool rewrites on the next edit anyway, and a gate that can
  never go green is a gate everyone learns to ignore. Everything else fails `--check`,
  including E6 and E7, which `--fix` cannot resolve: which record is published and
  which revision belongs to which parent are editorial decisions.

Nothing here is reimplemented either. `canonical()`, `contentHash()`, `applyPatch()`,
`diffPatch()`, `reconstruct()`, `repairDerivedFields()`, `contentDiff()`, `kindOf()`
and `computeDbBaseHash()` are lifted verbatim out of
`CIEmetaDB.html` at run time and
evaluated in a sandbox — the same reasoning as the embedded schema above, applied to
the hashing. Self-tests run before any repair and abort on failure; the sharpest one
recomputes the `contentHash` of `CIE_std_illum_A_1nm`, the one entry whose hash the
tool itself wrote after 4.1, and requires the lifted code to reproduce it. If the
functions are ever renamed the script stops with their names rather than guessing.

### Self-test

```
node checks/selftest.js   # exit 0 when everything passes
```

`checks/db_integrity.js --check` guards the databases in this folder, but two behaviours it
cannot reach are exactly the ones that go wrong silently:

- **`migrateDb()` has to leave a database consistent.** When it did not, the symptom was
  not an error but every entry being reported as a merge conflict, because a stale
  `contentHash` defeats `historyContainsHash()`. The shipped databases are already
  migrated, so nothing here would notice a regression.
- **The revision pair has to leave the published parent untouched** and the history
  chain contiguous. No shipped database contains a pair, so again there is nothing to
  check against.

`selftest.js` builds its fixtures instead — a database reduced to its genuine pre-4.1
state, a legacy draft of the kind the two-state model stored, a revision pair — and
drives the tool's **own** functions over them, lifted from `CIEmetaDB.html` the same way
`db_integrity.js` lifts them, with `DB` supplied and the four UI calls `saveEnvelope()`
makes stubbed out. 78 checks in four groups: the lifted primitives, `migrateDb`,
`db_integrity`'s invariants (including that a legitimate revision pair passes and that
`--fix` is not blocked by something it cannot repair), and the full pair lifecycle —
start, edit, publish, discard, envelope save.

It writes only to a temporary directory, which it removes again, and needs no network.

It earned its place on the first run by finding a defect in `publishEntry()`:
`history[].baseHash` is defined as the hash of the payload the patch applies to, but the
code recorded `entry.contentHash`, which after a draft save already describes the payload
being *published* — so a publish that followed a draft save pointed the patch at its own
result, and a first publish wrote a hash where the schema requires `null`.

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
**Export to Crossref-file (XML)** (see below); set them once and they apply to every deposit.

## Draft, under revision & published workflow

Each entry has one of **three** statuses, and the status is **automatic and read-only** — you
never set it by hand:

| Status | Meaning |
|---|---|
| **draft** | a new record (New entry / Duplicate) that has never been published |
| **under revision** | a revision of a published record, being prepared alongside it |
| **published** | the current published record |

### Revising a published entry

The **payload** of a published entry is **read-only**. To change it, press **Start revision**:
this creates a second entry with status **under revision**, and you edit that one.

**Envelope fields are the exception.** **Domains** and the **DOI landing page** are not part of
the versioned payload — they never mint a revision and never change status — so they stay
editable on a published entry. Change them in place and press **Save domains & landing page**;
the revision number and status are untouched. No revision is needed for them.

The published version **stays in the list, unchanged, for the whole time** — you can open,
compare and export it while the revision is in progress. Each half shows a banner linking to the
other.

The two halves deliberately **share one DOI** while the revision is open, and that is **not**
reported as a duplicate. The DOI cannot be edited on a revision, because changing it would break
the pair. Two *unrelated* entries sharing a DOI are still flagged as before.

**Publishing the revision collapses the pair**: the revision becomes the published entry at the
next revision number, inheriting the complete revision chain, and the previous published row
disappears. The DOI is unique again.

```
[published rev 2]                          Start revision
        |
        v
[published rev 2]  +  [under revision]     both available, same DOI
        |                    |
        |                    | Publish
        v                    v
              [published rev 3]            history: rev 1, 2, 3
```

### Saving and publishing

- **Save draft** / **Save revision** stores your edits **without creating a revision** — the
  revision number is unchanged, no history entry is added, and you are not asked for a comment.
  Envelope fields (domains, DOI landing page) also save this way and never change status or revision.
- **Publish** is the *only* action that mints a revision. It asks for a short **revision text**,
  records **one** history entry holding the change since the previous published revision, bumps
  the revision number and sets status to **published**. History therefore shows
  revision-to-revision changes only, never intermediate saves.
- Exporting anything **not yet published** appends `_draft_TIMESTAMP` after the (pending) revision
  number in the file name — e.g. a new draft → `…_metadata_draft_20260725T143022.json`, a revision
  of published v1 → `…_metadata_v2_draft_20260725T143022.json`.
- A published entry with a revision in progress **cannot be deleted**; discard or publish the
  revision first.
- On a published entry the read-only payload fields are shown **greyed out**. Validation checks
  can still be run, but **Log this validation to the entry** is disabled — it writes to the entry,
  so log against a draft or a revision instead.

The action bar also offers two revert actions:

- **Undo changes** — discards unsaved editor edits and returns to the last *saved* version.
- **Discard revision** — deletes a revision entirely and returns you to the published entry,
  which is unaffected (applied immediately, after a confirmation).
- **Revert to last published** — for a never-published draft, restores the entry to its last
  published revision (applied immediately, after a confirmation, since unpublished edits are not
  versioned and are lost).

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
├─ rev            last published revision number (0 = never published); only Publish changes it
├─ contentHash    sha256 of the canonical payload (concurrency/merge anchor)
├─ status         draft | review | published   (automatic; 'review' displays as "under revision")
├─ revisionOf     on a 'review' entry only: entryId of the published entry it revises
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
- **Revisions are created by Publish only.** A `history` entry is appended when you **Publish** an
  entry; it holds the field-level diff since the previous published revision. Draft saves between
  publishes are not recorded. History is never rewritten.
- **Restore:** the History tab can load any prior revision back into the editor; you then **Publish**
  it to commit a new revision.
- **`metadataRevision`:** the payload carries an optional integer `metadataRevision` that mirrors
  the entry `rev` — the revision of the **metadata file itself**. It is stamped automatically on
  **Publish** (drafts carry the *pending* number). It is exported with the `*.csv_metadata.json` file
  (unlike the envelope `rev`), is shown read-only in the *Database entry* section of the Form tab, and
  is distinct from the DataCite `version` field (which versions the described resource). Legacy files
  without it are treated as revision 1.

## Identifiers (DOI)

CIE dataset DOIs follow `10.25039/CIE.DS.$$$$$$$$` where the 8-character suffix is
drawn from alphanumerics **excluding the confusable characters `o O l L 1 I 0`**.

The **Update DOI** button — beside the **Identifier (DOI)** field in the Form tab — (and the
**New entry** dialog) generates a compliant suffix and checks uniqueness within the database.
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
Like other envelope changes (domains) it saves without a version bump and does not change status.

It is required for Crossref deposit: if it is empty when you **Export to Crossref-file (XML)**,
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

## Batch validation of a published folder (`checks/validate_published.js`)

The Validation tab checks one file at a time, through a file picker. To answer the
same question for a whole corpus — after a restructure of `published/`, or a batch
of metadata revisions — use:

```
node checks/validate_published.js                 validate published/, write both reports
node checks/validate_published.js --dir DIR       validate a different tree, report into it
node checks/validate_published.js --out DIR       write the reports somewhere else
node checks/validate_published.js --quiet         reports only, no per-dataset console detail
```

It expects `published/<title>/` folders each holding one CSV and its metadata JSON,
and pairs each CSV with the **latest** revision beside it —
`<csv>_metadata_v2.json` when present, otherwise `<csv>_metadata.json`. Exit code is
`1` if any dataset fails, `2` on a usage or self-test error.

Output is written to **`VALIDATION_REPORT.md`** (summary table, per-dataset check
lines in the tool's own wording, and what each metadata revision fixed) and
**`VALIDATION_REPORT.json`** (one record per dataset in the same shape as the
entry `validationLog`, plus `folder`, `metadataFile`, `metadataRevision` and
`unchecked`). `--dir` redirects the reports into the tree it is given, so validating
a scratch copy cannot overwrite the report describing `published/`.

Nothing is reimplemented: `md5Bytes`, `sha256Bytes`, `analyzeCsv` and the exact
decimal helpers are lifted verbatim out of `CIEmetaDB.html` at run time, the same
single-source-of-truth approach as `db_integrity.js` and `sync_schema.py`. The one
exception is the comparison itself, which lives inside `renderCsvResult()`
interleaved with DOM construction; `checkCsvAgainstPayload()` restates it and must be
kept in step. Self-tests T1–T3 pin the lifted algorithms against literals and against
node's own `crypto` before any dataset is judged, and abort the run if they fail;
T4 corroborates the CSV bytes against the hashes the tool logged in
`CIEmetaDBdataset.json` and is informational, so a legitimately changed data file is
reported as a failure rather than aborting the run.

Two behaviours are inherited deliberately from the tool. A `validationType` absent
from the metadata produces **no result at all** — neither pass nor warning — so the
report lists those keys separately as *not checked* rather than letting silence read
as success. And warnings (a missing stored checksum, a `columnHeaders` count
mismatch) do not fail a dataset.

## Batch comparison against the database (`checks/compare_published.js`)

The batch counterpart of the Compare dialog below, and a **different question** from
`validate_published.js`: that one checks each CSV against its metadata, reading only
the checksums, `datatableInfo.validations`, the first column header's wavelengths and
the `fileName` identifier. Titles, creators, subjects, descriptions, rights, related
items and the column-header text are compared only here.

```
node checks/compare_published.js                  compare against published/, write both reports
node checks/compare_published.js --dir DIR        compare against a different tree, report into it
node checks/compare_published.js --out DIR        write the reports somewhere else
node checks/compare_published.js --quiet          reports only, no per-dataset console detail
```

Entries are paired with folders by the `fileName` alternate identifier. Each entry's
payload is compared with the latest metadata file in its folder using `deepDiff`
lifted from `CIEmetaDB.html`, with `metadataRevision` excluded exactly as the dialog
excludes it (and reported separately, so its absence is visible). Where a folder
holds both revisions, the **superseded** `_metadata.json` is additionally compared
with `reconstruct(history, 1)` — the entry's own revision-1 payload — which says
whether the file published at the time matches what the database records for that
revision. A difference there concerns a historical file and never affects the current
verdict. Each file is also schema-checked, informationally, as the dialog does; note
the validator **skips unknown properties**, so a misspelled key passes the schema and
shows up only in the field comparison.

Output goes to **`COMPARISON_REPORT.md`** and **`COMPARISON_REPORT.json`**. Exit code
is `1` if any current comparison differs or any pairing fails, `2` on a usage or
self-test error. Only the canonical `published/` tree is presumed complete: under
`--dir` the tree may be a subset, so database entries with no folder there are noted
rather than counted as failures, and — as with `validate_published.js` — the reports
follow the tree given, so a scratch copy cannot overwrite the canonical report.

## Compare an entry with an external metadata file

Open an entry → **Compare with metadata-file (JSON)** (action bar) →
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
- **Export metadata-files…** (toolbar) or **Export to metadata-file (JSON)** (per entry) — emits
  standard `*.csv_metadata.json` files as published on the CIE website — the payload alone,
  with the database envelope, history and audit stripped — ready for publication.
- **Export to Crossref-file (XML)** (per entry) — see below.

### Export to Crossref-file (XML) (DOI registration)

The per-entry **Export to Crossref-file (XML)** button (entry action bar) generates a
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
