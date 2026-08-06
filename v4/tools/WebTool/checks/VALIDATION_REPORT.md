# Validation report — published CIE data tables

Generated 2026-08-06T10:02:51Z by `validate_published.js` over `published/`.

Every CSV in `published/<title>/` checked against the latest metadata revision beside it (`*_metadata_v2.json` where present, else `*_metadata.json`), using the algorithms lifted verbatim from `CIEmetaDB.html`. Checksums are taken over the raw file bytes; column sums are compared exactly, the stored decimal against the exact BigInt sum rounded to the stored number of decimal places — not to a tolerance.

**39/39 passed, 0 failed.** Warnings do not fail a dataset, matching the tool.

## Summary

| # | Data table | Metadata used | Rev | Rows | Cols | Verdict | Fail | Warn | Not checked |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `CIE_cc_1931_2deg.csv` | `CIE_cc_1931_2deg.csv_metadata.json` | — | 471 | 4 | PASS |  |  | 2 |
| 2 | `CIE_cc_1964_10deg.csv` | `CIE_cc_1964_10deg.csv_metadata_v2.json` | 2 | 471 | 4 | PASS |  |  | 2 |
| 3 | `CIE_xyz_1964_10deg.csv` | `CIE_xyz_1964_10deg.csv_metadata.json` | — | 471 | 4 | PASS |  |  | 2 |
| 4 | `CIE_lms_cf_10deg.csv` | `CIE_lms_cf_10deg.csv_metadata_v2.json` | 2 | 89 | 4 | PASS |  |  | 2 |
| 5 | `CIE_lms_cf_2deg.csv` | `CIE_lms_cf_2deg.csv_metadata.json` | — | 89 | 4 | PASS |  |  | 2 |
| 6 | `CIE_a-opic_action_spectra.csv` | `CIE_a-opic_action_spectra.csv_metadata.json` | — | 401 | 6 | PASS |  |  | 2 |
| 7 | `CIE_cfb_sle_10deg.csv` | `CIE_cfb_sle_10deg.csv_metadata.json` | — | 441 | 2 | PASS |  |  | 2 |
| 8 | `CIE_cfb_sle_2deg.csv` | `CIE_cfb_sle_2deg.csv_metadata_v2.json` | 2 | 441 | 2 | PASS |  |  | 2 |
| 9 | `CIE_cfb_stv_10deg.csv` | `CIE_cfb_stv_10deg.csv_metadata.json` | — | 441 | 4 | PASS |  |  | 2 |
| 10 | `CIE_cfb_stv_2deg.csv` | `CIE_cfb_stv_2deg.csv_metadata.json` | — | 441 | 4 | PASS |  |  | 2 |
| 11 | `CIE_illum_ID50.csv` | `CIE_illum_ID50.csv_metadata.json` | — | 97 | 2 | PASS |  |  | 2 |
| 12 | `CIE_illum_ID65.csv` | `CIE_illum_ID65.csv_metadata_v2.json` | — | 97 | 2 | PASS |  |  | 2 |
| 13 | `CIE_max_sle_mesopic.csv` | `CIE_max_sle_mesopic.csv_metadata.json` | — | 11 | 2 | PASS |  |  | 4 |
| 14 | `CIE_RefSpectrum_L41.csv` | `CIE_RefSpectrum_L41.csv_metadata_v2.json` | — | 471 | 2 | PASS |  |  | 2 |
| 15 | `CIE_smb_cc_2deg.csv` | `CIE_smb_cc_2deg.csv_metadata_v2.json` | 2 | 89 | 4 | PASS |  |  | 2 |
| 16 | `CIE_sle_10deg.csv` | `CIE_sle_10deg.csv_metadata_v2.json` | 2 | 471 | 2 | PASS |  |  | 2 |
| 17 | `CIE_sle_mesopic_m_0.8.csv` | `CIE_sle_mesopic_m_0.8.csv_metadata_v2.json` | 2 | 471 | 2 | PASS |  |  | 2 |
| 18 | `CIE_sle_photopic.csv` | `CIE_sle_photopic.csv_metadata.json` | — | 471 | 2 | PASS |  |  | 2 |
| 19 | `CIE_sle_scotopic.csv` | `CIE_sle_scotopic.csv_metadata.json` | — | 401 | 2 | PASS |  |  | 2 |
| 20 | `CIE_std_illum_A_1nm.csv` | `CIE_std_illum_A_1nm.csv_metadata_v2.json` | 2 | 531 | 2 | PASS |  |  | 2 |
| 21 | `CIE_std_illum_D50.csv` | `CIE_std_illum_D50.csv_metadata.json` | — | 531 | 2 | PASS |  |  | 2 |
| 22 | `CIE_std_illum_D65.csv` | `CIE_std_illum_D65.csv_metadata_v2.json` | 2 | 531 | 2 | PASS |  |  | 2 |
| 23 | `CIE_xyz_1931_2deg.csv` | `CIE_xyz_1931_2deg.csv_metadata.json` | — | 471 | 4 | PASS |  |  | 2 |
| 24 | `CIE_illum_Dxx_comp.csv` | `CIE_illum_Dxx_comp.csv_metadata_v2.json` | 2 | 107 | 4 | PASS |  |  | 2 |
| 25 | `CIE_illum_C.csv` | `CIE_illum_C.csv_metadata_v2.json` | — | 97 | 2 | PASS |  |  | 2 |
| 26 | `CIE_illum_D55.csv` | `CIE_illum_D55.csv_metadata.json` | — | 97 | 2 | PASS |  |  | 2 |
| 27 | `CIE_illum_D75.csv` | `CIE_illum_D75.csv_metadata_v2.json` | — | 97 | 2 | PASS |  |  | 2 |
| 28 | `CIE_illum_HPs.csv` | `CIE_illum_HPs.csv_metadata_v2.json` | — | 81 | 6 | PASS |  |  | 2 |
| 29 | `CIE_illum_LEDs.csv` | `CIE_illum_LEDs.csv_metadata_v2.json` | — | 81 | 10 | PASS |  |  | 2 |
| 30 | `CIE_illum_LEDs_1nm.csv` | `CIE_illum_LEDs_1nm.csv_metadata.json` | — | 401 | 10 | PASS |  |  | 2 |
| 31 | `CIE_illum_FLs.csv` | `CIE_illum_FLs.csv_metadata.json` | — | 81 | 28 | PASS |  |  | 1 |
| 32 | `CIE_illum_FLs_1nm.csv` | `CIE_illum_FLs_1nm.csv_metadata.json` | — | 401 | 28 | PASS |  |  | 1 |
| 33 | `CIE_srf_CQS_5nm.csv` | `CIE_srf_CQS_5nm.csv_metadata_v2.json` | 2 | 81 | 16 | PASS |  |  | 2 |
| 34 | `CIE_srf_cri.csv` | `CIE_srf_cri.csv_metadata_v2.json` | — | 95 | 15 | PASS |  |  | 1 |
| 35 | `CIE_srf_cfi.csv` | `CIE_srf_cfi.csv_metadata_v2.json` | — | 81 | 100 | PASS |  |  | 1 |
| 36 | `CIE_srf_cfi_1nm.csv` | `CIE_srf_cfi_1nm.csv_metadata_v2.json` | — | 401 | 100 | PASS |  |  | 1 |
| 37 | `CIE_srf_FCI_5nm.csv` | `CIE_srf_FCI_5nm.csv_metadata_v2.json` | 2 | 81 | 5 | PASS |  |  | 2 |
| 38 | `CIE_srf_PS_5nm.csv` | `CIE_srf_PS_5nm.csv_metadata_v2.json` | 2 | 81 | 2 | PASS |  |  | 2 |
| 39 | `CIE_1st_deriv_meta_ind.csv` | `CIE_1st_deriv_meta_ind.csv_metadata_v2.json` | — | 81 | 4 | PASS |  |  | 2 |

