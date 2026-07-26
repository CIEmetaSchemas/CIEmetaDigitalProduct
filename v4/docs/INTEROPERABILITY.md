# CIEmetaDigitalProduct - Interoperability recommendations

Advisory document, based on schema version 4.1.

This document accompanies [README.md](README.md), which remains the normative description
of the metadata model. Nothing here changes the current model; it collects recommendations
for raising the machine-interpretability of CIE data products, and records the defects
found while assessing the present state.

Obligation codes are used as in README.md: **M** mandatory, **R** recommended, **O** optional.

### Corpus analysed

All figures in this document are measured over the **39 data tables currently published on
the CIE website**, as held in the payloads of the WebTool metadatabase
[`../tools/WebTool/CIEmetaDBdataset.json`](../tools/WebTool/CIEmetaDBdataset.json)
(`dbSchemaName: CIEmetaDB`, version 1; structure described in
[`../tools/WebTool/CIEmetaDB_schema.json`](../tools/WebTool/CIEmetaDB_schema.json)). All 39
entries have `status: "published"`, each carries a distinct DOI under the `10.25039/CIE.DS.`
prefix, and each `payload` is a CIEmetaDigitalProduct v4 record. Between them the 39 records
describe **402 data columns**. Of the 39 entries, 22 are at revision 2 and 17 at revision 1.

The database is the authoritative corpus. Note that the `../examples/` folder is a **stale
subset** — 36 records rather than 39 (`CIE_srf_CQS_5nm`, `CIE_srf_FCI_5nm` and
`CIE_srf_PS_5nm` are missing) and several of its copies predate corrections that have since
been made in the database. Analyses run against `../examples/` therefore overstate some
defect counts; see section 10.

---

## 1. Scope and summary

CIE data tables are published as headerless CSV files with a JSON metadata sidecar. Every
table has a DOI, a licence, checksums and a documented interpolation method. In FAIR terms
the data is well **findable**, **accessible** and **reusable**. What is weak is
**interoperability**: the two fields that carry the physical meaning of each column,
`quantity` and `unit`, are free-text strings with no controlled vocabulary and no
identifier. A program reading `CIE_cc_1931_2deg.csv_metadata.json` cannot determine that
`"nm"` means nanometre, that `"dimensionless"` means the SI unit *one*, or that
`"chromaticity coordinates"` is term 17-23-053 of CIE S 017:2020. It can only match
strings and hope.

The encouraging finding is how small the problem is. Across all 39 published datasets and
their 402 columns there are exactly **three distinct unit strings** and **thirteen distinct
quantity strings**. A complete, hand-curated mapping to permanent identifiers is a table of
**sixteen rows** — see the appendix in section 13. Fully annotating the entire published
CIE corpus is a day of editorial work, not a project.

| ID | Recommendation | Obligation proposed | Breaks existing records? | Effort |
|---|---|---|---|---|
| A | Unit PIDs from the BIPM SI Reference Point | R | No | Low |
| B | Quantity PIDs from the SI quantities KB and the CIE e-ILV | R | No | Low |
| C | Explicit `symbol` field, separate from `title` | O | No | Low |
| D | Optional JSON-LD `@context` at record root | O | No | Medium |
| E | DCAT-AP / schema.org crosswalk, derived CSVW sidecar | O | No | Medium |
| F | PIDs for creators, publisher, subjects and licence | R | No | Low |
| G | Further development of the CIE e-ILV itself | — | No | CIE-level, long term |

All of A–F are **strictly additive**. The v4 schema does not set `additionalProperties:
false` anywhere, so every field proposed below can be added to a record without
invalidating it, and every existing record remains valid unchanged. `schemaName` stays
`CIEmetaDigitalProduct` and `schemaVersion` stays `4`.

This was checked, not assumed: the published `CIE_cc_1931_2deg` payload with `unitPID`,
`quantityPID` and `symbol` added to every column validates against
`CIEmetaDigitalProduct_schema_04.json` under a draft-07 validator.

Section 10 lists defects that already exist in v4 and should be repaired regardless of
whether any recommendation here is adopted.

---

## 2. Current state

### 2.1 The column model

Column semantics live at
`$.datatableInfo.columnHeaders[*]`, defined in
[`../schema/CIEmetaDigitalProduct_schema_04.json`](../schema/CIEmetaDigitalProduct_schema_04.json):

```json
"columnHeaders": {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "title":            { "type": "string" },
            "unit":             { "type": "string" },
            "quantity":         { "type": "string" },
            "description":      { "type": "string" },
            "wavelength_first": { "$ref": "#/definitions/wavelengthField" },
            "wavelength_last":  { "$ref": "#/definitions/wavelengthField" },
            "wavelength_step":  { "$ref": "#/definitions/wavelengthField" }
        }
    },
    "uniqueItems": true
}
```

`unit` and `quantity` are bare `{"type": "string"}` — no `enum`, no `pattern`, no
`format: uri`, and no companion identifier field.

This matters more for CIE than for most publishers, because **the CSV files carry no header
row** (README.md, property 14: "CSV according RFC4180 … without header line"). The sidecar
is therefore the *only* carrier of column semantics. If it is not machine-readable, nothing
about the data is.

### 2.2 The vocabulary actually in use

Measured over the 402 column headers of the 39 published datasets.

**Units — three values, and nothing else. Every one of the 402 columns carries one of
them; there are no empty, absent or sentinel unit values anywhere in the corpus:**

| value | columns |
|---|---|
| `"dimensionless"` | 363 |
| `"nm"` | 38 |
| `"lm / W"` | 1 |

**Quantities — thirteen values:**

