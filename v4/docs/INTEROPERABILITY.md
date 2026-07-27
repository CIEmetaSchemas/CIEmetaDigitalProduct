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

The database is the authoritative corpus, and now the only one. `../examples/` previously
held a **stale subset** — 36 records rather than 39 (`CIE_srf_CQS_5nm`, `CIE_srf_FCI_5nm` and
`CIE_srf_PS_5nm` were missing), several of them predating corrections already made in the
database, so analyses run against that folder overstated some defect counts. Those copies
have since been removed; the folder is empty and no second copy of the corpus is maintained
in this repository.

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
is now transliterated as `beta15(lambda)`.

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

### 8.1 Creators and publisher

None of the 39 records carries `nameIdentifiers`. The CIE has a ROR identifier, verified:

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

### 8.2 Subjects

`subjects[]` supports `subjectScheme`, `schemeURI`, `valueURI`,
`classificationCode` and `lang`. Across the 39 records there are **113 subject entries drawing
on 14 distinct strings, and `subject` is the only sub-key ever used** — no scheme is declared
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
capitalisation variants of another three (defect 5a). Fourteen values is small enough to
enumerate. But the strings alone understate the problem; three further things follow from
looking at how the 113 entries are *distributed*.

**The 113 entries form only six distinct sets, and two of those are the same four concepts:**

| records | set |
|---|---|
| 18 | `Photometry` · `Objective photometry` · `Units. Constants` |
| 10 | `Colorimetry` · `Colour of objects` · `Colour vision` · `Perception of colour` |
| 4 | *(empty — no `subjects[]` entries)* |
| 4 | `Influence of the colour of the light` · `Artificial daylight` |
| 2 | `Perception of Colour` · `Colour of Objects` · `Colour Vision` · `Colorimetry` |
| 1 | `Influence of the colour of the light` · `Lighting with respect to object illuminated` · `Evaluation of light sources` |

The two-record row is the ten-record row again: the same four concepts, in a different order
and a different casing. Subjects were therefore assigned **per import batch rather than per
dataset**, and that shows up as content error and not only as spelling. Three groups, twelve
records:

- the chromaticity-coordinate, colour-matching-function and tristimulus tables
  (`CIE_cc_1931_2deg`, `CIE_cc_1964_10deg`, `CIE_xyz_1931_2deg`, `CIE_xyz_1964_10deg`,
  `CIE_cfb_stv_2deg`, `CIE_cfb_stv_10deg`, `CIE_smb_cc_2deg`) carry the *photometry* set and
  not `Colorimetry`;
- `CIE_std_illum_A_1nm`, `CIE_std_illum_D50` and `CIE_std_illum_D65` carry the photometry set,
  while the nine other illuminant tables — `CIE_illum_C`, `D55`, `D75`, `Dxx_comp`, `FLs`,
  `FLs_1nm`, `HPs`, `LEDs`, `LEDs_1nm` — carry the colorimetry set. Same kind of table, two
  different answers;
- `CIE_lms_cf_2deg` and `CIE_lms_cf_10deg` carry `Artificial daylight`, inherited from the
  `CIE_illum_ID50`/`ID65` pair they were imported with.

Casing is the visible symptom of a batch-assignment practice; declaring a scheme fixes the
symptom, not the practice (defects 5a and 5c).

**Four of the 39 records carry no subjects at all** — `CIE_RefSpectrum_L41`,
`CIE_srf_CQS_5nm`, `CIE_srf_FCI_5nm` and `CIE_srf_PS_5nm` (`10.25039/CIE.DS.van56dfj`,
`.yzfhz3cm`, `.vkss79ef`, `.7chm7z5h`). DataCite makes `subject` *Recommended* rather than
mandatory, so this is a gap and not an error — but it is a gap in the one field that carries
topical discoverability (defect 5b).

**Nothing outside this repository holds these subjects.** The CIE dataset DOIs are registered
at **Crossref, not DataCite**: the prefix `10.25039` returns 1 429 works from the Crossref API
and none from the DataCite API, and the record for `10.25039/CIE.DS.vqqhzp5a` is
`type: dataset`, publisher `International Commission on Illumination (CIE)`, with an empty
subject array. The JSON sidecar is therefore the only carrier of subject information. That is
a finding in both directions: subject metadata is invisible to DOI-based discovery today, and
repairing it changes no external record — only `metadataRevision`, per CIE 3.