## Datasets

### ✓ CIE 1931 chromaticity coordinates of spectrum loci, 2 degree  observer

- folder: `CIE 1931 chromaticity coordinates of spectrum loci, 2 degree  observer`
- data table: `CIE_cc_1931_2deg.csv` — 471 rows × 4 columns
- metadata: `CIE_cc_1931_2deg.csv_metadata.json`
- md5: `3425c45ef187eaedcb14081e3f8b320a`
- sha256: `5a3f0582ea0907867c7a2718051bbdc04f39e758d8c09e628930efc62386e399`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[90]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE 1964 chromaticity coordinates of spectrum loci, 10 degree  observer

- folder: `CIE 1964 chromaticity coordinates of spectrum loci, 10 degree  observer`
- data table: `CIE_cc_1964_10deg.csv` — 471 rows × 4 columns
- metadata: `CIE_cc_1964_10deg.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_cc_1964_10deg.csv_metadata.json`
- md5: `87f745ef28af679a2b61adfdc53432aa`
- sha256: `7485d416ac4d6c30269b4267d739aec208d9110a94711537b95c48716890e98c`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE 1964 colour-matching functions , 10 degree  observer

- folder: `CIE 1964 colour-matching functions , 10 degree  observer`
- data table: `CIE_xyz_1964_10deg.csv` — 471 rows × 4 columns
- metadata: `CIE_xyz_1964_10deg.csv_metadata.json`
- md5: `6140e032f9326d88c5a0959b29b4d8f3`
- sha256: `1b27fd4e8ca1167b47c3a6aee3aafe56abc57eae51fa20032cb83704224a27dc`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE 2006 LMS cone fundamentals for 10° field size in terms of energy