| value | columns |
|---|---|
| `"spectral radiance factor"` | 232 |
| `"spectral distribution"` | 86 |
| `"wavelength"` | 36 |
| `"chromaticity coordinates"` | 9 |
| `"spectral tristimulus values"` | 6 |
| `"spectral sensitivity"` | 6 |
| `"colour-matching function"` | 6 |
| `"action spectra"` | 5 |
| `"spectral luminous efficiency"` | 4 |
| `"luminous efficiency"` | 2 |
| `"  "` (whitespace — defect 1) | 2 |
| `"adaptation coefficient"` | 1 |
| `"maximum luminous efficacy"` | 1 |

A further 6 columns omit the `quantity` key entirely (defect 2). The unit column is
therefore in better shape than the quantity column: `unit` is complete and consistent,
`quantity` has 8 defective columns out of 402.

Roughly ninety percent of all columns in the corpus are a dimensionless spectral value
indexed by a wavelength in nanometres. `CIE_max_sle_mesopic` is the only table that is not
wavelength-indexed and the only one carrying a real physical unit.

### 2.3 What a consumer can and cannot do today

Can: resolve the dataset DOI, verify the checksum, read the licence, learn the wavelength
range and the interpolation method.

Cannot, without human knowledge of CIE conventions: convert units, check dimensional
consistency against another dataset, join a CIE table to a non-CIE table on quantity,
render a correct axis label, or answer "which CIE datasets contain a luminance?".

---

## 3. Recommendation A — unit PIDs from the SI Reference Point