**Which subject vocabulary — no public scheme can be adopted as the value list.** The
distinction matters: several public schemes cover the subject *matter* of the CIE corpus well,
and one covers it very well, but none of them has *these headings*. They are facet headings
from a classification, not keywords: `Units. Constants` reads as a merged heading from a
printed catalogue, and `Lighting with respect to object illuminated` and `Objective
photometry` are not phrasings any general thesaurus uses. Searching for the distinctive ones
outside `cie.co.at` returns nothing. So the public schemes are **mapping targets, not
replacements** — which is what the sub-properties `valueURI` and `classificationCode` are for.
The candidates were checked:

| Scheme | Assessment |
|---|---|
| **OECD Fields of Science (FoS)** | Six top-level categories and 42 subcategories; fits the CIE corpus only at `FOS: Physical sciences`, one value for all 39 records. It is what OpenAIRE and the European data portals harvest on, so the *string* still has to be carried — but **the `schemeURI` DataCite's convention specifies, `http://www.oecd.org/science/inno/38235147.pdf`, is dead: it returns HTTP 410 Gone.** A convention that requires publishing a dead link is a reason to carry EuroSciVoc alongside it, not instead of the compatibility string. |
| **LCSH** (`id.loc.gov`) | Resolvable, SKOS, content-negotiable, stable, and one of the two schemes the DataCite 4.7 documentation names. An exact match exists for only 3 of the 11 CIE concepts (see section 13); for the rest LCSH is a *broader* term, and in one case it cannot distinguish two CIE concepts at all — `Color perception` is a variant label that LCSH redirects to `Color vision`, whereas the CIE list keeps `Perception of colour` and `Colour vision` apart. **Recommended as an optional `valueURI` where the match is exact, and as the `skos:broadMatch` target otherwise.** |
| **PhySH** (Physics Subject Headings, APS) | Exemplary infrastructure, disappointing coverage — see the table in section 13. **CC0 1.0**, bulk downloads in JSON-LD, Turtle, N-Triples and RDF/XML, and **a DOI per concept** under prefix `10.29172` resolving to `https://physh.org/concepts/{uuid}`. But release 2.8.0 was measured, and across its 3 910 concepts the strings *colorimetry*, *photometry*, *radiometry*, *photobiology*, *luminous*, *illuminance*, *chromaticity* and *tristimulus* do not occur **at all**. It classifies physics research topics, not measurement disciplines. **Not recommended as the `valueURI` source for this corpus**; keep it in view for physics-adjacent material, and read its DOI practice as the worked precedent for G2. |
| **MeSH** (US National Library of Medicine) | Covers the photobiology, UV, vision and circadian cluster that dominates the CIE publication list outside Divisions 1 and 2 — verified: `Photobiology` `D018462`, `Ultraviolet Rays` `D014466`, `Circadian Rhythm` `D002940`, `Circadian Clocks` `D057906`, `Vision, Ocular` `D014785`, `Color Perception` `D003118`. Resolvable URIs of the form `https://id.nlm.nih.gov/mesh/D018462`, RDF and JSON-LD by content negotiation, a lookup API and a SPARQL endpoint. Note it is the one scheme here that *does* name photobiology as a concept. **Recommended for Division 6 material.** |
| **EuroSciVoc** (European Science Vocabulary, Publications Office of the EU) | The maintained successor to the OECD FoS layer, and better on every axis: SKOS-XL, **CC-BY 4.0**, 1 017 concepts, six languages, `skos:notation` codes, bulk Turtle/RDF download, and resolvable URIs `http://data.europa.eu/8mn/euroscivoc/{uuid}` that content-negotiate to RDF. Its first two levels align to the OECD Frascati taxonomy, so it *is* the FoS layer, with identifiers. One level deeper than FoS reaches `optics` (notation `251`) under `physical sciences` (`43`) under `natural sciences` (`23`). **Recommended as the Layer 2 anchor, replacing the bare FoS string.** |
| **ICS** (International Classification for Standards, ISO) | The classification the standards world already files CIE work under: ISO/CIE 11664-2:2022 sits in **17.180.20 Colours and measurement of light**, under 17.180 Optics and optical measurements, under 17 Metrology and measurement. Physical phenomena. Authoritative, coded and carrying real institutional weight — but weak on identifiers: `https://www.iso.org/ics/17.180.20/x/` is a catalogue browse path, not a term URI. It therefore belongs in **`classificationCode`**, which is precisely the DataCite sub-property provided for schemes without per-term URIs. **Recommended for publications, not for data tables.** |
| ANZSRC Fields of Research | The other scheme DataCite names. Australian/New Zealand research administration; no advantage over FoS here and no per-term URIs. |
| UNESCO Thesaurus, Wikidata, QUDT | Too coarse, not authoritative for lighting, or a unit vocabulary rather than a subject one. Not recommended as primary, for the same one-identifier-per-concept reason given against QUDT and UCUM in section 14. |
| IEC 60050-845 / Electropedia | Terminology, not classification — the same objection as the e-ILV below. |

