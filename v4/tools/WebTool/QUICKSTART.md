# CIE Metadatabase Web Tool — Quickstart

A short, task-oriented guide to `CIEmetaDB.html` for curators.
For the complete reference see [`README.md`](README.md); the **? Help** button in the
toolbar gives the same summary inside the application.

Applies to **interface version 1.10.0**.

---

## 1. Start in two minutes

1. **Open** `CIEmetaDB.html` — double-click it, or *File → Open* in Chrome, Edge or
   Firefox. Nothing is installed; the tool runs offline from the local file and no
   data ever leaves your browser.
2. **Give your editor identity** (name or initials) when asked. It is stamped on
   every change you make and remembered in this browser.
3. **No database is open at startup.** Click **Open DB…** and pick a database file
   (e.g. `CIEmetaDB_starter.json`), or **New DB** for an empty one.
4. Pick an entry in the list on the left; it opens in the editor on the right.
5. When done, click **Save DB**.

> **Use Chrome or Edge if you can.** Saving back into the same file and the
> automatic parallel-edit check need the File System Access API, which Firefox and
> Safari do not provide — there **Save DB** downloads a copy instead.

## 2. The screen

| Area | What it is |
|---|---|
| **Toolbar** (top) | Database-wide actions: open, save, import/merge, new entry, domains, defaults, ⓘ DB info, ? Help. The current file name and a **● unsaved** marker sit at the right-hand end. |
| **List** (left) | All entries, with search, filters, sorting and status/DOI badges. A counter shows *Showing 12 of 36 entries (filtered)*. |
| **Editor** (right) | The selected entry, in four tabs: **Form**, **JSON**, **Validation**, **History** — plus an action bar above them. |

**Finding entries:** type in the search box, or narrow by **domain**, **status** or
**related publication** (a dropdown of every publication referenced in the database,
keyed by its DOI). Sort by *Title*, *Publication year* or *Modification date* — the
▲/▼ button flips the direction, and clicking a column header sorts too.

## 3. The one concept to understand: three statuses

Every entry is in exactly one of three states, and **the status is automatic — you
never set it by hand**:

| Status | Meaning |
|---|---|
| **draft** | a new record (New entry / Duplicate) that has never been published |
| **under revision** | a revision of a published record, being prepared alongside it |
| **published** | the current published record |

**A published entry's payload is read-only.** To change it you press **Start
revision**, which creates a *second* entry — the revision — and you edit that one.
Both halves stay in the list, each with a banner linking to the other, so the
published version remains available while you work.

The pair deliberately **shares one DOI** while the revision is open; this is *not*
flagged as a duplicate. **Publish** then collapses the pair: the revision becomes the
published entry at the next revision number and the old published row disappears.

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

### Saving is not publishing

| Action | Effect |
|---|---|
| **Save draft** / **Save revision** | Stores your edits. **No** revision, **no** history entry, **no** comment asked. Use it freely while you work. |
| **Publish** | The **only** action that mints a revision. Asks for a short *revision text*, adds **one** history entry covering everything since the previous published revision, bumps the revision number, sets status to **published**. |

So the History tab shows revision-to-revision changes only — never your intermediate
saves. History is never rewritten.

**Two exceptions — envelope fields.** **Domains** and the **DOI landing page** are not
part of the versioned payload, so they stay editable even on a published entry.
Change them and press **Save domains & landing page**: no revision, no status change.

**Undoing:** **Undo changes** returns to the last *saved* version; **Discard revision**
deletes a revision and leaves the published entry untouched; **Revert to last
published** restores a never-published draft to its last published revision.

## 4. Create an entry

Click **+ New entry**. Under **Related data file** choose a file type — the default
**No data file** gives a blank draft; picking a type opens the file dialog for you.

### From an Excel workbook (.xlsx)

Choose **Excel .xlsx (7 header rows + data table)** and pick a **single-worksheet**
workbook laid out as:

- **Rows 1–7, starting at cell A1** (no label column) — one worksheet column per data
  column, in the order **Title, Quantity, Unit, Description, Wavelength first,
  Wavelength last, Wavelength step**.
- **Row 8 onward** — the data table itself.

On **Create entry** the tool fills the column headers and `datatableInfo.validations`,
computes the `md5`/`sha256` checksums, and **generates the header-less CSV** (named
from the *File name* field, e.g. `CIE_xxx.csv`), which downloads automatically. That
generated CSV — not the workbook — is what gets published and what the checksums
describe.

Numeric and text tables both work. For non-spectral columns put `:unap` in the
wavelength rows. `sumOfColumns` is written only when *every* column is numeric, so
text tables get counts and a sample row but no misleading sums.

Ready-made examples: `examples/example_spectral_wavelength.xlsx`,
`example_numerical.xlsx`, `example_text_vocabulary.xlsx`.

## 5. Column headers — paste a block from Excel

In **Form → Data table info**, above the column list, is a paste box.

- Prepare the same **7 rows** as above, one column per data column. A leading label
  column is optional and stripped automatically.