- folder: `CIE 2006 LMS cone fundamentals for 10° field size in terms of energy`
- data table: `CIE_lms_cf_10deg.csv` — 89 rows × 4 columns
- metadata: `CIE_lms_cf_10deg.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_lms_cf_10deg.csv_metadata.json`
- md5: `c2e606fddac441d032c389317e6de80b`
- sha256: `bd64f1f688a4b319c6d3fa6b31770a32eaaaaea0eed532befd0424f96304db18`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[32]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE 2006 LMS cone fundamentals for 2° field size in terms of energy

- folder: `CIE 2006 LMS cone fundamentals for 2° field size in terms of energy`
- data table: `CIE_lms_cf_2deg.csv` — 89 rows × 4 columns
- metadata: `CIE_lms_cf_2deg.csv_metadata.json`
- md5: `dba2e9d1f5e6667575aa069832159510`
- sha256: `f48160edf11c1a121aaaf41d4c3b7513385bfc9c60d726b88e735519f6d37b1f`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[32]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE alpha-opic action spectra

- folder: `CIE alpha-opic action spectra`
- data table: `CIE_a-opic_action_spectra.csv` — 401 rows × 6 columns
- metadata: `CIE_a-opic_action_spectra.csv_metadata.json`
- md5: `f1ddfef144176812c3cb9d8fba1f3141`
- sha256: `d69ff61bd49d63f530b4fcc7be9ba2db37bf31cba1bb50a8e87c1bc86f725250`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE cone-fundamental-based spectral luminous efficiency function for 10° field size in terms of energy

- folder: `CIE cone-fundamental-based spectral luminous efficiency function for 10° field size in terms of energy`
- data table: `CIE_cfb_sle_10deg.csv` — 441 rows × 2 columns
- metadata: `CIE_cfb_sle_10deg.csv_metadata.json`
- md5: `fc74cff7513220a50262438a0c26b949`
- sha256: `1e33a20440d8118531dec957ec2d95be87ce9002be694301aa075ef7ea36781c`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE cone-fundamental-based spectral luminous efficiency function for 2° field size in terms of energy

- folder: `CIE cone-fundamental-based spectral luminous efficiency function for 2° field size in terms of energy`
- data table: `CIE_cfb_sle_2deg.csv` — 441 rows × 2 columns
- metadata: `CIE_cfb_sle_2deg.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_cfb_sle_2deg.csv_metadata.json`
- md5: `8e01f4ab6639ee85523ee102970a53df`
- sha256: `e2a07b2bbab0dc800b35d2b070e79b87674740bd8c4ceb53ae78c6053c0e2316`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE cone-fundamental-based spectral tristimulus values for 10°field size

- folder: `CIE cone-fundamental-based spectral tristimulus values for 10°field size`
- data table: `CIE_cfb_stv_10deg.csv` — 441 rows × 4 columns
- metadata: `CIE_cfb_stv_10deg.csv_metadata.json`
- md5: `c8504e70d7f4760253a0a4d3a42b7d20`
- sha256: `9019a35f8f51215e245f818e87d4251147d1925a8fbe9a49944fe7f011f16e38`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE cone-fundamental-based spectral tristimulus values for 2°field size

- folder: `CIE cone-fundamental-based spectral tristimulus values for 2°field size`
- data table: `CIE_cfb_stv_2deg.csv` — 441 rows × 4 columns
- metadata: `CIE_cfb_stv_2deg.csv_metadata.json`
- md5: `472cc50b14a6cf41ba9f08f8935aedc8`
- sha256: `a10751ec8aecdb023f16ba079557e7fb794806884fe3da982dd63da285f872a9`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE indoor daylight illuminant ID50

- folder: `CIE indoor daylight illuminant ID50`
- data table: `CIE_illum_ID50.csv` — 97 rows × 2 columns
- metadata: `CIE_illum_ID50.csv_metadata.json`
- md5: `fed40bf7ffc86b054b497f645d9f8fc3`
- sha256: `70541ed195eb91066d3a986d8d5cdd3cbfb2ab963f713022d2a88dfd59b849e2`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[14]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE indoor daylight illuminant ID65