The BIPM [SI Digital Framework](https://si-digital-framework.org/SI) publishes permanent
digital identifiers for SI units, prefixes, quantities and defining constants. It is the
authoritative source, maintained by the body that defines the SI, and it is directly
resolvable.

**Proposal:** add an optional `unitPID` next to `unit`. `unit` is unchanged and keeps its
role as the human-readable display string; `unitPID` carries the identifier.

| ID | Property | Obligation |
|---|---|---|
| CIE 2.4.8 | unitPID | R |

Complete mapping for the current corpus:

| `unit` | `unitPID` |
|---|---|
| `nm` | `https://si-digital-framework.org/SI/units/nanometre` |
| `dimensionless` | `https://si-digital-framework.org/SI/units/one` |
| `lm / W` | `https://si-digital-framework.org/SI/units/lumen.watt-1` |

The `dimensionless` row alone covers about ninety percent of all columns in the corpus, and
is the single highest-value change in this document.

### 3.1 These identifiers are genuinely machine-resolvable

They are not opaque strings. Requesting `Accept: application/json` on a unit PID returns a
parsed decomposition. For `nanometre`:

```json
{
  "status": 0,
  "resultsCombinedUnitList": [
    {
      "prefixSymbol": "n",
      "prefixUri": "https://si-digital-framework.org/SI/prefixes#n",
      "prefixName": "nano",
      "prefixUrl": "/SI/prefixes/nano",
      "unitSymbol": "m",
      "unitName": "metre",
      "unitUri": "https://si-digital-framework.org/SI/units#m",
      "unitUrl": "/SI/units/metre",
      "scaling": "1e-09",
      "relation": "1 nm = 10<sup>-9</sup> m",
      "exponent": 1
    }
  ]
}
```

A consumer gets the scaling factor to the coherent SI unit (`1e-09`) without parsing any
symbol string. For a base or derived unit the response instead carries the definition, the
defining constant, the CGPM resolution and its DOI, and the quantity code — for `metre`,
`"unitQuantities": [{"code": "LENG", "label": "length"}]`.

### 3.2 The compound-unit grammar

Compound and prefixed unit PIDs are formed as dot-separated full unit names with integer
exponents:

```
lumen.watt-1                 lm/W
candela.metre-2              cd/m²
watt.metre-2.nanometre-1     W·m⁻²·nm⁻¹     (spectral irradiance)
```

All of these resolve. The parser at
[`/SI/unitExpr`](https://si-digital-framework.org/SI/unitExpr) accepts the symbol form
(`cd.m-2`, `mm2`, `ns-2`) and returns the corresponding PID, so a curator does not have to
construct the name form by hand. This means the recommendation extends cleanly to
quantities CIE does not yet publish tables for.

### 3.3 A note on the display string

`"lm / W"`, with spaces around the solidus, is not a conventional rendering. If the display
strings are ever normalised, `lm/W` is preferable. This is cosmetic and is *not* a reason to
change published records on its own — `unitPID` makes the machine reading correct either way.

---

## 4. Recommendation B — quantity PIDs

Quantities need two sources, because no single vocabulary covers the CIE range.

**Tier 1 — BIPM.** The SI quantities knowledge base holds 149 quantities and does cover the
metrological ones, including several CIE will need as the corpus grows:

| code | label | coherent unit |
|---|---|---|
| `LENG` | length | m |
| `RADF` | radiance factor | (dimensionless) |
| `LUMA` | luminance | cd·m⁻² |
| `LUFA` | luminance factor | (dimensionless) |
| `ILLU` | illuminance | lx |
| `LUFL` | luminous flux | lm |
| `LUIN` | luminous intensity | cd |
| `RADI` | radiance | W·sr⁻¹·m⁻² |
| `IRRA` | irradiance | W·m⁻² |
| `EXIT` | radiant exitance | W·m⁻² |
| `OPRE` | reflectance | (dimensionless) |
| `OPRF` | reflectance factor | (dimensionless) |
| `OPTR` | transmittance | (dimensionless) |
| `BRDF` | bidirectional reflectance distribution function | sr⁻¹ |
| `CCTE` | correlated colour temperature | K |
| `TEMT` | thermodynamic temperature | K |

PID pattern: `https://si-digital-framework.org/quantities/<code>`.

**Tier 2 — CIE e-ILV.** The colorimetric quantities are *not* in the BIPM knowledge base,
and should not be expected to be: they are CIE's own concepts, defined in CIE S 017:2020.
The e-ILV publishes them at `https://cie.co.at/eilvterm/<term-number>`.

**Proposal:** add an optional `quantityPID`. Where both tiers apply, prefer the e-ILV term
for the concept and let the e-ILV entry carry the link to BIPM (see recommendation G4).

| ID | Property | Obligation |
|---|---|---|
| CIE 2.4.9 | quantityPID | R |

Complete mapping for the current corpus. All e-ILV URLs below were checked and resolve.

| `quantity` | e-ILV term | `quantityPID` | BIPM equivalent |
|---|---|---|---|
| `wavelength` | 17-21-025 wavelength | `https://cie.co.at/eilvterm/17-21-025` | `.../quantities/LENG` |
| `spectral distribution` | 17-21-029 spectral distribution | `https://cie.co.at/eilvterm/17-21-029` | — |
| `spectral radiance factor` | 17-24-075 radiance factor | `https://cie.co.at/eilvterm/17-24-075` | `.../quantities/RADF` |
| `chromaticity coordinates` | 17-23-053 chromaticity coordinates | `https://cie.co.at/eilvterm/17-23-053` | — |
| `colour-matching function` | 17-23-039 colour-matching functions | `https://cie.co.at/eilvterm/17-23-039` | — |
| `spectral tristimulus values` | 17-23-038 tristimulus values | `https://cie.co.at/eilvterm/17-23-038` | — |
| `spectral sensitivity` | 17-25-063 spectral responsivity | `https://cie.co.at/eilvterm/17-25-063` | — |
| `action spectra` | 17-26-027 action spectrum | `https://cie.co.at/eilvterm/17-26-027` | — |
| `spectral luminous efficiency` | 17-21-035 | `https://cie.co.at/eilvterm/17-21-035` | — |
| `luminous efficiency` | 17-21-094 | `https://cie.co.at/eilvterm/17-21-094` | — |
| `maximum luminous efficacy` | 17-21-092 | `https://cie.co.at/eilvterm/17-21-092` | — |
| `adaptation coefficient` | **no exact term exists** | — | — |

### 4.1 Points requiring an editorial decision

**Two term choices are context-dependent and should be made per dataset, not globally:**

- `chromaticity coordinates` — for a spectrum-locus table such as `CIE_cc_1931_2deg`, the
  more precise term is **17-23-055 spectral chromaticity coordinates**
  (`https://cie.co.at/eilvterm/17-23-055`).
- `colour-matching function` — for the CIE standard observers specifically, the more
  precise term is **17-23-047 CIE colour-matching functions**
  (`https://cie.co.at/eilvterm/17-23-047`).
- `spectral radiance factor` — where the tabulated quantity is the total including any
  luminescent component, **17-24-076 total spectral radiance factor** applies.

**`luminous efficiency` and `spectral luminous efficiency` are used inconsistently.**
`CIE_cfb_sle_*` uses the former and `CIE_sle_*` the latter, for columns of the same kind.
The e-ILV distinguishes them (17-21-094 vs 17-21-035) and the e-ILV wording should govern.

**`adaptation coefficient` has no e-ILV term.** It is the parameter *m* of the CIE
mesopic photometry system (CIE 191:2010), used in `CIE_max_sle_mesopic`. Rather than
invent an identifier, leave `quantityPID` absent and raise the omission with the CIE
terminology committee — see recommendation G8.

---

## 5. Recommendation C — an explicit `symbol` field

Today the symbol is embedded in `title`, and the transliteration is inconsistent. The
repository contains `x_bar(lambda)`, `V'(lambda)`, `s_mel(lambda)`, `K_m,mes;m`.
`CIE_srf_PS_5nm` also carried `β15(λ)`, the only non-ASCII column title in the corpus; it
is now transliterated as `beta15(lambda)` (defect 4, since fixed).

`title` has to stay as it is: it is the label a user sees against a CSV column, and ASCII is
the safe choice for that. But a consumer that wants to render a correct axis label should
not have to reverse-engineer `x_bar(lambda)` into *x̄*(λ).

| ID | Property | Obligation |
|---|---|---|
| CIE 2.4.10 | symbol | O |

```json
{
  "title":  "x_bar(lambda)",
  "symbol": "x̄(λ)",
  "quantity": "colour-matching function",
  "quantityPID": "https://cie.co.at/eilvterm/17-23-047"
}
```

Optionally a `symbolLatex` (`\bar{x}(\lambda)`) for typesetting consumers. Note that the
e-ILV already publishes the authoritative symbol for each term — `λ` for 17-21-025 — so
this field can be populated from the same source as `quantityPID`.

---

## 6. Recommendation D — an optional JSON-LD context

With A, B and F in place, the record contains identifiers but is still plain JSON. A single
optional key turns it into RDF without touching the body.

**Proposal:** CIE publishes a context document at a stable URL, for example
`https://cie.co.at/context/CIEmetaDigitalProduct/4.jsonld`, and records may carry
`"@context"` at root. Records without it are unchanged and remain valid.

The context maps the existing key names, so the JSON body a curator edits is identical:

```json
{
  "@context": {
    "@vocab":  "https://cie.co.at/ns/ciemeta#",
    "dct":     "http://purl.org/dc/terms/",
    "schema":  "https://schema.org/",
    "unitPID":     { "@id": "https://cie.co.at/ns/ciemeta#unit",     "@type": "@id" },
    "quantityPID": { "@id": "https://cie.co.at/ns/ciemeta#quantity", "@type": "@id" }
  }
}
```

The `"@type": "@id"` declaration is what makes `unitPID` a link rather than a string, so a
triple store resolves it to the BIPM resource rather than storing the URL as text.

This is the point at which a query like "every CIE table whose columns are luminances"
becomes answerable mechanically, against the BIPM SPARQL endpoint and a CIE endpoint
together.

---

## 7. Recommendation E — DCAT-AP, schema.org and CSVW

### 7.1 Envelope crosswalk

The record is already DataCite-derived, so the mapping to the two vocabularies that data
portals and search engines consume is mostly mechanical:

| CIEmetaDigitalProduct | schema.org | DCAT / Dublin Core |
|---|---|---|
| `identifier` | `schema:identifier` | `dct:identifier` |
| `titles[].title` | `schema:name` | `dct:title` |
| `creators[]` | `schema:creator` | `dct:creator` |
| `publisher` | `schema:publisher` | `dct:publisher` |
| `publicationYear` | `schema:datePublished` | `dct:issued` |
| `descriptions[]` (abstract) | `schema:description` | `dct:description` |
| `subjects[]` | `schema:keyword` | `dcat:keyword` / `dct:subject` |
| `language` | `schema:inLanguage` | `dct:language` |
| `rightsList[].rightsURI` | `schema:license` | `dct:license` |
| `formats[]` | `schema:encodingFormat` | `dcat:mediaType` |
| `sizes[]` | `schema:contentSize` | `dcat:byteSize` |
| `checksums[]` | — | `spdx:checksum` |
| `relatedItems[]` | `schema:isPartOf` etc. | `dct:isPartOf` etc. |

Publishing this alongside each DOI landing page makes CIE datasets harvestable by
institutional and European data portals with no change to the native format.

### 7.2 CSVW for the tabular part

[W3C CSV on the Web](https://www.w3.org/TR/tabular-data-primer/) is the standard sidecar
format for CSV, and `datatableInfo.columnHeaders[]` maps onto it almost directly:

| CIE | CSVW |
|---|---|
| `columnHeaders[]` | `tableSchema.columns[]` |
| `title` | `csvw:name` and `csvw:titles` |
| `description` | `dc:description` |
| `unitPID`, `quantityPID` | custom properties via the CSVW `@context` |

**Recommendation: generate a CSVW sidecar from the CIE metadata rather than restructuring
the native model.** The CIE format stays authoritative and unchanged; a small generator
emits `<name>.csv-metadata.json` for consumers using generic CSVW tooling. Because the CSV
files have no header row, the generated dialect must state this explicitly:

```json
{
  "@context": "http://www.w3.org/ns/csvw",
  "url": "CIE_cc_1931_2deg.csv",
  "dialect": { "header": false },
  "tableSchema": {
    "columns": [
      { "name": "lambda",    "datatype": "decimal", "titles": "lambda" },
      { "name": "x_lambda",  "datatype": "decimal", "titles": "x(lambda)" }
    ]
  }
}
```

Note also that README.md specifies `"Nan"` for undefined values. CSVW expresses this with
`"null": "NaN"` on the column, which is worth carrying through — and the spelling should be
normalised to `NaN` while doing so.

---

## 8. Recommendation F — PIDs for agents, subjects and licence

Three identifier hooks already exist in the schema and are unused in all 39 records.

**Creators and publisher.** None of the 39 records carries `nameIdentifiers`. The CIE has a
ROR identifier, verified:

```json
"creators": [{
  "name": "International Commission on Illumination (CIE)",
  "nameType": "Organizational",
  "nameIdentifiers": [{
    "nameIdentifier": "https://ror.org/05w2j5k62",
    "nameIdentifierScheme": "ROR",
    "schemeURI": "https://ror.org"
  }]
}]
```

Where an individual is credited, `nameIdentifierScheme: "ORCID"` with the full
`https://orcid.org/…` form. `funderIdentifierType` previously enumerated
`["ISNI", "GRID", "Crossref Funder ID", "Other"]`, offering the superseded GRID but not ROR;
**`"ROR"` has since been added** to the schema — see the version history in [README.md](README.md).

**Subjects.** `subjects[]` supports `subjectScheme`, `schemeURI`, `valueURI` and
`classificationCode`. Across the 39 records there are **113 subject entries drawing on 14
distinct strings, and `subject` is the only sub-key ever used** — no scheme is declared
anywhere:

| subject | uses | | subject | uses |
|---|---|---|---|---|
| `Photometry` | 18 | | `Influence of the colour of the light` | 5 |
| `Objective photometry` | 18 | | `Artificial daylight` | 4 |
| `Units. Constants` | 18 | | `Perception of Colour` | 2 |
| `Colorimetry` | 12 | | `Colour of Objects` | 2 |
| `Colour of objects` | 10 | | `Colour Vision` | 2 |
| `Colour vision` | 10 | | `Lighting with respect to object illuminated` | 1 |
| `Perception of colour` | 10 | | `Evaluation of light sources` | 1 |

The list reads as entries from a classification rather than free keywords, and the
right-hand column shows the cost of not saying so: three of the fourteen are
capitalisation variants of another three (defect 5). Fourteen values is small enough to
enumerate. Declaring the scheme costs one field per subject and makes the values
resolvable; if the strings are ad-hoc, CIE should adopt a scheme — the e-ILV itself would
be a natural source once recommendation G is in place.

**Licence.** `rightsIdentifier` is `"CC BY-SA 4.0"`. The SPDX short identifier is
`CC-BY-SA-4.0` (hyphenated), which is what automated licence tooling matches on:

```json
{
  "rights": "Creative Commons Attribution-ShareAlike 4.0 International",
  "rightsURI": "https://creativecommons.org/licenses/by-sa/4.0/",
  "rightsIdentifier": "CC-BY-SA-4.0",
  "rightsIdentifierScheme": "SPDX",
  "schemeURI": "https://spdx.org/licenses/"
}
```

---

## 9. Recommendation G — further development of the CIE e-ILV

Recommendations A–F treat the e-ILV as an external vocabulary to cite. This section is
addressed to CIE itself, because the extent to which the e-ILV can be cited is currently
limited by how it is published, not by its content.

### 9.1 Measured current state

The e-ILV contains 1 347 terms with authoritative definitions, symbols, notes and
cross-references. It is the reference vocabulary for light and lighting. As a *digital*
resource it is a website and nothing more:

| Property | Status |
|---|---|
| Content negotiation | **None.** `Accept: text/turtle`, `application/ld+json`, `application/rdf+xml` and `application/json` on a term URL all return `200 text/html`. |
| Machine-readable serialisation | None. No RDF, no SKOS, no embedded JSON-LD `<script>`. |
| API | None found. |
| Bulk download | None found. |
| Sitemap | None (`/sitemap.xml` returns 404). |
| Structured fields | None. Symbol, definition, all notes, unit statement, edition history and IEC cross-reference are a single HTML blob (`field--name-body`). |
| Page metadata | Only `rel="canonical"` and a `description` meta tag. |
| Languages | `hreflang` is `en` only, although CIE S 017 is bilingual E/F. |

Everything a machine would want is present — but as prose. Term 17-21-025 states the symbol
`λ`, and its notes say "The wavelength is expressed in metres (m) or decimal multiples and
submultiples of metre" and "In optical radiation the units nanometre (nm) and micrometre
(μm) are generally used". A human reads the unit; a program cannot.

The same applies to the two kinds of cross-reference the e-ILV already maintains:

- edition history — 17-21-020 notes "previously numbered 17-684 in the 2011 edition";
- IEC alignment — 17-21-025 notes "This entry was numbered 845-01-14 in IEC 60050-845:1987".

Both are exactly the mappings an automated consumer needs, and both are unreachable.

### 9.2 Recommendations, in priority order

**G1 — Content negotiation and a SKOS serialisation.** Highest value for the least
disruption. Keep the existing URLs and HTML pages exactly as they are; add
`Accept`-header handling so that `text/turtle` and `application/ld+json` return the same
term as `skos:Concept` with `skos:prefLabel`, `skos:definition`, `skos:notation` (the term
number), `skos:broader`/`skos:related`, and `skos:scopeNote` for the notes. As an interim
step costing almost nothing, embed a JSON-LD `<script>` block in the existing page.

**G2 — Promote the term number to a genuine PID.** `https://cie.co.at/eilvterm/17-23-053`
is a CMS path. It has `rel="canonical"` and it works, but it is not insulated from a future
site migration, and CIE is asking the world to cite it in permanent records. Put an
indirection layer in front of it — a DOI per term, or a `w3id.org`/PURL prefix such as
`https://w3id.org/cie/ilv/17-23-053` — with a documented persistence policy. CIE already
operates a DOI prefix (`10.25039`) for publications and datasets, so the infrastructure and
the institutional commitment exist.

**G3 — Structure the entry.** Split the single body field into typed fields: term number,
preferred term, admitted/deprecated synonyms, symbol, unit, definition, notes (numbered
individually), source publication, edition history, and status. This is a prerequisite for
G1 producing anything better than a definition string, and it improves the human site too.

**G4 — Cross-link with the SI Reference Point.** This is the recommendation with the widest
benefit, and it is bidirectional:

- *e-ILV → BIPM.* Each quantity term carries the PID of its coherent SI unit
  (`https://si-digital-framework.org/SI/units/…`) and, where BIPM has the quantity, a
  `skos:exactMatch` to `https://si-digital-framework.org/quantities/<code>`. Section 4
  above shows this is a short list: `RADF`, `LUMA`, `LUFA`, `ILLU`, `LUFL`, `LUIN`, `RADI`,
  `IRRA`, `OPRE`, `OPRF`, `OPTR`, `BRDF`, `CCTE` and a handful more already exist and
  correspond to e-ILV terms.
- *BIPM → e-ILV.* The BIPM quantities knowledge base has 149 entries and contains none of
  the colorimetric quantities. CIE is the authority for those. A reciprocal
  `skos:exactMatch` from the BIPM side, or at minimum a documented reference to the e-ILV
  as the source for colorimetry, would let a single SPARQL query span both.

CIE and BIPM already maintain a formal liaison — it is listed on the CIE website. This is a
concrete, bounded deliverable for it: a few dozen mappings, agreed once, that would make
the two authoritative vocabularies for light traversable as one graph. The unit side is the
easy half and could be done first.

**G5 — Bulk download and a query endpoint.** BIPM publishes its knowledge bases as
downloadable Turtle files with SHA-256 checksums and documents a SPARQL endpoint for direct
machine interrogation. The e-ILV should do the same: a versioned
`ilv.ttl` with a checksum, and ideally a SPARQL endpoint. This is what allows offline tools
— such as the CIE metadata WebTool, which by design runs entirely from `file://` with no
network access — to validate against the vocabulary without calling out.

**G6 — Machine-readable versioning and external mappings.** Lift the two cross-reference
kinds out of prose into properties: `skos:changeNote` or `dct:replaces` for the 2011→2020
renumbering (17-684 → 17-21-020), and `skos:exactMatch` to the IEC 60050-845 entry
(845-01-14). Mark withdrawn terms `owl:deprecated` with `dct:isReplacedBy` rather than
removing them, so that identifiers cited in already-published datasets keep resolving.
This is the property that makes a vocabulary safe to cite in permanent records.

**G7 — Multilingual labels.** CIE S 017:2020 is published bilingually and national
committees produce further translations. With SKOS this is `skos:prefLabel` with language
tags, at no structural cost. It is also directly relevant to the CIE metadata model, whose
README already handles translated datasets (identifier suffix `.ES` and so on) while
requiring that `datatableInfo` stay in English — with language-tagged term labels, a
consumer could render the quantity in the user's language while the record still cites one
language-independent PID.

**G8 — Close the gaps.** Two are visible from this corpus alone:

- `adaptation coefficient` (the mesopic parameter *m*, CIE 191:2010) has no ILV term,
  although it is the quantity of a published CIE data table.
- Conversely, several quantities CIE tabulates are absent from the BIPM knowledge base.
  Where these are general metrological quantities rather than colorimetric ones, CIE could
  propose them to BIPM through the liaison.

A useful editorial rule follows from this: **any quantity appearing in a published CIE data
table should have an ILV term.** The data tables are a good forcing function for
vocabulary completeness, and the sixteen-row table in section 13 is the current audit.

### 9.3 Why this is worth doing

CIE is the authority for these concepts. If the e-ILV is not machine-actionable, consumers
who need identifiers will use whatever is: QUDT, Wikidata, or ad-hoc local vocabularies —
none of which CIE controls, and all of which will drift from CIE S 017. G1, G2 and G4
together would make CIE the cited source for colorimetry in linked data, in the same way
that the SI Reference Point has made BIPM the cited source for units.

---

## 10. Defect register

Independent of the recommendations above. These are defects in the published data,
measured against the 39 entries in `CIEmetaDBdataset.json`. The affected share of the corpus
is small — 8 defective columns out of 402, plus the subject-casing issue.

**Defects 3 and 4 have since been corrected** in the database; the remaining data defects are
1, 2, 5, 6 and 7.

Defects in the *schema file* — it was not valid JSON, it had no `$id`, its `wavelength_*`
fields rejected the sentinel strings the documentation requires, and `funderIdentifierType`
lacked ROR — have been corrected. See the version history in
[README.md](README.md) and the `$comment` in
[`../schema/CIEmetaDigitalProduct_schema_04.json`](../schema/CIEmetaDigitalProduct_schema_04.json).

| # | Defect | Extent | Datasets |
|---|---|---|---|
| 1 | `"quantity": "  "` (whitespace) on the `lambda` column | 2 columns | `CIE_illum_D55`, `CIE_illum_D75` |
| 2 | `quantity` key absent | 6 columns | `CIE_1st_deriv_meta_ind` (`delta_x_bar(lambda)`, `delta_y_bar(lambda)`, `delta_z_bar(lambda)`), `CIE_illum_Dxx_comp` (`S_0(lambda)`, `S_1(lambda)`, `S_2(lambda)`) |
| 3 | **`descrition` typo** instead of `description` — **fixed** | 15 columns in **1** dataset | `CIE_srf_CQS_5nm` |
| 4 | `β15(λ)` — the only non-ASCII column title in the corpus, where every other dataset transliterates (`x_bar`, `lambda`) — **fixed**, now `beta15(lambda)` | 1 column | `CIE_srf_PS_5nm` |
| 5 | **Subject casing is inconsistent** — the same concept appears under two spellings | 6 subject entries | `Perception of colour` (10) vs `Perception of Colour` (2); `Colour of objects` (10) vs `Colour of Objects` (2); `Colour vision` (10) vs `Colour Vision` (2) |
| 6 | v3 example declares `"schemaName": "CIEmetaDataProduct"` (vs `CIEmetaDigitalProduct` in its own schema) and reuses the **v4** `schemaURL` DOI | 1 file | `v3/examples/CIE_cc_1931_2deg.csv_metadata.json` |
| 7 | **Stored `contentHash` does not match the payload**, and replaying `history[].patch` does not reproduce it | 38 of 39 entries | all except `CIE_std_illum_A_1nm` |

Defect 3 was the one that silently lost information: a consumer reading `description` got
nothing for those 15 columns. It was **far less widespread than the `../examples/` folder
suggests** — the stale copies there carry the typo in 12 files, but in the live database
only `CIE_srf_CQS_5nm` still had it. That remainder is now corrected, and the key
`descrition` occurs nowhere in the database.

Defect 5 is a direct illustration of why recommendation F matters. Fourteen distinct subject
strings are in use across 113 subject entries, all as bare strings with no
`subjectScheme`, `schemeURI` or `valueURI` — nothing prevents the same concept being
entered twice with different capitalisation, and nothing detects it afterwards.

Defect 7 is not visible in any published metadata file — it affects the WebTool database
envelope, not the payloads. Recomputing `contentHash(payload)` with the tool's own
`canonical()` and SHA-256 reproduces the stored value for exactly one entry, and
`reconstruct(history, rev)` fails to reproduce the payload for the same 38. The consequence
is that `historyContainsHash()`, the ancestry test the merge path uses to decide
fast-forward versus conflict, cannot recognise an ancestor for those entries, so every
concurrent edit is reported as a conflict. The fix is to recompute both — the payloads
themselves are sound, and all 39 validate against the schema.

Fixing any of 1, 2 or 5 changes metadata content and therefore increments
`metadataRevision` per CIE 3. Defects 3 and 4 were applied directly to the stored payloads
without a revision bump: `rev`, `metadataRevision`, `contentHash` and `audit` are unchanged,
and the `descrition` correction was also applied inside the rev-1 history patch of
`CIE_srf_CQS_5nm` — so those two records now differ from what the history replays. This is
recorded here rather than hidden; whether to reissue them as revision 3 is an editorial
decision, and doing so would also clear defect 7 for those entries.

### 10.1 The schema was defined twice — **resolved**

Not a defect in the data, but the condition that produced two of them. The WebTool used to
restate the schema by hand in JavaScript (`ENUMS` and `buildCieSchema()` in
`CIEmetaDB.html`), because it cannot fetch the schema file: it runs from `file://`, where
`fetch` is blocked by CORS. Any schema change therefore had to be made in two places, and
the two drifted apart **twice**:

- `wavelength_first/last/step` — the tool accepted the sentinel strings the published
  schema rejected, so the tool validated a record the schema did not.
- `titleType` — the tool offered `""` ("(none)"), which is not in the schema's enum. Any
  curator selecting it produced a record the published schema rejects. Latent, never
  triggered in a published record, but reachable from the UI.

Neither was caught by review, because catching them meant comparing two differently-written
schemas by eye.

**Fix applied.** The schema file is now embedded verbatim in `CIEmetaDB.html` as a
`<script type="application/json" id="cieSchemaSource">` block. The tool parses that block
for both structural validation and its enum catalogues; `buildCieSchema()` is deleted and
`ENUMS` is derived from the parsed schema. The schema is written down once, and the tool
remains a self-contained offline file.

`v4/tools/WebTool/sync_schema.py` maintains the invariant — `--check` fails when the
embedded copy and the file diverge, and is intended to run in CI on changes to either. The
comparison is character-for-character rather than semantic, so it cannot miss a divergence
the way reading two schemas side by side can.

Checking what could actually be derived exposed a related gap. README.md publishes four
controlled value tables for `datatableInfo`, but only three of them —
`interpolationMethod`, `extrapolationMethod`, `dataQuality` — had ever been encoded as
schema enums. **`validationType` (CIE 2.5) had not**, so it was a free string in the schema
while being a closed vocabulary in the documentation. It is now
`definitions.validationType`, and the tool derives it like the rest. This narrows what the
schema accepts, unlike the other corrections, but all three values in use across the
published corpus (`sampleRow`, `sumOfColumns`, `numberOfColumns`) are within the six.

One catalogue remains hand-maintained in the tool: `hashMethod`. That is deliberate.
README.md CIE 1 introduces md5 and sha256 with "there are different standards, e.g. …" —
an open set, not a vocabulary. Constraining it in the schema would wrongly reject sha512.
The tool offers the two as UI suggestions and the field stays a free string.

A loose end in the same block: **`validationAlgorithm` is in the schema but appears in none
of the 192 validation entries** across the published corpus and the bundled databases, and
it is absent from the CIE 2.5 value table. It should either be documented in README.md or
removed from the schema.

A related loose end: `":null"` appears in both sentinel lists and in README.md, but it is
not part of the `":unap"` / `":unas"` / `":unal"` family used elsewhere, and no data file
uses it.

---

## 11. Worked examples

### 11.1 `CIE_cc_1931_2deg` — before

```json
"columnHeaders": [
  { "title": "lambda",    "unit": "nm",            "quantity": "wavelength",
    "wavelength_first": 360, "wavelength_last": 830, "wavelength_step": 1 },
  { "title": "x(lambda)", "unit": "dimensionless", "quantity": "chromaticity coordinates",
    "wavelength_first": 360, "wavelength_last": 830, "wavelength_step": 1 }
]
```

### 11.2 `CIE_cc_1931_2deg` — after

Every recommendation applied. Existing fields are untouched; four keys are added per column.

```json
"columnHeaders": [
  {
    "title": "lambda",
    "symbol": "λ",
    "unit": "nm",
    "unitPID": "https://si-digital-framework.org/SI/units/nanometre",
    "quantity": "wavelength",
    "quantityPID": "https://cie.co.at/eilvterm/17-21-025",
    "wavelength_first": 360, "wavelength_last": 830, "wavelength_step": 1
  },
  {
    "title": "x(lambda)",
    "symbol": "x(λ)",
    "unit": "dimensionless",
    "unitPID": "https://si-digital-framework.org/SI/units/one",
    "quantity": "chromaticity coordinates",
    "quantityPID": "https://cie.co.at/eilvterm/17-23-055",
    "wavelength_first": 360, "wavelength_last": 830, "wavelength_step": 1
  }
]
```

Note `17-23-055` (*spectral* chromaticity coordinates) rather than `17-23-053` — this is a
spectrum-locus table. See 4.1.

The record now supports, without human interpretation: dimensional checking, unit
conversion, correct axis labelling, and the query "which CIE tables tabulate a chromaticity
coordinate against wavelength?".

### 11.3 `CIE_max_sle_mesopic` — the hard case

The only non-spectral table, the only real physical unit, and the record whose sentinel
values the schema file used to reject.

```json
"columnHeaders": [
  {
    "title": "m",
    "symbol": "m",
    "unit": "dimensionless",
    "unitPID": "https://si-digital-framework.org/SI/units/one",
    "quantity": "adaptation coefficient",
    "description": "adaptation coefficient m; no ILV term exists — see CIE 191:2010",
    "wavelength_first": ":unap", "wavelength_last": ":unap", "wavelength_step": ":unap"
  },
  {
    "title": "K_m,mes;m",
    "symbol": "K_m,mes;m",
    "unit": "lm/W",
    "unitPID": "https://si-digital-framework.org/SI/units/lumen.watt-1",
    "quantity": "maximum luminous efficacy",
    "quantityPID": "https://cie.co.at/eilvterm/17-21-092",
    "description": "maximum luminous efficacy for a given adaptation coefficient m",
    "wavelength_first": ":unap", "wavelength_last": ":unap", "wavelength_step": ":unap"
  }
]
```

`quantityPID` is simply absent on the first column. That is the correct behaviour for a
concept with no identifier — better an honest gap than a fabricated URI.

---

## 12. Roadmap

**Phase 1 — schema hygiene.** No new fields, no change to the model.

- *Schema file: **done.*** Valid JSON, `$id`, sentinel-tolerant `wavelength_*`, ROR.
  `schemaVersion` stays `4`, the schema DOI is unchanged, and all 39 published records now
  validate against the file. See the version history in [README.md](README.md).
- *Data (section 10): defects 3 and 4 **done**, 1, 2, 5, 6 and 7 outstanding.* Records
  touched increment `metadataRevision` per CIE 3 — note that 3 and 4 were applied in place
  without a bump, see section 10. Effort: small — 8 defective columns out of 402, plus the
  subject-casing variants and a recomputation of the database hashes.

**Phase 2 — semantic annotation.** Add `unitPID`, `quantityPID`, `symbol` as optional
fields; publish the appendix table as a normative annex to README.md; extend the WebTool so
the Quantity and Unit inputs become dropdowns backed by that table, with the PID filled in
automatically. Currently both are plain text inputs (`CIEmetaDB.html` around lines
1443–1444) and the conventions are enforced by nothing — which is how the whitespace and
missing-key defects arose. Remember the two-places rule for schema changes (section 10.1).
`schemaVersion` stays `4`; document the change as 4.2. Effort: small for the data, moderate
for the tool.

**Phase 3 — linked data.** `@context`, the DCAT/schema.org crosswalk on DOI landing pages,
derived CSVW sidecars, and the agent PIDs of recommendation F. Effort: moderate, and
partly dependent on CIE web infrastructure rather than on this repository.

**Parallel track — recommendation G.** Not on this repository's critical path, and on a
different timescale. Phases 1–3 are worth doing whether or not G happens; G1, G2 and G4
would make the `quantityPID` values from Phase 2 substantially more useful.

---

## 13. Appendix — normative mapping table

The complete vocabulary of the CIE data-table corpus. Sixteen rows.

### Units

| `unit` | `unitPID` |
|---|---|
| `nm` | `https://si-digital-framework.org/SI/units/nanometre` |
| `dimensionless` | `https://si-digital-framework.org/SI/units/one` |
| `lm/W` | `https://si-digital-framework.org/SI/units/lumen.watt-1` |

### Quantities

| `quantity` | `quantityPID` |
|---|---|
| `wavelength` | `https://cie.co.at/eilvterm/17-21-025` |
| `spectral distribution` | `https://cie.co.at/eilvterm/17-21-029` |
| `spectral radiance factor` | `https://cie.co.at/eilvterm/17-24-075` |
| `chromaticity coordinates` | `https://cie.co.at/eilvterm/17-23-053` |
| `spectral chromaticity coordinates` | `https://cie.co.at/eilvterm/17-23-055` |
| `colour-matching function` | `https://cie.co.at/eilvterm/17-23-039` |
| `CIE colour-matching functions` | `https://cie.co.at/eilvterm/17-23-047` |
| `spectral tristimulus values` | `https://cie.co.at/eilvterm/17-23-038` |
| `spectral sensitivity` | `https://cie.co.at/eilvterm/17-25-063` |
| `action spectra` | `https://cie.co.at/eilvterm/17-26-027` |
| `spectral luminous efficiency` | `https://cie.co.at/eilvterm/17-21-035` |
| `luminous efficiency` | `https://cie.co.at/eilvterm/17-21-094` |
| `maximum luminous efficacy` | `https://cie.co.at/eilvterm/17-21-092` |
| `adaptation coefficient` | *(no term — see 4.1 and G8)* |

### As a lookup object

Embeddable directly in the WebTool.

```json
{
  "units": {
    "nm":            "https://si-digital-framework.org/SI/units/nanometre",
    "dimensionless": "https://si-digital-framework.org/SI/units/one",
    "lm/W":          "https://si-digital-framework.org/SI/units/lumen.watt-1"
  },
  "quantities": {
    "wavelength":                        "https://cie.co.at/eilvterm/17-21-025",
    "spectral distribution":             "https://cie.co.at/eilvterm/17-21-029",
    "spectral radiance factor":          "https://cie.co.at/eilvterm/17-24-075",
    "chromaticity coordinates":          "https://cie.co.at/eilvterm/17-23-053",
    "spectral chromaticity coordinates": "https://cie.co.at/eilvterm/17-23-055",
    "colour-matching function":          "https://cie.co.at/eilvterm/17-23-039",
    "CIE colour-matching functions":     "https://cie.co.at/eilvterm/17-23-047",
    "spectral tristimulus values":       "https://cie.co.at/eilvterm/17-23-038",
    "spectral sensitivity":              "https://cie.co.at/eilvterm/17-25-063",
    "action spectra":                    "https://cie.co.at/eilvterm/17-26-027",
    "spectral luminous efficiency":      "https://cie.co.at/eilvterm/17-21-035",
    "luminous efficiency":               "https://cie.co.at/eilvterm/17-21-094",
    "maximum luminous efficacy":         "https://cie.co.at/eilvterm/17-21-092"
  }
}
```

---

## 14. References

**Units and quantities**
- SI Digital Framework / SI Reference Point — https://si-digital-framework.org/SI
- SI units — https://si-digital-framework.org/SI/units
- SI quantities — https://si-digital-framework.org/quantities
- Compound unit expression parser — https://si-digital-framework.org/SI/unitExpr
- API documentation (Swagger), Turtle downloads and SPARQL endpoint — linked from
  https://si-digital-framework.org/SI
- Source repository — https://github.com/TheBIPM/SI_Digital_Framework
- CIE e-ILV — https://cie.co.at/e-ilv
- IEC 60050-845, *International Electrotechnical Vocabulary — Lighting* (the e-ILV records
  the correspondence in its notes; see G6)

**Optional additional unit identifiers.** QUDT (`http://qudt.org/vocab/unit/NanoM`,
`http://qudt.org/vocab/unit/CD-PER-M2`) and UCUM codes (`nm`, `cd.m-2`) are widely
supported by scientific software and could be carried as extra fields. This document
**does not recommend them as primary identifiers**: one authoritative PID per concept is
easier to keep correct than three parallel ones, and for SI units the BIPM is the
authority. Note that QUDT records a `qudt:ucumCode` on each unit, so a QUDT or UCUM value
can be derived when a consumer needs it.

**Data description**
- W3C CSV on the Web — https://www.w3.org/TR/tabular-data-primer/
- DCAT — https://www.w3.org/TR/vocab-dcat-3/
- schema.org Dataset — https://schema.org/Dataset
- JSON-LD 1.1 — https://www.w3.org/TR/json-ld11/
- SKOS — https://www.w3.org/TR/skos-reference/
- DataCite Metadata Schema — https://schema.datacite.org/

**Identifiers**
- ROR — https://ror.org (CIE: https://ror.org/05w2j5k62)
- ORCID — https://orcid.org
- SPDX licence list — https://spdx.org/licenses/
