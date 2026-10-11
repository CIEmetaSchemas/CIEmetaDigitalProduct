# Unit and quantity PID report

> **Status.** Unit PIDs are applied. The quantity PIDs reviewed below have been **held back**
> pending CIE agreement: the databases no longer carry `quantityPID`, and the WebTool's quantity
> vocabulary has the names with empty PIDs. This report is the basis for that discussion; the
> field names `symbol` / `symbolLatex` mentioned in older text are now `quantitySymbol` /
> `quantitySymbolLatex`.

Sanity check of `unitPID` and `quantityPID` in `CIEmetaDBdataset.json` as on branch
`feature/interop-phase2` (dataset last changed in `b7802bc feat(data): annotate DB entries with
quantityPID and unitPID (schema v4.2)`). Checked 2026-10-11. Read-only: no data was changed.

## Summary

- **Coverage.** PIDs exist only in the 39 open revisions (status *under revision*); the 39 published
  entries carry none. 402 of 402 column headers have a `unitPID`, 389 of 402 a `quantityPID`.
- **Resolution.** All 3 unit PIDs and all 13 quantity PIDs resolve. Controls behave as expected: an
  unknown BIPM unit returns HTTP 400, an unknown e-ILV term HTTP 404.
- **Consistency.** The DB vocabulary (`db.vocabularies`), `DEFAULT_UNITS` / `DEFAULT_QUANTITIES` in
  `CIEmetaDB.html` and the normative table in `v4/docs/INTEROPERABILITY.md` section 13 are identical
  (16 rows). Every unit or quantity string maps to exactly one PID.