- folder: `CIE indoor daylight illuminant ID65`
- data table: `CIE_illum_ID65.csv` — 97 rows × 2 columns
- metadata: `CIE_illum_ID65.csv_metadata_v2.json`
- md5: `c8843fdca93e747c8a3590cd74b01cfd`
- sha256: `be1dc615b4b03e0b4b3e294660101526a30ed17dc800e85786c29759b3dcb7a6`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[14]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE maximum luminous efficacy for mesopic vision at varied adaptation coefficient values

- folder: `CIE maximum luminous efficacy for mesopic vision at varied adaptation coefficient values`
- data table: `CIE_max_sle_mesopic.csv` — 11 rows × 2 columns
- metadata: `CIE_max_sle_mesopic.csv_metadata.json`
- md5: `9eec2066078327b2f714551799727699`
- sha256: `c1baf8381cd16332749afdf2171d2db61197e5246a4184a79556a746da717c25`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[4]: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`, `wavelength_first`, `wavelength_last`.

### ✓ CIE reference spectrum L41

- folder: `CIE reference spectrum L41`
- data table: `CIE_RefSpectrum_L41.csv` — 471 rows × 2 columns
- metadata: `CIE_RefSpectrum_L41.csv_metadata_v2.json`
- md5: `01dba8b4ebdbd2a3ebb9fa6cc8719939`
- sha256: `23e07c6b8a2f5273f9e3abb3c64a374f3456eee0a70dd447fdb14c617f55224e`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[13]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE spectral MacLeod-Boynton chromaticity coordinates for 2° field size

- folder: `CIE spectral MacLeod-Boynton chromaticity coordinates for 2° field size`
- data table: `CIE_smb_cc_2deg.csv` — 89 rows × 4 columns
- metadata: `CIE_smb_cc_2deg.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_smb_cc_2deg.csv_metadata.json`
- md5: `b608343496f5e03d711f436d063b11ce`
- sha256: `570a53ce67409cd698530acf9dc14bb6aa91f51b94dd9544e8aaf224895c141b`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[19]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE spectral luminous efficiency for 10° photopic vision

- folder: `CIE spectral luminous efficiency for 10° photopic vision`
- data table: `CIE_sle_10deg.csv` — 471 rows × 2 columns
- metadata: `CIE_sle_10deg.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_sle_10deg.csv_metadata.json`
- md5: `b702e2c81f87115f151e9e0603925834`
- sha256: `e67e0c48406bdb6cef7ce03c42bd66f9dfc8601fb0a60837f8971973d4b960c9`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE spectral luminous efficiency for mesopic vision at adaptation coeffiecent m = 0.8

- folder: `CIE spectral luminous efficiency for mesopic vision at adaptation coeffiecent m = 0.8`
- data table: `CIE_sle_mesopic_m_0.8.csv` — 471 rows × 2 columns
- metadata: `CIE_sle_mesopic_m_0.8.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_sle_mesopic_m_0.8.csv_metadata.json`
- md5: `1334d87f46b11922eaaf655530787abf`
- sha256: `fa643111e81c16661cb7c2d30b9dca6d71ef1c3a4b602a82110a1e3f4aa1f8cd`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE spectral luminous efficiency for photopic vision

- folder: `CIE spectral luminous efficiency for photopic vision`
- data table: `CIE_sle_photopic.csv` — 471 rows × 2 columns
- metadata: `CIE_sle_photopic.csv_metadata.json`
- md5: `f389958555461a7d9a7562145e8ca9c0`
- sha256: `ee5d5d17922ae645d4af52cacf6a50bdb9385749f9d2181ca312eb2b08febac2`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE spectral luminous efficiency for scotopic vision

- folder: `CIE spectral luminous efficiency for scotopic vision`
- data table: `CIE_sle_scotopic.csv` — 401 rows × 2 columns
- metadata: `CIE_sle_scotopic.csv_metadata.json`
- md5: `3e45714a429d02e5d1f2a752226d7698`
- sha256: `6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[80]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE standard illuminant A - 1 nm

- folder: `CIE standard illuminant A - 1 nm`
- data table: `CIE_std_illum_A_1nm.csv` — 531 rows × 2 columns
- metadata: `CIE_std_illum_A_1nm.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_std_illum_A_1nm.csv_metadata.json`
- md5: `ed0e4effb55d82b950c0912b6278a9d1`
- sha256: `61ef23fe146b8b665c74706717ab28cec7db6c9022993490bdc71991f43cb59b`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE standard illuminant D50