**The choice has to anticipate a wider corpus than the present one.** All 39 published data
tables come from the work of Divisions 1 and 2 — vision and colour, and the physical
measurement of light and radiation — which is why colorimetry and photometry exhaust the
current subject list. That is a property of what has been published so far, not of CIE's
range: the publication list already extends well beyond it, and Division 6 material in
particular (photobiology and photochemistry — action spectra, UV, non-visual and circadian
effects) is the kind that produces data tables. `CIE_a-opic_action_spectra` is already in the
corpus and is arguably the first of them.

Two consequences for the design. First, **the scheme choice differs by resource type**: ICS is
the right classification for CIE *publications*, because that is how standards are filed and
found, and the wrong one for data tables, where per-term identifiers matter more than
institutional weight. Second, **more than one external scheme will be needed**, and that is
not a defect — PhySH for the physics core, MeSH for the photobiology cluster, FoS for portal
harvesting. What must stay singular is the *CIE* value list; the external identifiers hang off
it as mappings, which is the division of labour recommendation G9 sets out. Choosing a
single external scheme now, to cover only what is published now, would have to be revisited
the first time a Division 6 data table appears.

**The CIE e-ILV is the wrong instrument for `subjects[]`, despite being the right one for
`quantityPID`.** It is a *terminology* vocabulary: its 1 347 entries are term-level concepts —
quantities, phenomena, symbols — which is exactly what recommendation B already cites. Using
ILV terms as subject values would conflate *what a column measures* with *what a dataset is
about*, duplicate recommendation B at record level, and make `subjects[]` depend on a
vocabulary that section 9.1 measures as having no content negotiation, no serialisation, no
bulk download and a CMS-path identifier. Several of the CIE headings — `Artificial daylight`,
`Evaluation of light sources`, `Lighting with respect to object illuminated` — have no ILV term
at all, because they are application topics rather than defined concepts.

The e-ILV does have one role here, but a different one: as the **source of a derived CIE
subject scheme**. The ILV's own section numbering (`17-21` … `17-32`) is already a CIE topical
classification, and it is the natural top level for one. That is recommendation **G9** below,
not a change to `subjects[]`.

**Proposal — three layers.**

*Layer 1 — declare the scheme and close the list.* The 14 strings collapse to **11
concepts**; the canonical form is sentence case, which is the majority spelling in every
case (10 uses against 2). Each entry gains three fields:

```json
{
  "subject": "Perception of colour",
  "subjectScheme": "CIE Subject Headings",
  "schemeURI": "https://cie.co.at/subject-headings",
  "lang": "en"
}
```

`subjectScheme` is the field that does the work, and it does it **before** anything is
published at `schemeURI`: it declares the value set closed, which is what makes a casing
variant or an unknown value detectable by a tool instead of only by eye. The scheme name and
URI above are CIE's to mint and are placeholders here.

*Layer 2 — one coarse external anchor, identical on all 39 records.* Two entries alongside the
CIE ones, because the scheme that portals key on and the scheme with usable identifiers are
not the same scheme. The identified one first:

```json
{
  "subject": "optics",
  "subjectScheme": "EuroSciVoc",
  "schemeURI": "http://data.europa.eu/8mn/euroscivoc",
  "valueURI": "http://data.europa.eu/8mn/euroscivoc/f3cb3d46-1a4f-4c29-9e80-46a854f53382",
  "classificationCode": "251",
  "lang": "en"
}
```

and the compatibility string, which harvesters match on:

```json
{
  "subject": "FOS: Physical sciences",
  "subjectScheme": "Fields of Science and Technology (FOS)",
  "schemeURI": "http://www.oecd.org/science/inno/38235147.pdf"
}
```