- **Units: correct.** One spelling mismatch (`lm / W` in the data, `lm/W` in the vocabulary);
  since fixed in the open revision (#36), the published record follows when it is published.
- **Quantities: four mappings are wrong or imprecise** (luminous efficiency, chromaticity
  coordinates, spectral distribution, spectral tristimulus values), one is questionable (spectral
  sensitivity), and 13 columns have no quantity PID.
- Any change to a mapping has to be made in all three places together: DB vocabulary,
  `DEFAULT_QUANTITIES` in `CIEmetaDB.html`, and INTEROPERABILITY.md section 13.

## Method

1. Inventory of every `(unit, unitPID)` and `(quantity, quantityPID)` pair over all column headers,
   split by entry state (published / open revision).
2. Field-by-field diff of every open revision against its published parent.
3. Comparison of the data with the DB vocabulary, the tool defaults and INTEROPERABILITY.md section 13.
4. Resolution of every PID over HTTP, with a deliberately invalid identifier as a control for each
   service.
5. For units: the decomposition returned by the BIPM SI Digital Framework. For quantities: the term
   name and definition on the CIE e-ILV page, compared with the label in the data and with what the
   columns actually contain.

## Units

| `unit` in data | `unitPID` | BIPM SI Digital Framework says | Columns | Verdict |
|---|---|---|---:|---|
| `nm` | https://si-digital-framework.org/SI/units/nanometre | prefix nano (n) x metre (m), 1 nm = 10^-9 m | 38 | Correct |
| `dimensionless` | https://si-digital-framework.org/SI/units/one | unit *one*, symbol 1 | 363 | Correct |
| `lm / W` | https://si-digital-framework.org/SI/units/lumen.watt-1 | lumen (lm) x watt (W)^-1 | 1 | Correct; but the vocabulary key is `lm/W` (no spaces), so the string in the data does not match the vocabulary entry. Fixed in the open revision (#36) |

## Quantities: e-ILV terms behind the PIDs

| `quantityPID` | Label in data | e-ILV term (and definition, abridged) |
|---|---|---|
| 17-21-025 | wavelength | *wavelength* λ: distance in the direction of propagation of a periodic wave between two successive positions at which the phase is the same |
| 17-21-029 | spectral distribution | *spectral distribution*, *spectral concentration* X_λ: density of a radiant, luminous or photon quantity with respect to wavelength |
| 17-21-035 | spectral luminous efficiency | *spectral luminous efficiency* V(λ), V'(λ), V_mes;m(λ), V_10(λ), V_M(λ) |
| 17-21-092 | maximum luminous efficacy | *maximum luminous efficacy* K_m, K_m,mes;m, ...: maximum value of spectral luminous efficacy |
| 17-21-094 | luminous efficiency | *luminous efficiency* V, V', V_mes;m: quotient of radiant flux weighted by the spectral luminous efficiency and the corresponding radiant flux (a single value, not a function of λ) |
| 17-23-038 | spectral tristimulus values | *tristimulus values* (of a colour stimulus): amounts of the reference colour stimuli required to match the stimulus |
| 17-23-039 | colour-matching function | *colour-matching functions* (of a trichromatic system): tristimulus values of monochromatic stimuli of equal radiant flux |
| 17-23-053 | chromaticity coordinates | *chromaticity coordinates*: quotients of each of three tristimulus values and their sum |
| 17-24-075 | spectral radiance factor | *radiance factor* β_e, β (not spectral) |
| 17-25-063 | spectral sensitivity | *spectral responsivity* (of a detector) s(λ) |
| 17-26-027 | action spectra | *action spectrum*, *spectral weighting function*: relative spectral effectiveness of optical radiation for a specified biological effect |
| 17-23-047 | CIE colour-matching functions (vocabulary only, unused) | *CIE colour-matching functions*: functions in the CIE 1931 or CIE 1964 standard colorimetric system |
| 17-23-055 | spectral chromaticity coordinates (vocabulary only, unused) | *spectral chromaticity coordinates* r(λ), g(λ), b(λ), x(λ), y(λ), z(λ), x_10(λ), y_10(λ), z_10(λ): chromaticity coordinates of monochromatic stimuli |

Closer e-ILV terms found while checking, not currently in the vocabulary:

| e-ILV | Term | Relevant for |
|---|---|---|
| 17-21-030 | *relative spectral distribution* S(λ): quotient of a spectral distribution and a fixed reference value | relative spectral power distributions with unit *one* |
| 17-24-076 | *total spectral radiance factor* β_T(λ) = β_R(λ) + β_L(λ) | only if the data include a luminescent part |
| 17-25-064 | *relative spectral responsivity* (of a detector) s_r(λ) | normalised spectral sensitivities |

No e-ILV term for *cone fundamentals* was found. The e-ILV site search ignored the query, so this
was checked by probing neighbouring term numbers only, not exhaustively.

## Quantities: wrong or imprecise PIDs, by dataset

| Label -> PID used | DOI | Dataset | Cols | Verdict |
|---|---|---|---:|---|
| **luminous efficiency** -> 17-21-094 *luminous efficiency* | 10.25039/CIE.DS.pyqkh5rw | CIE cone-fundamental-based spectral luminous efficiency function for 2° field size in terms of energy | 1 | **Wrong**: spectral function; use 17-21-035 *spectral luminous efficiency* |
| | 10.25039/CIE.DS.8mrru44q | CIE cone-fundamental-based spectral luminous efficiency function for 10° field size in terms of energy | 1 | **Wrong**: use 17-21-035 |
| **chromaticity coordinates** -> 17-23-053 *chromaticity coordinates* | 10.25039/CIE.DS.mifmy4x4 | CIE 1931 chromaticity coordinates of spectrum loci, 2 degree observer | 3 | Imprecise: 17-23-055 *spectral chromaticity coordinates* names x(λ), y(λ), z(λ) |
| | 10.25039/CIE.DS.qnm382a6 | CIE 1964 chromaticity coordinates of spectrum loci, 10 degree observer | 3 | Imprecise: 17-23-055 |
| | 10.25039/CIE.DS.qhaz5si9 | CIE spectral MacLeod-Boynton chromaticity coordinates for 2° field size | 3 | Neither 17-23-053 nor 17-23-055 fits exactly (MacLeod-Boynton coordinates are not quotients by the sum of three tristimulus values); editorial decision |
| **spectral distribution** -> 17-21-029 *spectral distribution* X_λ (has physical units), while the data's unit is *one* | 10.25039/CIE.DS.van56dfj | CIE reference spectrum L41 | 1 | Clashes with unit *one*: use 17-21-030 *relative spectral distribution* |
| | 10.25039/CIE.DS.mjdd2enu | Relative spectral power distributions of CIE illuminant C | 1 | 17-21-030 |
| | 10.25039/CIE.DS.qewfb3kp | Relative spectral power distributions of CIE illuminant D55 | 1 | 17-21-030 |
| | 10.25039/CIE.DS.9fvcmrk4 | Relative spectral power distributions of CIE illuminant D75 | 1 | 17-21-030 |
| | 10.25039/CIE.DS.ukaymjdn | Relative spectral power distributions of illuminants representing typical fluorescent lamps | 27 | 17-21-030 |
| | 10.25039/CIE.DS.54hy6srn | Relative spectral power distributions of illuminants representing typical fluorescent lamps, 1nm wavelength steps | 27 | 17-21-030 |
| | 10.25039/CIE.DS.f6rvvnev | Relative spectral power distributions of high pressure discharge lamp illuminants | 5 | 17-21-030 |
| | 10.25039/CIE.DS.r4gcnrzc | CIE indoor daylight illuminant ID50 | 1 | 17-21-030 |
| | 10.25039/CIE.DS.bd53qdqk | CIE indoor daylight illuminant ID65 | 1 | 17-21-030 |
| | 10.25039/CIE.DS.vgssnyfg | Relative spectral power distributions of illuminants representing typical LED lamps | 9 | 17-21-030 |
| | 10.25039/CIE.DS.dhcw57sd | Relative spectral power distributions of illuminants representing typical LED lamps, 1nm spacing | 9 | 17-21-030 |
| | 10.25039/CIE.DS.8jsxjrsn | CIE standard illuminant A - 1 nm | 1 | 17-21-030 |
| | 10.25039/CIE.DS.etgmuqt5 | CIE standard illuminant D50 | 1 | 17-21-030 |
| | 10.25039/CIE.DS.hjfjmt59 | CIE standard illuminant D65 | 1 | 17-21-030 |
| **spectral tristimulus values** -> 17-23-038 *tristimulus values* | 10.25039/CIE.DS.548rw69q | CIE cone-fundamental-based spectral tristimulus values for 2°field size | 3 | Imprecise: by definition these are 17-23-039 *colour-matching functions* (tristimulus values of monochromatic stimuli) |
| | 10.25039/CIE.DS.dm6qiig7 | CIE cone-fundamental-based spectral tristimulus values for 10°field size | 3 | Imprecise: 17-23-039 |
| **spectral sensitivity** -> 17-25-063 *spectral responsivity* (in the vocabulary, but not applied to these columns) | 10.25039/CIE.DS.tijidesg | CIE 2006 LMS cone fundamentals for 2° field size in terms of energy | 3 | No PID set. If one is added, 17-25-064 *relative spectral responsivity* is closer; otherwise leave empty |
| | 10.25039/CIE.DS.nxsqeri8 | CIE 2006 LMS cone fundamentals for 10° field size in terms of energy | 3 | Same |
| **colour-matching function** -> 17-23-039 *colour-matching functions* | 10.25039/CIE.DS.xvudnb9b | Colour-matching functions of CIE 1931 standard colorimetric observer | 3 | OK; 17-23-047 *CIE colour-matching functions* would be more specific |
| | 10.25039/CIE.DS.sqksu2n5 | CIE 1964 colour-matching functions , 10 degree observer | 3 | OK; 17-23-047 more specific |
| **spectral radiance factor** -> 17-24-075 *radiance factor* (not spectral) | 10.25039/CIE.DS.yzfhz3cm | Spectral radiance factors for the 15 test-colour samples in CQS 9.0, 5nm wavelength steps | 15 | Acceptable approximation; e-ILV has no plain spectral term |
| | 10.25039/CIE.DS.vkss79ef | Spectral radiance factors of each colour (RYGB) of the four-colour combination, 5nm wavelength steps | 4 | Acceptable |
| | 10.25039/CIE.DS.7chm7z5h | Spectral radiance factors of test-colour sample #15 of the Japanese skin complexion, 5nm wavelength steps | 1 | Acceptable |
| | 10.25039/CIE.DS.wi5idbqu | Spectral radiance factors of 99 test samples for the CIE colour fidelity index calculation | 99 | Acceptable |
| | 10.25039/CIE.DS.8svs5rqd | Spectral radiance factors of 99 test samples for the CIE colour fidelity index calculation, 1nm wavelength steps | 99 | Acceptable |
| | 10.25039/CIE.DS.wuiuu9cz | Spectral radiance factors of 14 test samples for the CIE colour rendering index calculation | 14 | Acceptable |

## Quantities: correct PIDs, by dataset

| Label -> PID used | DOI | Dataset | Cols |
|---|---|---|---:|
| **spectral luminous efficiency** -> 17-21-035 | 10.25039/CIE.DS.dktna2s3 | CIE spectral luminous efficiency for photopic vision | 1 |
| | 10.25039/CIE.DS.gr6w4b5g | CIE spectral luminous efficiency for scotopic vision | 1 |
| | 10.25039/CIE.DS.bfn2eqci | CIE spectral luminous efficiency for 10° photopic vision | 1 |
| | 10.25039/CIE.DS.h3bbk2vb | CIE spectral luminous efficiency for mesopic vision at adaptation coeffiecent m = 0.8 | 1 |
| **maximum luminous efficacy** -> 17-21-092 (unit lm·W^-1, consistent) | 10.25039/CIE.DS.wh6zmd7r | CIE maximum luminous efficacy for mesopic vision at varied adaptation coefficient values | 1 |
| **action spectra** -> 17-26-027 | 10.25039/CIE.DS.vqqhzp5a | CIE alpha-opic action spectra | 5 |
| **wavelength** -> 17-21-025 (unit nm, consistent) | all 38 wavelength-based datasets | column 1 of each | 38 |

## Columns without a quantity PID (13)

| Reason | DOI | Dataset | Cols | Suggestion |
|---|---|---|---:|---|
| No `quantity` set | 10.25039/CIE.DS.w7zunnny | Components of the relative spectral distribution of daylight used in the calculation of relative spectral power distributions of CIE daylight illuminants of different correlated colour temperatures | 3 (S_0, S_1, S_2) | *relative spectral distribution* 17-21-030 |
| No `quantity` set | 10.25039/CIE.DS.caky9gj2 | Values of the first deviation function used in the calculation of the CIE special metamerism index for a change in observer | 3 (Δx̄, Δȳ, Δz̄) | No matching e-ILV term found |
| Vocabulary PID not applied | 10.25039/CIE.DS.tijidesg | CIE 2006 LMS cone fundamentals for 2° field size in terms of energy | 3 | See *spectral sensitivity* above |
| Vocabulary PID not applied | 10.25039/CIE.DS.nxsqeri8 | CIE 2006 LMS cone fundamentals for 10° field size in terms of energy | 3 | See *spectral sensitivity* above |
| No e-ILV term (documented in INTEROPERABILITY.md) | 10.25039/CIE.DS.wh6zmd7r | CIE maximum luminous efficacy for mesopic vision at varied adaptation coefficient values | 1 (m) | Leave empty |

## Other observations

- **The PID revisions are not PID-only.** Besides adding `unitPID` / `quantityPID`, they change the
  column-1 `quantity` of `CIE_illum_D55.csv` (10.25039/CIE.DS.qewfb3kp) and `CIE_illum_D75.csv`
  (10.25039/CIE.DS.9fvcmrk4) from blank (two spaces) to `wavelength`. The change is correct, but it
  belongs in the revision note.
- **Label wording.** Labels are plural or singular where the e-ILV term is not: `action spectra`
  (term: *action spectrum*), `colour-matching function` (term: *colour-matching functions*).
  Cosmetic only.
- **Dataset title typos** (seen while compiling the tables): "adaptation coeffiecent"
  (10.25039/CIE.DS.h3bbk2vb) and a stray space in "colour-matching functions , 10 degree"
  (10.25039/CIE.DS.sqksu2n5).

## Sources

- BIPM SI Digital Framework, SI units: https://si-digital-framework.org/SI/units
- CIE e-ILV term pages: `https://cie.co.at/eilvterm/<term number>`
- Normative mapping: `v4/docs/INTEROPERABILITY.md`, section 13 (branch `feature/interop-phase2`)
