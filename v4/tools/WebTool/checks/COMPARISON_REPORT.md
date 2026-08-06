# Comparison report — database vs published metadata files

Generated 2026-08-06T10:02:52Z by `compare_published.js` over `published/` and `CIEmetaDBdataset.json`.

Every entry in the database compared field by field with the metadata file published beside its data table, using `deepDiff` lifted verbatim from `CIEmetaDB.html` — the same comparison the tool's **Compare with metadata-file (JSON)** dialog performs, one entry at a time. Arrays are compared element by element, so a single changed value is pinpointed to its exact path. `metadataRevision` is excluded from the comparison, as it is in the dialog, and reported separately below.

**39/39 datasets agree with the database.**

This is a different question from `VALIDATION_REPORT.md`, which checks each CSV against its metadata. That check reads only the checksums, `datatableInfo.validations`, the first column header's wavelengths and the `fileName` identifier; everything else in the metadata — titles, creators, subjects, descriptions, rights, related items, column-header text — is compared only here.

## Summary

| # | Data table | Metadata file | Entry rev | Agrees | Diffs | Superseded file |
|---|---|---|---|---|---|---|
| 1 | `CIE_cc_1931_2deg.csv` | `CIE_cc_1931_2deg.csv_metadata.json` | 1 | yes |  | — |
| 2 | `CIE_cc_1964_10deg.csv` | `CIE_cc_1964_10deg.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 3 | `CIE_xyz_1964_10deg.csv` | `CIE_xyz_1964_10deg.csv_metadata.json` | 1 | yes |  | — |
| 4 | `CIE_lms_cf_10deg.csv` | `CIE_lms_cf_10deg.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 5 | `CIE_lms_cf_2deg.csv` | `CIE_lms_cf_2deg.csv_metadata.json` | 1 | yes |  | — |
| 6 | `CIE_a-opic_action_spectra.csv` | `CIE_a-opic_action_spectra.csv_metadata.json` | 1 | yes |  | — |
| 7 | `CIE_cfb_sle_10deg.csv` | `CIE_cfb_sle_10deg.csv_metadata.json` | 1 | yes |  | — |
| 8 | `CIE_cfb_sle_2deg.csv` | `CIE_cfb_sle_2deg.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 9 | `CIE_cfb_stv_10deg.csv` | `CIE_cfb_stv_10deg.csv_metadata.json` | 1 | yes |  | — |
| 10 | `CIE_cfb_stv_2deg.csv` | `CIE_cfb_stv_2deg.csv_metadata.json` | 1 | yes |  | — |
| 11 | `CIE_illum_ID50.csv` | `CIE_illum_ID50.csv_metadata.json` | 1 | yes |  | — |
| 12 | `CIE_illum_ID65.csv` | `CIE_illum_ID65.csv_metadata_v2.json` | 2 | yes |  | — |
| 13 | `CIE_max_sle_mesopic.csv` | `CIE_max_sle_mesopic.csv_metadata.json` | 1 | yes |  | — |
| 14 | `CIE_RefSpectrum_L41.csv` | `CIE_RefSpectrum_L41.csv_metadata_v2.json` | 2 | yes |  | — |
| 15 | `CIE_smb_cc_2deg.csv` | `CIE_smb_cc_2deg.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 16 | `CIE_sle_10deg.csv` | `CIE_sle_10deg.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 17 | `CIE_sle_mesopic_m_0.8.csv` | `CIE_sle_mesopic_m_0.8.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 18 | `CIE_sle_photopic.csv` | `CIE_sle_photopic.csv_metadata.json` | 1 | yes |  | — |
| 19 | `CIE_sle_scotopic.csv` | `CIE_sle_scotopic.csv_metadata.json` | 1 | yes |  | — |
| 20 | `CIE_std_illum_A_1nm.csv` | `CIE_std_illum_A_1nm.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 21 | `CIE_std_illum_D50.csv` | `CIE_std_illum_D50.csv_metadata.json` | 1 | yes |  | — |
| 22 | `CIE_std_illum_D65.csv` | `CIE_std_illum_D65.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 23 | `CIE_xyz_1931_2deg.csv` | `CIE_xyz_1931_2deg.csv_metadata.json` | 1 | yes |  | — |
| 24 | `CIE_illum_Dxx_comp.csv` | `CIE_illum_Dxx_comp.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 25 | `CIE_illum_C.csv` | `CIE_illum_C.csv_metadata_v2.json` | 2 | yes |  | — |
| 26 | `CIE_illum_D55.csv` | `CIE_illum_D55.csv_metadata.json` | 1 | yes |  | — |
| 27 | `CIE_illum_D75.csv` | `CIE_illum_D75.csv_metadata_v2.json` | 2 | yes |  | — |
| 28 | `CIE_illum_HPs.csv` | `CIE_illum_HPs.csv_metadata_v2.json` | 2 | yes |  | — |
| 29 | `CIE_illum_LEDs.csv` | `CIE_illum_LEDs.csv_metadata_v2.json` | 2 | yes |  | — |
| 30 | `CIE_illum_LEDs_1nm.csv` | `CIE_illum_LEDs_1nm.csv_metadata.json` | 1 | yes |  | — |
| 31 | `CIE_illum_FLs.csv` | `CIE_illum_FLs.csv_metadata.json` | 1 | yes |  | — |
| 32 | `CIE_illum_FLs_1nm.csv` | `CIE_illum_FLs_1nm.csv_metadata.json` | 1 | yes |  | — |
| 33 | `CIE_srf_CQS_5nm.csv` | `CIE_srf_CQS_5nm.csv_metadata_v2.json` | 2 | yes |  | **30 differ** |
| 34 | `CIE_srf_cri.csv` | `CIE_srf_cri.csv_metadata_v2.json` | 2 | yes |  | — |
| 35 | `CIE_srf_cfi.csv` | `CIE_srf_cfi.csv_metadata_v2.json` | 2 | yes |  | — |
| 36 | `CIE_srf_cfi_1nm.csv` | `CIE_srf_cfi_1nm.csv_metadata_v2.json` | 2 | yes |  | — |
| 37 | `CIE_srf_FCI_5nm.csv` | `CIE_srf_FCI_5nm.csv_metadata_v2.json` | 2 | yes |  | matches rev 1 |
| 38 | `CIE_srf_PS_5nm.csv` | `CIE_srf_PS_5nm.csv_metadata_v2.json` | 2 | yes |  | **1 differ** |
| 39 | `CIE_1st_deriv_meta_ind.csv` | `CIE_1st_deriv_meta_ind.csv_metadata_v2.json` | 2 | yes |  | — |

## Superseded metadata files

12 folders hold a superseded `_metadata.json` beside the current `_metadata_v2.json`. Each is compared with **revision 1 of its entry, reconstructed from the entry's own history** — so a difference here says the file published at the time does not match what the database records for that revision. These never affect the verdict above.

**10/12 match revision 1 exactly.**

### ✗ `CIE_srf_CQS_5nm.csv_metadata.json`

30 difference(s) from entry `2aae303c-2e93-4964-a817-487e448ac682` revision 1.

| | Path | Database | File |
|---|---|---|---|
| − | `/datatableInfo/columnHeaders/1/description` | `"5R 4/14"` | — |
| + | `/datatableInfo/columnHeaders/1/descrition` | — | `"5R 4/14"` |
| − | `/datatableInfo/columnHeaders/2/description` | `"10R  6/12"` | — |
| + | `/datatableInfo/columnHeaders/2/descrition` | — | `"10R  6/12"` |
| − | `/datatableInfo/columnHeaders/3/description` | `"7.5YR 7/12"` | — |
| + | `/datatableInfo/columnHeaders/3/descrition` | — | `"7.5YR 7/12"` |
| − | `/datatableInfo/columnHeaders/4/description` | `"5Y 8/12"` | — |
| + | `/datatableInfo/columnHeaders/4/descrition` | — | `"5Y 8/12"` |
| − | `/datatableInfo/columnHeaders/5/description` | `"2.5GY 8/10"` | — |
| + | `/datatableInfo/columnHeaders/5/descrition` | — | `"2.5GY 8/10"` |
| − | `/datatableInfo/columnHeaders/6/description` | `"7.5GY 7/10"` | — |
| + | `/datatableInfo/columnHeaders/6/descrition` | — | `"7.5GY 7/10"` |
| − | `/datatableInfo/columnHeaders/7/description` | `"2.5G 6/12"` | — |
| + | `/datatableInfo/columnHeaders/7/descrition` | — | `"2.5G 6/12"` |
| − | `/datatableInfo/columnHeaders/8/description` | `"2.5BG 6/10"` | — |
| + | `/datatableInfo/columnHeaders/8/descrition` | — | `"2.5BG 6/10"` |
| − | `/datatableInfo/columnHeaders/9/description` | `"10BG 6/8"` | — |
| + | `/datatableInfo/columnHeaders/9/descrition` | — | `"10BG 6/8"` |
| − | `/datatableInfo/columnHeaders/10/description` | `"7.5B 5/10"` | — |
| + | `/datatableInfo/columnHeaders/10/descrition` | — | `"7.5B 5/10"` |
| − | `/datatableInfo/columnHeaders/11/description` | `"2.5PB 4/10"` | — |
| + | `/datatableInfo/columnHeaders/11/descrition` | — | `"2.5PB 4/10"` |
| − | `/datatableInfo/columnHeaders/12/description` | `"7.5PB 4/12"` | — |
| + | `/datatableInfo/columnHeaders/12/descrition` | — | `"7.5PB 4/12"` |
| − | `/datatableInfo/columnHeaders/13/description` | `"5P 5/10"` | — |
| + | `/datatableInfo/columnHeaders/13/descrition` | — | `"5P 5/10"` |
| − | `/datatableInfo/columnHeaders/14/description` | `"2.5RP 6/12"` | — |
| + | `/datatableInfo/columnHeaders/14/descrition` | — | `"2.5RP 6/12"` |
| − | `/datatableInfo/columnHeaders/15/description` | `"7.5RP 5/12"` | — |
| + | `/datatableInfo/columnHeaders/15/descrition` | — | `"7.5RP 5/12"` |

### ✗ `CIE_srf_PS_5nm.csv_metadata.json`

1 difference(s) from entry `e6791f20-92a5-4057-a821-ea68cfac0621` revision 1.

| | Path | Database | File |
|---|---|---|---|
| ~ | `/datatableInfo/columnHeaders/1/title` | `"beta15(lambda)"` | `"β15(λ)"` |

## Revision alignment

`metadataRevision` is bookkeeping, excluded from the comparison because exported files often omit it. Recorded here so its absence is visible rather than silently ignored.

| Data table | File `metadataRevision` | Entry rev | |
|---|---|---|---|
| `CIE_cc_1931_2deg.csv` | — | 1 | not in file |
| `CIE_cc_1964_10deg.csv` | 2 | 2 | aligned |
| `CIE_xyz_1964_10deg.csv` | — | 1 | not in file |
| `CIE_lms_cf_10deg.csv` | 2 | 2 | aligned |
| `CIE_lms_cf_2deg.csv` | — | 1 | not in file |
| `CIE_a-opic_action_spectra.csv` | — | 1 | not in file |
| `CIE_cfb_sle_10deg.csv` | — | 1 | not in file |
| `CIE_cfb_sle_2deg.csv` | 2 | 2 | aligned |
| `CIE_cfb_stv_10deg.csv` | — | 1 | not in file |
| `CIE_cfb_stv_2deg.csv` | — | 1 | not in file |
| `CIE_illum_ID50.csv` | — | 1 | not in file |
| `CIE_illum_ID65.csv` | — | 2 | not in file |
| `CIE_max_sle_mesopic.csv` | — | 1 | not in file |
| `CIE_RefSpectrum_L41.csv` | — | 2 | not in file |
| `CIE_smb_cc_2deg.csv` | 2 | 2 | aligned |
| `CIE_sle_10deg.csv` | 2 | 2 | aligned |
| `CIE_sle_mesopic_m_0.8.csv` | 2 | 2 | aligned |
| `CIE_sle_photopic.csv` | — | 1 | not in file |
| `CIE_sle_scotopic.csv` | — | 1 | not in file |
| `CIE_std_illum_A_1nm.csv` | 2 | 2 | aligned |
| `CIE_std_illum_D50.csv` | — | 1 | not in file |
| `CIE_std_illum_D65.csv` | 2 | 2 | aligned |
| `CIE_xyz_1931_2deg.csv` | — | 1 | not in file |
| `CIE_illum_Dxx_comp.csv` | 2 | 2 | aligned |
| `CIE_illum_C.csv` | — | 2 | not in file |
| `CIE_illum_D55.csv` | — | 1 | not in file |
| `CIE_illum_D75.csv` | — | 2 | not in file |
| `CIE_illum_HPs.csv` | — | 2 | not in file |
| `CIE_illum_LEDs.csv` | — | 2 | not in file |
| `CIE_illum_LEDs_1nm.csv` | — | 1 | not in file |
| `CIE_illum_FLs.csv` | — | 1 | not in file |
| `CIE_illum_FLs_1nm.csv` | — | 1 | not in file |
| `CIE_srf_CQS_5nm.csv` | 2 | 2 | aligned |
| `CIE_srf_cri.csv` | — | 2 | not in file |
| `CIE_srf_cfi.csv` | — | 2 | not in file |
| `CIE_srf_cfi_1nm.csv` | — | 2 | not in file |
| `CIE_srf_FCI_5nm.csv` | 2 | 2 | aligned |
| `CIE_srf_PS_5nm.csv` | 2 | 2 | aligned |
| `CIE_1st_deriv_meta_ind.csv` | — | 2 | not in file |

## Schema check on the published files

Informational, as in the Compare dialog: each published file validated against `CIEmetaDigitalProduct_schema_04.json`. Note the validator **skips unknown properties**, so a misspelled key passes the schema and shows up only in the field comparison above.

All 39 files validate cleanly.

## Identity

Every file's DOI and `fileName` identifier agree with its database entry.

## Self-tests

The lifted comparison is pinned against literals before any dataset is judged, so it stays meaningful when the data changes; a dataset that genuinely differs is reported, never fatal.

- ✓ T1 deepDiff reports adds, removes and precise leaf paths — 7 assertions
- ✓ T2 metadataRevision is excluded from the comparison — differs raw, agrees once stripped
- ✓ T3 reconstruct replays history forward to a given revision — rev 1 and rev 2 of a synthetic history