That second `schemeURI` is a **dead link** — HTTP 410 Gone, checked. It is retained only
because DataCite's FoS convention names that exact URL and OpenAIRE keys on the
`subjectScheme`/`subject` pair; if CIE would rather not publish a 410, dropping the
`schemeURI` and keeping the two matched strings is the better trade, and EuroSciVoc carries the
resolvable identity either way. EuroSciVoc is also a level deeper than FoS can go: `optics`
rather than all of physical sciences, without inventing anything, because its upper two levels
*are* the Frascati taxonomy.

This is the smallest change with the largest discovery effect, and recommendation E
(section 7.1, `dcat:keyword` / `dct:subject`) depends on it.

*Layer 3 — `valueURI` per concept where an exact match exists.* LCSH for the three concepts
that have one, absent for the other eight — the same honest-gap principle applied to
`quantityPID` for `adaptation coefficient` in section 11.3. The nearest LCSH *broader* terms
are recorded in section 13 nonetheless: they are what the CIE scheme should carry as
`skos:broadMatch` under G9, and putting a broader term in `valueURI` would misstate it as the
subject itself.

Section 13 gives LCSH and PhySH side by side, and the comparison is instructive: LCSH matches
three of the eleven exactly, PhySH matches **none**. MeSH remains the right target for Division
6 concepts once those tables exist, and ICS `classificationCode` values for publication records
if they ever adopt this model.

One field, one identifier: whichever scheme supplies `valueURI` for a given concept, the others
belong in the CIE scheme as `skos:exactMatch` / `skos:broadMatch` and not as extra subject
entries per record. That is the same argument section 14 makes against carrying QUDT and UCUM
alongside the BIPM unit PIDs, and it is the reason the CIE value list has to stay singular
while the number of external schemes grows.

### 8.3 Licence

`rightsIdentifier` is `"CC BY-SA 4.0"`. The SPDX short identifier is
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

This is not hypothetical, and the comparison is worth making explicitly: the American Physical
Society already does it. Every one of the 3 910 concepts in PhySH carries a DOI under prefix
`10.29172` which resolves to the concept page — `https://doi.org/10.29172/141061f5-…` →
`https://physh.org/concepts/141061f5-…`. A DOI per term in a subject vocabulary is established
practice by a comparable learned society, not a novel demand, and CIE is better placed to do it
than APS was: the DOI prefix is already in service.

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

**G9 — publish the CIE subject headings as a SKOS scheme.** Distinct from G1–G8, which are
about the ILV itself, but the same argument applied to a second CIE vocabulary. Section 8.2
shows that the 11 subject headings used across the published data tables belong to no public
classification: CIE is the only body that can declare them. The deliverable is small — 11
concepts, growing slowly — and it is the prerequisite for `subjectScheme` and `schemeURI` in
recommendation F meaning anything more than a label:

- a `skos:ConceptScheme` at a documented URI, one `skos:Concept` per heading with
  `skos:prefLabel` (language-tagged, E and F at least, as in G7) and `skos:notation`. Eleven
  concepts is the current corpus, not the target: the scheme should be laid out to take the
  other divisions, photobiology first;
- `skos:exactMatch` / `skos:broadMatch` to the external schemes of section 8.2 — LCSH and the
  OECD Fields of Science category from the crosswalk in section 13, PhySH for the physics core,
  MeSH for the photobiology cluster, and ICS as `skos:notation` where a CIE publication is
  already filed under one. **This is the layer that has to be maintained centrally rather than
  per record**, because the number of external schemes will grow with the range of CIE
  divisions that publish data tables while the CIE value list must not fragment;
- the **ILV section numbering (`17-21` … `17-32`) as the top level**, which is what makes this
  a CIE classification rather than an ad-hoc list, and which links the subject scheme to the
  terminology scheme rather than duplicating it;
- the same content negotiation, persistence policy and bulk download as G1, G2 and G5 — a
  scheme cited in permanent records needs them for the same reasons.

Two editorial questions surface as soon as the list is written down as concepts rather than
strings. `Units. Constants` is a single heading covering two concepts, and reads as a merged
entry from a printed catalogue; as SKOS it should be two. And `Perception of colour` versus
`Colour vision` is a distinction the CIE list makes and LCSH does not — worth stating
explicitly in a `skos:scopeNote`, because it is exactly the kind of distinction that decays
into a casing variant when nothing records it.

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
is small — 8 defective columns out of 402, plus the subject defects.