- Copy in Excel, click the box, press **Ctrl+V**. This **replaces the whole list**
  (with a confirmation if it wasn't empty).
- **Copy current as text** does the reverse — for editing in Excel and pasting back.

## 6. DOI and landing page

CIE dataset DOIs are `10.25039/CIE.DS.` + 8 characters, excluding the confusable
`o O l L 1 I 0`. The **Update DOI** button beside the **Identifier (DOI)** field
generates a compliant suffix and checks it is unique in the database. Translations
reuse the number with a language suffix (e.g. `…mifmy4x4.ES`) — type those manually.

If two *unrelated* entries share a DOI, a red banner names it, the rows get a
**duplicate DOI** badge, and clicking the DOI in the banner filters the list to them.
(A published/revision pair sharing a DOI is normal and not flagged.)

**DOI landing page** — the URL the DOI resolves to. Edit it in the **Database entry**
section of the Form tab; it also shows as a link next to the DOI. It is required for
Crossref deposit, and you will be prompted for it if it is empty when you export.

## 7. Check an entry against its CSV

Open the entry → **Validation** tab → pick the CSV (header-less, comma-separated,
`NaN` for undefined values). The tool computes the checksums, row/column counts,
per-column sums, a sample row and the column-1 wavelength range, then **immediately
compares** them with the stored metadata and highlights matches and mismatches — the
file name is checked against the `fileName` alternate identifier too.

Column sums are computed **exactly** (arbitrary-precision fixed-point), so no
rounding error creeps in even with a wide dynamic range.

Then you can:

- **Generate / fill** the checksums, validations and wavelength fields into the entry.
- **Log this validation to the entry** — records the whole run in the entry's
  permanent `validationLog`.

> On a **published** entry the checks still run, but logging is disabled (it would
> write to the entry). Log against a draft or a revision instead.

## 8. Compare with an external metadata file

**Compare with metadata-file (JSON)** in the action bar compares a
`*.csv_metadata.json` file against the entry's stored payload, element by element, and
pinpoints each difference (e.g. `/checksums/1/checksum`). It is **read-only** —
nothing is imported or changed. Colours match the History diff: **~ changed**,
**+ only in file**, **− only in database**.

Useful to confirm an exported file matches the database.

## 9. Export

| Action | Output |
|---|---|
| **Save DB** / **Save DB As…** | The whole metadatabase, with history and audit. |
| **Export metadata-files…** (toolbar) or **Export to metadata-file (JSON)** (per entry) | Standard `*.csv_metadata.json` as published on the CIE website — the payload alone, envelope/history/audit stripped. |
| **Export to Crossref-file (XML)** (per entry) | A Crossref 5.3.1 `<doi_batch>` deposit file for registering the DOI, named `<dataset>(<YYYYMMDDHHMMSS>).xml`. |

Anything **not yet published** gets `_draft_<TIMESTAMP>` in the file name, so drafts
are never mistaken for published records.

**Crossref deposits:** the header (depositor, registrant) and database-level block come
from **Edit defaults…** — set them once for your organisation. Related items are mapped
to the correct Crossref relation; the few DataCite relations with no Crossref
equivalent are skipped and reported, so the file still generates. Validate the result
at <https://data.crossref.org/reports/parser.html>.

## 10. Working with someone else on the same file

- **On Save (Chrome/Edge):** the tool re-reads the file first. If a colleague saved in
  the meantime, the two versions are merged entry by entry; non-conflicting changes
  combine silently and genuine both-sides edits open a conflict dialog. The merged
  result is what gets written.
- **Import / Merge…** does the same on demand against another database file, offering
  **keep mine**, **take theirs** or **keep both** for each true conflict.
- **Importing `*.csv_metadata.json` files:** a DOI that already exists prompts you to
  **Skip**, **Update existing (new revision)** or **Import anyway (duplicate DOI)**.

## 11. Database-wide settings

| Button | Purpose |
|---|---|
| **ⓘ DB info** | Database title and description (editable), plus entry count, id and last-modified stamp. |
| **Edit defaults…** | Values auto-filled into new entries (publisher, language, creator, resource type, format, rights, interpolation/extrapolation/data quality) **and** the Crossref deposit-header defaults. |
| **Domains…** | The catalogue of CIE activity domains (D1–D8 by default) you can assign per entry. |

## 12. Good to know

- **Everything is local.** Fully offline, no CDN, no telemetry. The only network use is
  optional: opening a DOI link or the Crossref validator.
- A background working copy is kept in the browser. If the page closed with unsaved
  work, the tool offers to **restore** it — its first save asks for a location.
- **● unsaved** in the toolbar means changes are not yet written to the file. Closing
  the page then warns you.
- Sentinel wavelength values (`:unap`, `:null`, …) are easiest to set in the **JSON**
  tab, since the Form's wavelength inputs are numeric.
- A published entry that has a revision in progress **cannot be deleted** — publish or
  discard the revision first.