- folder: `CIE standard illuminant D50`
- data table: `CIE_std_illum_D50.csv` — 531 rows × 2 columns
- metadata: `CIE_std_illum_D50.csv_metadata.json`
- md5: `e72757c3078b58e78ba63051be4b27b0`
- sha256: `b23049c6f7b266c1c1fbe147aa271e8930ca02d6e569c5ae1804c036faea4193`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ CIE standard illuminant D65

- folder: `CIE standard illuminant D65`
- data table: `CIE_std_illum_D65.csv` — 531 rows × 2 columns
- metadata: `CIE_std_illum_D65.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_std_illum_D65.csv_metadata.json`
- md5: `03d4eb9b837c60671627c946fb534deb`
- sha256: `e76f210bffff3d552ef7113025da5f325d5dfec200dd4b878b1a2f3a507032cb`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Colour-matching functions of CIE 1931 standard colorimetric observer

- folder: `Colour-matching functions of CIE 1931 standard colorimetric observer`
- data table: `CIE_xyz_1931_2deg.csv` — 471 rows × 4 columns
- metadata: `CIE_xyz_1931_2deg.csv_metadata.json`
- md5: `17cca777db64b17170f06f67ce9d3ab7`
- sha256: `fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Components of the relative spectral distribution of daylight used in the calculation of relative spectral power distributions of CIE daylight illuminants of different correlated colour temperatures

- folder: `Components of the relative spectral distribution of daylight used in the calculation of relative spectral power distributions of CIE daylight illuminants of different correlated colour temperatures`
- data table: `CIE_illum_Dxx_comp.csv` — 107 rows × 4 columns
- metadata: `CIE_illum_Dxx_comp.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_illum_Dxx_comp.csv_metadata.json`
- md5: `3068737bc5e8561bd8b3ef9639578d18`
- sha256: `4056cf7c1afb23fb8820ff9cbc383a80005acdffe1c0a6945c6032616e08c6be`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[30]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Relative spectral power distributions of CIE illuminant C

- folder: `Relative spectral power distributions of CIE illuminant C`
- data table: `CIE_illum_C.csv` — 97 rows × 2 columns
- metadata: `CIE_illum_C.csv_metadata_v2.json`
- md5: `bb325f040bab332d91f8d9447aa47b78`
- sha256: `51c53bf065345fc1fb9d50aff40fb0a2ce370bcf35121a3dc4bafc0888602f0b`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[30]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Relative spectral power distributions of CIE illuminant D55

- folder: `Relative spectral power distributions of CIE illuminant D55`
- data table: `CIE_illum_D55.csv` — 97 rows × 2 columns
- metadata: `CIE_illum_D55.csv_metadata.json`
- md5: `8b5678358f265567a0759b9800f17d7f`
- sha256: `3e5aa1a8d5514df1928effef1615ab90e16c9a368ccfe513372cd8556c37bf4b`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[26]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Relative spectral power distributions of CIE illuminant D75

- folder: `Relative spectral power distributions of CIE illuminant D75`
- data table: `CIE_illum_D75.csv` — 97 rows × 2 columns
- metadata: `CIE_illum_D75.csv_metadata_v2.json`
- md5: `fc2ae36ece39ad1729696ab2833bd013`
- sha256: `573a08831f2bcdf18a8e333490049e6d0fabaf1d1c0abbc2a49d6247a939b62d`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[26]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Relative spectral power distributions of high pressure discharge lamp illuminants

- folder: `Relative spectral power distributions of high pressure discharge lamp illuminants`
- data table: `CIE_illum_HPs.csv` — 81 rows × 6 columns
- metadata: `CIE_illum_HPs.csv_metadata_v2.json`
- md5: `423e996fd3ee17eaf783633e4fd2f62c`
- sha256: `035e09d62b27f4b1e362ff1ba99a50235f0d7886c2781c50d49851b6e4bb4552`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[29]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Relative spectral power distributions of illuminants representing typical LED lamps

- folder: `Relative spectral power distributions of illuminants representing typical LED lamps`
- data table: `CIE_illum_LEDs.csv` — 81 rows × 10 columns
- metadata: `CIE_illum_LEDs.csv_metadata_v2.json`
- md5: `91a73557fe319a085dd598ce96fa8ace`
- sha256: `6147313bd1ec570ef308df222e1fe1e58115fde1ad0a7d4ba91fb9dcb776b267`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[29]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Relative spectral power distributions of illuminants representing typical LED lamps, 1nm spacing

- folder: `Relative spectral power distributions of illuminants representing typical LED lamps, 1nm spacing`
- data table: `CIE_illum_LEDs_1nm.csv` — 401 rows × 10 columns
- metadata: `CIE_illum_LEDs_1nm.csv_metadata.json`
- md5: `99d1bc3974902d5e02e4c3fe539bea3d`
- sha256: `2a065526e1502f138d5b96aa8c9b337320e08667aac028ab5ad428bf1179a4b7`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[120]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Relative spectral power distributions of illuminants representing typical fluorescent lamps

- folder: `Relative spectral power distributions of illuminants representing typical fluorescent lamps`
- data table: `CIE_illum_FLs.csv` — 81 rows × 28 columns
- metadata: `CIE_illum_FLs.csv_metadata.json`
- md5: `441613e501ab0a58e62f2669ff005db7`
- sha256: `24303adacbfee5e19b2123ea2c3208a993577a054abaf55ea7e19517f98e4d55`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ numberOfColumns: match
- ✓ sumOfColumns: match
- ✓ sampleRow[14]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`.