**This register lists open items only.** Four defects recorded in earlier revisions of this
document — a `descrition` typo for `description`, a non-ASCII column title, a `schemaName`
typo in the v3 example, and a `contentHash` inconsistency across the WebTool databases — have
been corrected and their entries removed. The numbering of the remaining items is **not**
reissued, so 1, 2, 5 and 8 keep the numbers they have always had and references to them from
outside this document stay valid. The analysis of the `contentHash` defect and its cause in
`migrateDb()` lives in [`../tools/WebTool/README.md`](../tools/WebTool/README.md); the rest is
in the git history.

Defects in the *v4 schema file* — it was not valid JSON, it had no `$id`, its `wavelength_*`
fields rejected the sentinel strings the documentation requires, and `funderIdentifierType`
lacked ROR — have been corrected. See the version history in
[README.md](README.md) and the `$comment` in
[`../schema/CIEmetaDigitalProduct_schema_04.json`](../schema/CIEmetaDigitalProduct_schema_04.json).
The **v3 schema file carried the same JSON-validity defect** — its descriptive header was 25
`//` line comments inside the root object — and has been corrected the same way, so the v3
example can now be checked against its own schema by a strict parser. `schemaVersion` stays
`3` and no published metadata file is affected.

| # | Defect | Extent | Datasets |
|---|---|---|---|
| 1 | `"quantity": "  "` (whitespace) on the `lambda` column | 2 columns | `CIE_illum_D55`, `CIE_illum_D75` |
| 2 | `quantity` key absent | 6 columns | `CIE_1st_deriv_meta_ind` (`delta_x_bar(lambda)`, `delta_y_bar(lambda)`, `delta_z_bar(lambda)`), `CIE_illum_Dxx_comp` (`S_0(lambda)`, `S_1(lambda)`, `S_2(lambda)`) |
| 5a | **Subject casing and order are inconsistent** — `Perception of colour` (10) vs `Perception of Colour` (2), `Colour of objects` (10) vs `Colour of Objects` (2), `Colour vision` (10) vs `Colour Vision` (2), and the four concepts in a different order | 8 subject entries | `CIE_srf_cfi`, `CIE_srf_cfi_1nm` |
| 5b | **`subjects[]` empty** — no topical metadata at all | 4 of 39 records | `CIE_RefSpectrum_L41`, `CIE_srf_CQS_5nm`, `CIE_srf_FCI_5nm`, `CIE_srf_PS_5nm` |
| 5c | **Subjects contradict the dataset content**, having been assigned per import batch rather than per dataset — see section 8.2 | 12 records | `CIE_cc_*`, `CIE_xyz_*`, `CIE_cfb_stv_*`, `CIE_smb_cc_2deg`; `CIE_std_illum_A_1nm`, `CIE_std_illum_D50`, `CIE_std_illum_D65`; `CIE_lms_cf_2deg`, `CIE_lms_cf_10deg` |
| 8 | **One schema DOI for two schema versions** — `10.25039/CIE.SC.4taqevcd` is the mandated `schemaURL` of *both* v3 and v4 and the `$id` of v4, so `schemaURL` does not identify which schema a record was written against | both schema files, every published record | v3 and v4 schemas |

Defect 5 is a direct illustration of why recommendation F matters, and it has three parts
because they need three different repairs. All 113 subject entries are bare strings with no
`subjectScheme`, `schemeURI` or `valueURI`: nothing prevents the same concept being entered
twice with different capitalisation (5a), nothing marks a record as having no subjects at all
(5b), and nothing relates a subject to the content of the table it describes (5c). 5a is
mechanical — pick the majority spelling, section 13 lists it. 5b and 5c are editorial and
need CIE, because they are about which topics a dataset belongs to and not about how they are
written. Declaring the scheme, per section 8.2, is what makes 5a detectable by a tool rather
than by eye; it does not by itself prevent 5b or 5c.

Defect 8 came to light while repairing the v3 example, and it is the one item in this register
that cannot be repaired in this repository. Both schema versions declare
`"schemaURL": {"const": "https://doi.org/10.25039/CIE.SC.4taqevcd"}`, and v4 additionally
declares that DOI as its `$id`. A consumer holding a metadata file therefore learns the
schema version only from `schemaVersion`, never from the identifier the record is required to
carry — and resolving `schemaURL` returns whichever version is currently behind the DOI. For
the same reason the v3 schema was **not** given an `$id` when its JSON validity was repaired:
the only available identifier is already claimed by v4, and inventing a URI would be worse
than leaving the gap (the same reasoning as in section 11.3). Repairing this needs CIE to
mint a version-distinguishing identifier — a versioned DOI, or one DOI per schema version
with the current one kept as a "latest" alias. It is the same persistence argument made for
the e-ILV in recommendation G2, applied to CIE's own schema.

Fixing any of 1, 2 or 5 changes metadata content and therefore increments
`metadataRevision` per CIE 3. For subjects there is nothing else to keep in step: as section
8.2 records, no DOI record carries them, so a subject repair is invisible outside this
repository.

**One consequence of an earlier repair is still a live property of the database.** Two
corrections — a `description` key typo in `CIE_srf_CQS_5nm` and a non-ASCII column title in
`CIE_srf_PS_5nm` — were applied directly to the stored payloads without a revision bump, so
`rev`, `metadataRevision` and `audit` are unchanged, and to let the history replay to the
payload again the corrections were written into the rev-1 patches of those two entries.
**Those two rev-1 patches therefore no longer reproduce the files that were imported on
2026-07-21.** This is recorded rather than hidden; the alternative was to reissue both as
revision 3, which would have changed a published `metadataRevision` and required
re-publishing two metadata files for a typo and a transliteration.

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
- *Data (section 10): 1, 2, 5a and 5b outstanding.* Records touched increment
  `metadataRevision` per CIE 3. Effort: small and local — 8 defective columns out of 402,
  8 mis-cased subject entries in 2 records, and 4 records with no subjects. 5a needs only the
  majority spelling from section 13; 5b needs CIE to say which topics those four datasets
  belong to.
- *Subject assignment (defect 5c): outstanding, editorial.* Twelve records carry the subject
  set of the batch they were imported with rather than of their own content. Not a spelling
  question and not repairable mechanically; it needs CIE, and it is the item that argues most
  strongly for the closed list of section 8.2 and the scheme of G9.
- *Schema identifier (defect 8): outstanding and not repairable here.* Needs a
  version-distinguishing schema DOI from CIE; see section 10.

**Phase 2 — semantic annotation.** Add `unitPID`, `quantityPID`, `symbol` as optional
fields; publish the appendix table as a normative annex to README.md; extend the WebTool so
the Quantity and Unit inputs become dropdowns backed by that table, with the PID filled in
automatically. Currently both are plain text inputs (`CIEmetaDB.html` around lines
1443–1444) and the conventions are enforced by nothing — which is how the whitespace and
missing-key defects arose. **Apply the same treatment to the Subject input**, backed by the
eleven-value list in section 13 with `subjectScheme`, `schemeURI` and `lang` filled in
automatically: the subject field has exactly the defect history of the quantity field and the
same cause, and closing the list is what turns 5a from an editorial habit into a validation
error. Remember the two-places rule for schema changes (section 10.1).
`schemaVersion` stays `4`; document the change as 4.2. Effort: small for the data, moderate
for the tool.

**Phase 3 — linked data.** `@context`, the DCAT/schema.org crosswalk on DOI landing pages,
derived CSVW sidecars, and the agent, subject and licence PIDs of recommendation F — including
the `FOS: Physical sciences` entry and the LCSH `valueURI` values of section 8.2, which is
where a portal harvest starts paying off. Effort: moderate, and partly dependent on CIE web
infrastructure rather than on this repository.

**Parallel track — recommendation G.** Not on this repository's critical path, and on a
different timescale. Phases 1–3 are worth doing whether or not G happens; G1, G2 and G4
would make the `quantityPID` values from Phase 2 substantially more useful, and G9 would do
the same for `subjectScheme` — which is the one place in Phase 1 where this repository can
only put a placeholder, because the vocabulary does not exist outside CIE.

---

## 13. Appendix — normative mapping table

The complete vocabulary of the CIE data-table corpus: sixteen rows for units and quantities,
and eleven for subjects.

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

### Subjects

The fourteen strings in use collapse to eleven concepts. `subject` is the canonical form —
sentence case, the majority spelling in every case; `superseded` lists the variants to be
replaced by it. All eleven carry
`subjectScheme: "CIE Subject Headings"`, `schemeURI: "https://cie.co.at/subject-headings"` and
`lang: "en"` — placeholders until CIE mints them, per G9.