### ✓ Relative spectral power distributions of illuminants representing typical fluorescent lamps, 1nm wavelength steps

- folder: `Relative spectral power distributions of illuminants representing typical fluorescent lamps, 1nm wavelength steps`
- data table: `CIE_illum_FLs_1nm.csv` — 401 rows × 28 columns
- metadata: `CIE_illum_FLs_1nm.csv_metadata.json`
- md5: `77df774b47c2de724211d5f26592759e`
- sha256: `929ee966bf465fca2073ada8965afbc332d163f6f2cb54c710a6e193251ab0cc`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ numberOfColumns: match
- ✓ sumOfColumns: match
- ✓ sampleRow[101]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`.

### ✓ Spectral radiance factors for the 15 test-colour samples in CQS 9.0, 5nm wavelength steps

- folder: `Spectral radiance factors for the 15 test-colour samples in CQS 9.0, 5nm wavelength steps`
- data table: `CIE_srf_CQS_5nm.csv` — 81 rows × 16 columns
- metadata: `CIE_srf_CQS_5nm.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_srf_CQS_5nm.csv_metadata.json`
- md5: `c4ba3c6c293bc099eee9ab9e26d2a2a9`
- sha256: `ea607d6f7a93f4d18bb051eefc68ae2f4bbc948bb92526f5bf0624284047e18c`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[13]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Spectral radiance factors of 14 test samples for the CIE colour rendering index calculation

- folder: `Spectral radiance factors of 14 test samples for the CIE colour rendering index calculation`
- data table: `CIE_srf_cri.csv` — 95 rows × 15 columns
- metadata: `CIE_srf_cri.csv_metadata_v2.json`
- md5: `6ad6522831a844edb8484e884d05c9e9`
- sha256: `f461decedb5c18800c61a6923240c71f6cf91fd23ac94865133cbfdb7e05c0ad`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ numberOfColumns: match
- ✓ sumOfColumns: match
- ✓ sampleRow[24]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`.

### ✓ Spectral radiance factors of 99 test samples for the CIE colour fidelity index calculation

- folder: `Spectral radiance factors of 99 test samples for the CIE colour fidelity index calculation`
- data table: `CIE_srf_cfi.csv` — 81 rows × 100 columns
- metadata: `CIE_srf_cfi.csv_metadata_v2.json`
- md5: `11ef0bcbfaea43f1143ac40fbf52d7ff`
- sha256: `eb1d04a0d489918970f32354c2261581e9f9ba59456e0feae7227c7b5413aa3b`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ numberOfColumns: match
- ✓ sumOfColumns: match
- ✓ sampleRow[24]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`.

### ✓ Spectral radiance factors of 99 test samples for the CIE colour fidelity index calculation, 1nm wavelength steps

- folder: `Spectral radiance factors of 99 test samples for the CIE colour fidelity index calculation, 1nm wavelength steps`
- data table: `CIE_srf_cfi_1nm.csv` — 401 rows × 100 columns
- metadata: `CIE_srf_cfi_1nm.csv_metadata_v2.json`
- md5: `5f8f0b2e6a30a8630bda424b85a1806d`
- sha256: `32327de84b4bb8715a2b2f1bce3f5d2eca6276a44bde19c93c6f0aad5742db63`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ numberOfColumns: match
- ✓ sumOfColumns: match
- ✓ sampleRow[70]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`.

### ✓ Spectral radiance factors of each colour (RYGB) of the four-colour combination, 5nm wavelength steps