`valueURI` is given only where LCSH has an **exact** match; the *nearest LCSH broader term*
column is not a `valueURI` and must not be written into a record as one — it is the crosswalk
for the `skos:broadMatch` assertions of G9. Each heading below was looked up in the LCSH
suggest API (`https://id.loc.gov/authorities/subjects/suggest2?q=…`) and the identifier given
is the authorised URI it returned.

| `subject` | superseded | `valueURI` (LCSH exact) | nearest LCSH broader | nearest PhySH concept |
|---|---|---|---|---|
| `Photometry` | — | `https://id.loc.gov/authorities/subjects/sh85101383` | — | Metrology `141061f5` — far broader |
| `Objective photometry` | — | *(none)* | Photometry `sh85101383` | Metrology `141061f5` — far broader |
| `Units. Constants` | — | *(none — one heading, two concepts; see G9)* | Units of measurement `sh85141054`; Physical constants `sh85031311` | Determination of fundamental constants `a17bad0f` |
| `Colorimetry` | — | `https://id.loc.gov/authorities/subjects/sh85028695` | — | *(none — no colorimetry concept exists)* |
| `Colour of objects` | `Colour of Objects` | *(none)* | Color `sh85028577` | *(none)* |
| `Colour vision` | `Colour Vision` | `https://id.loc.gov/authorities/subjects/sh85028654` | — | Color detection `3f8bf87b`, under Vision `0e378245` |
| `Perception of colour` | `Perception of Colour` | *(none — LCSH redirects `Color perception` to `Color vision`, so it cannot hold this distinction)* | Color vision `sh85028654` | Color detection `3f8bf87b` — cannot hold the distinction either |
| `Influence of the colour of the light` | — | *(none)* | — | *(none)* |
| `Artificial daylight` | — | *(none — LCSH `Daylight` is natural daylight)* | Daylight `sh85035970` | *(none)* |
| `Lighting with respect to object illuminated` | — | *(none)* | Lighting `sh85076925` | *(none)* |
| `Evaluation of light sources` | — | *(none)* | Light sources `sh85076909` | *(none)* |

PhySH identifiers above are abbreviated to the first eight characters; the full form is
`https://doi.org/10.29172/{uuid}`, e.g.
`https://doi.org/10.29172/141061f5-f02c-492c-af56-81c3c49e8b65` for Metrology, which resolves
through the DOI to `https://physh.org/concepts/{uuid}`.

Three exact matches out of eleven is the measurement that settles the vocabulary question: a
general thesaurus cannot carry this list, which is why the CIE scheme is primary and LCSH is a
crosswalk.

**The PhySH column is the surprise, and it is worth stating plainly.** PhySH was expected to be
the best fit of any external scheme — it is the physics vocabulary, it is CC0, and it mints a
DOI per concept, which is exactly the infrastructure recommendation G2 asks CIE to build. It
was measured rather than assumed: release 2.8.0 was downloaded from
`github.com/physh-org/PhySH` and all 8 547 label strings across its 3 910 concepts were
searched. *Colorimetry*, *photometry*, *radiometry*, *photobiology*, *illuminance*, *luminous*,
*chromaticity* and *tristimulus* occur **zero** times. PhySH classifies physics *research
topics* — `Light scattering`, `Photodetectors`, `Vision`, `Metrology` — not the measurement
disciplines CIE is the authority for. Three broader concepts are recorded above and no exact
match exists.

The conclusion is not that PhySH is a poor vocabulary; it is that **the gap this document
identifies is real and wider than the e-ILV**. Neither the general library scheme, nor the
physics scheme, nor the EU fields-of-research taxonomy has a concept for colorimetry or
photometry. That is the strongest available argument for G9, and for CIE treating its own
vocabularies as the authoritative source rather than expecting to find one.

**MeSH is left out of this table on purpose**, not for lack of coverage: its terms are the right
targets for photobiology, UV, circadian and vision concepts, none of which is among these
eleven. It becomes relevant with the first Division 6 data table, and the descriptors are in
section 8.2 ready for it.

In addition, every record carries the two field-of-science entries of Layer 2:

| `subject` | `subjectScheme` | `valueURI` / `classificationCode` |
|---|---|---|
| `optics` | `EuroSciVoc` | `http://data.europa.eu/8mn/euroscivoc/f3cb3d46-1a4f-4c29-9e80-46a854f53382` · `251` |
| `FOS: Physical sciences` | `Fields of Science and Technology (FOS)` | *(none — the conventional `schemeURI` returns HTTP 410; see 8.2)* |

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
  },
  "subjectScheme": {
    "subjectScheme": "CIE Subject Headings",
    "schemeURI":     "https://cie.co.at/subject-headings",
    "lang":          "en"
  },
  "fieldsOfScience": [
    { "subject": "optics",
      "subjectScheme": "EuroSciVoc",
      "schemeURI": "http://data.europa.eu/8mn/euroscivoc",
      "valueURI": "http://data.europa.eu/8mn/euroscivoc/f3cb3d46-1a4f-4c29-9e80-46a854f53382",
      "classificationCode": "251",
      "lang": "en" },
    { "subject": "FOS: Physical sciences",
      "subjectScheme": "Fields of Science and Technology (FOS)" }
  ],
  "subjects": {
    "Photometry":                                  "https://id.loc.gov/authorities/subjects/sh85101383",
    "Objective photometry":                        null,
    "Units. Constants":                            null,
    "Colorimetry":                                 "https://id.loc.gov/authorities/subjects/sh85028695",
    "Colour of objects":                           null,
    "Colour vision":                               "https://id.loc.gov/authorities/subjects/sh85028654",
    "Perception of colour":                        null,
    "Influence of the colour of the light":        null,
    "Artificial daylight":                         null,
    "Lighting with respect to object illuminated": null,
    "Evaluation of light sources":                 null
  },
  "subjectVariants": {
    "Colour of Objects":    "Colour of objects",
    "Colour Vision":        "Colour vision",
    "Perception of Colour": "Perception of colour"
  }
}
```

The value of `subjects` is the `valueURI` where one exists and `null` where none does — a
`null` here means *no exact identifier exists*, and a tool must leave `valueURI` absent rather
than write an empty string. `subjectVariants` is the migration map for defect 5a.

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

**Subjects**
- DataCite `Subject` property, sub-properties and guidance —
  https://datacite-metadata-schema.readthedocs.io/en/4.7/properties/subject/
- Library of Congress Subject Headings — https://id.loc.gov/authorities/subjects/
  (SKOS and JSON-LD by content negotiation; the suggest API at
  `/authorities/subjects/suggest2?q=…` is what the mappings in section 13 were checked against)
- OECD Fields of Science and Technology — `http://www.oecd.org/science/inno/38235147.pdf` is the
  `schemeURI` DataCite's FoS convention specifies, and it **returns HTTP 410 Gone**. Cited here
  as the convention, not as a resource; use EuroSciVoc for the resolvable form
- EuroSciVoc, the European Science Vocabulary (Publications Office of the EU) —
  https://interoperable-europe.ec.europa.eu/collection/eu-semantic-interoperability-catalogue/solution/euroscivoc;
  scheme `http://data.europa.eu/8mn/euroscivoc`, concept URIs
  `http://data.europa.eu/8mn/euroscivoc/{uuid}` (content-negotiate to RDF); SKOS-XL, CC-BY 4.0,
  1 017 concepts in 6 languages, upper two levels aligned to the OECD Frascati taxonomy;
  distributions listed at https://data.europa.eu/data/datasets/euroscivoc-the-european-science-vocabulary
- PhySH, Physics Subject Headings (American Physical Society) — https://physh.org,
  licensing https://physh.org/licensing (CC0 1.0), API https://physh.org/apis. Concept
  identifiers are DOIs under prefix `10.29172` resolving to `https://physh.org/concepts/{uuid}`;
  bulk JSON-LD, Turtle, N-Triples and RDF/XML releases at https://github.com/physh-org/PhySH
  (2.8.0 measured for section 13)
- MeSH (US National Library of Medicine) — https://id.nlm.nih.gov/mesh/, descriptor URIs
  `https://id.nlm.nih.gov/mesh/D018462`; lookup API
  `https://id.nlm.nih.gov/mesh/lookup/descriptor?label=…`, RDF and SPARQL from the same host
- ICS, International Classification for Standards (ISO), 7th edition —
  https://www.iso.org/iso/international_classification_for_standards.pdf; browse a code at
  `https://www.iso.org/ics/17.180.20/x/`. Note this is a catalogue path, not a term
  identifier — use `classificationCode`, not `valueURI`
- SKOS — https://www.w3.org/TR/skos-reference/ (already listed above; the serialisation G9 asks
  for)