- folder: `Spectral radiance factors of each colour (RYGB) of the four-colour combination, 5nm wavelength steps`
- data table: `CIE_srf_FCI_5nm.csv` — 81 rows × 5 columns
- metadata: `CIE_srf_FCI_5nm.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_srf_FCI_5nm.csv_metadata.json`
- md5: `968e50cbcc15c6776fcb3e17444e7906`
- sha256: `dabe597a962fffc9afe3e50f79bc5fc325fbc28075fd2aa7c28df3a12c557202`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[13]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Spectral radiance factors of test-colour sample #15 of the Japanese skin complexion, 5nm wavelength steps

- folder: `Spectral radiance factors of test-colour sample #15 of the Japanese skin complexion, 5nm wavelength steps`
- data table: `CIE_srf_PS_5nm.csv` — 81 rows × 2 columns
- metadata: `CIE_srf_PS_5nm.csv_metadata_v2.json` (metadataRevision 2), superseding `CIE_srf_PS_5nm.csv_metadata.json`
- md5: `7dfe53cf9a4064ec9dd8988edea5b7e2`
- sha256: `1630cd6a7396ec23e5cf29bc72a6c63cddf1c7934764d143f11c292d7c52715f`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[13]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

### ✓ Values of the first deviation function used in the calculation of the CIE special metamerism index for a change in observer

- folder: `Values of the first deviation function used in the calculation of the CIE special metamerism index for a change in observer`
- data table: `CIE_1st_deriv_meta_ind.csv` — 81 rows × 4 columns
- metadata: `CIE_1st_deriv_meta_ind.csv_metadata_v2.json`
- md5: `73de03dc084a116e3b79902d6d4e2c5a`
- sha256: `1f1413de6d58e533e8a3d26e4b7dc30f4cd6f67aebb7593fa3553394da939952`

- ✓ md5: match
- ✓ sha256: match
- ✓ fileName: match
- ✓ sumOfColumns: match
- ✓ sampleRow[30]: match
- ✓ col1 wavelength_first: match
- ✓ col1 wavelength_last: match

Not checked — absent from the metadata, so the tool emits no result either way: `numberOfRows`, `numberOfColumns`.

## What the metadata revision changed

12 datasets have a `_metadata_v2.json` sitting beside the original `_metadata.json`. Running the same checks against the superseded file shows what the revision fixed. This is informational — the superseded file has no bearing on any verdict above.

**12 now pass that previously failed.** No dataset regressed.

| Data table | Superseded file | Was | Now | What was wrong before |
|---|---|---|---|---|
| `CIE_cc_1964_10deg.csv` | `CIE_cc_1964_10deg.csv_metadata.json` | **FAIL** | PASS | `sha256` |
| `CIE_lms_cf_10deg.csv` | `CIE_lms_cf_10deg.csv_metadata.json` | **FAIL** | PASS | `sha256` |
| `CIE_cfb_sle_2deg.csv` | `CIE_cfb_sle_2deg.csv_metadata.json` | **FAIL** | PASS | `sha256` |
| `CIE_smb_cc_2deg.csv` | `CIE_smb_cc_2deg.csv_metadata.json` | **FAIL** | PASS | `sha256` |
| `CIE_sle_10deg.csv` | `CIE_sle_10deg.csv_metadata.json` | **FAIL** | PASS | `sha256` |
| `CIE_sle_mesopic_m_0.8.csv` | `CIE_sle_mesopic_m_0.8.csv_metadata.json` | **FAIL** | PASS | `sha256` |
| `CIE_std_illum_A_1nm.csv` | `CIE_std_illum_A_1nm.csv_metadata.json` | **FAIL** | PASS | `sumOfColumns` |
| `CIE_std_illum_D65.csv` | `CIE_std_illum_D65.csv_metadata.json` | **FAIL** | PASS | `sha256`, `wavelength_first` |
| `CIE_illum_Dxx_comp.csv` | `CIE_illum_Dxx_comp.csv_metadata.json` | **FAIL** | PASS | `wavelength_last` |
| `CIE_srf_CQS_5nm.csv` | `CIE_srf_CQS_5nm.csv_metadata.json` | **FAIL** | PASS | `sampleRow` |
| `CIE_srf_FCI_5nm.csv` | `CIE_srf_FCI_5nm.csv_metadata.json` | **FAIL** | PASS | `sampleRow` |
| `CIE_srf_PS_5nm.csv` | `CIE_srf_PS_5nm.csv_metadata.json` | **FAIL** | PASS | `sampleRow` |

`CIE_cc_1964_10deg.csv_metadata.json`:

- ✗ sha256: MISMATCH (stored 7485d416ac4d6c30269b4267d739aec208d911a94711537b95c48716890e98c)

`CIE_lms_cf_10deg.csv_metadata.json`:

- ✗ sha256: MISMATCH (stored bd64f1f688a4b319c6d3fa6b3177a32eaaaaea0eed532befd0424f96304db18)

`CIE_cfb_sle_2deg.csv_metadata.json`:

- ✗ sha256: MISMATCH (stored e2a07b2bbab0dc80b35d2b070e79b87674740bd8c4ceb53ae78c6053ce2316)

`CIE_smb_cc_2deg.csv_metadata.json`:

- ✗ sha256: MISMATCH (stored 57a53ce67409cd69853acf9dc14bb6aa91f51b94dd9544e8aaf224895c141b)

`CIE_sle_10deg.csv_metadata.json`:

- ✗ sha256: MISMATCH (stored e67ec48406bdb6cef7ce03c42bd66f9dfc8601fb0a60837f8971973d4b960c9)

`CIE_sle_mesopic_m_0.8.csv_metadata.json`:

- ✗ sha256: MISMATCH (stored fa643111e81c16661cb7c2d3b9dca6d71ef1c3a4b602a8211a1e3f4aa1f8cd)

`CIE_std_illum_A_1nm.csv_metadata.json`:

- ✗ sumOfColumns: MISMATCH (stored [300015,60210.114316], computed [300015,60250.921916])

`CIE_std_illum_D65.csv_metadata.json`:

- ✗ sha256: MISMATCH (stored e76f21bffff3d552ef7113025da5f325d5dfec200dd4b878b1a2f3a507032cb)
- ✗ col1 wavelength_first: MISMATCH (meta 360, file 300)

`CIE_illum_Dxx_comp.csv_metadata.json`:

- ✗ col1 wavelength_last: MISMATCH (meta 780, file 830)

`CIE_srf_CQS_5nm.csv_metadata.json`:

- ✗ sampleRow[13]: MISMATCH (stored 440,0.048,0.0822,0.0559,0.0512,0.0786,0.0722,0.0924,0.1896,0.3201,0.3309,0.3074,0.3290,0.3945,0.3657,0.1774, file 440,0.048,0.0822,0.0559,0.0512,0.0786,0.0722,0.0924,0.1896,0.3201,0.3309,0.3074,0.329,0.3945,0.3657,0.1774)

`CIE_srf_FCI_5nm.csv_metadata.json`:

- ✗ sampleRow[13]: MISMATCH (stored 440, 0.058, 0.111, 0.125, 0.154, file 440,0.058,0.111,0.125,0.154)

`CIE_srf_PS_5nm.csv_metadata.json`:

- ✗ sampleRow[13]: MISMATCH (stored 440, 0.203, file 440,0.203)

## Notes on the checks

- `md5`, `sha256` — over the raw file bytes including any BOM. The BOM is stripped only for parsing.
- `fileName` — the `alternateIdentifierType: "fileName"` entry against the actual file name.
- `numberOfRows`, `numberOfColumns` — string comparison; the CSV is header-less, so row 1 is data.
- `sumOfColumns` — exact decimal arithmetic (BigInt fixed point), compared at the stored precision.
- `sampleRow` — whole-line string equality after trimming, 1-based row number.
- `wavelength_first`, `wavelength_last` — column 1 only, and only when the metadata holds a number; the sentinels `:unap` / `:null` are not numbers, so those tables are skipped by design.
- Never compared against the CSV, by design of the tool: `wavelength_step`, and the `columnHeaders` `title` / `unit` / `quantity` / `description` text. A `columnHeaders` count mismatch is a warning only.

## Self-tests

The lifted algorithms are pinned before any dataset is judged. T1–T3 test the lift itself against literals and against node's own crypto, so they stay meaningful when the data changes, and they abort the run if they fail. T4 is corroboration against what the tool logged in `CIEmetaDBdataset.json` — a difference there is a finding about the corpus, reported above, not a broken lift.

- ✓ T1 lifted md5/sha256 agree with node crypto — 42 byte strings
- ✓ T2 analyzeCsv reproduces hand-computed rows, columns, exact sums and wavelength grid — 10 assertions
- ✓ T3 exact-decimal comparison rounds half-up at the stored precision — 8 assertions
- · T4 CSV bytes still match the hashes the tool logged in CIEmetaDBdataset.json — 39 compared, all identical
