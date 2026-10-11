#!/usr/bin/env node
/* Validate every published CSV data table against its latest metadata revision.
 *
 * CIEmetaDB.html validates a CSV against a metadata payload one file at a time, through a
 * file-picker on the Validation tab. That is the right shape for editing a single entry and the
 * wrong shape for answering "is the whole corpus still consistent" - which is what a restructure
 * of published/ or a batch of metadata revisions leaves open. This script walks
 * published/<title>/, pairs each CSV with the newest metadata JSON beside it, runs the tool's
 * own checks, and writes a report.
 *
 *     node validate_published.js                 validate published/, write both reports
 *     node validate_published.js --dir DIR       validate a different tree, report into it
 *     node validate_published.js --out DIR       write the reports somewhere else
 *     node validate_published.js --quiet         reports only, no per-dataset console detail
 *
 * --dir deliberately redirects the reports into the tree it was given, so validating a scratch
 * copy cannot overwrite the report that describes published/.
 *
 * "Latest metadata revision" is <csv>_metadata_v2.json when present, else <csv>_metadata.json;
 * where both exist the v2 is the revision and the v1 is kept only for provenance.
 *
 * Nothing here reimplements the checks. md5Bytes(), sha256Bytes(), analyzeCsv() and the exact
 * decimal helpers are lifted verbatim out of CIEmetaDB.html at run time, the same
 * single-source-of-truth reasoning as db_integrity.js and sync_schema.py. The one part that
 * cannot be lifted is the comparison itself: it lives inside renderCsvResult(), interleaved with
 * DOM construction, so checkCsvAgainstPayload() below restates lines 2708-2758 of that function
 * and must be kept in step with them. selfTest() pins the lift against hashes and sums the tool
 * itself wrote into CIEmetaDBdataset.json, so a drifted lift fails loudly rather than quietly
 * reporting green.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

/* HERE is checks/, where the reports live; the tool and its data sit one level up. */
const HERE = __dirname;
const TOOL_DIR = path.join(HERE, "..");
const HTML = path.join(TOOL_DIR, "CIEmetaDB.html");
const PUBLISHED = path.join(TOOL_DIR, "published");
const WITNESS_FILE = path.join(TOOL_DIR, "CIEmetaDBdataset.json");
const REPORT_MD_NAME = "VALIDATION_REPORT.md";
const REPORT_JSON_NAME = "VALIDATION_REPORT.json";

/* ============================================================================
   lift the primitives out of CIEmetaDB.html
   ==========================================================================*/

const CONSTS = ["MD5_K", "MD5_S", "SHA_K"];
const FUNCTIONS = [
  "md5Bytes",
  "sha256Bytes",
  "parseCsv",
  "parseDecimal",
  "scaledToDecimal",
  "exactColumnSums",
  "decimalsOf",
  "normDec",
  "roundDecimalStr",
  "analyzeCsv",
  "numClose",
  "fmtNum",
];

/* A declaration runs from its own line to the next line that starts one, all of these being
   written at column 0 in CIEmetaDB.html. Brace matching is deliberately avoided: esc6902
   contains the regex literal /\//g, and its "//" makes a naive scanner treat the rest of the
   line as a comment, run past the closing brace and swallow the remainder of the file. */
const STARTS_DECL = /^(function |const |let |var |\/\*|\/\/)/;

function liftDeclaration(lines, firstLine) {
  const start = lines.findIndex((l) => l.startsWith(firstLine));
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && !STARTS_DECL.test(lines[end])) end++;
  return lines.slice(start, end).join("\n");
}

function liftPrimitives() {
  if (!fs.existsSync(HTML)) fail(`${HTML} not found`);
  const lines = fs.readFileSync(HTML, "utf8").split("\n");
  const missing = [];
  let source = "";
  for (const name of CONSTS) {
    const text = liftDeclaration(lines, `const ${name}`);
    text === null ? missing.push(`const ${name}`) : (source += text + "\n");
  }
  for (const name of FUNCTIONS) {
    const text = liftDeclaration(lines, `function ${name}(`);
    text === null ? missing.push(`function ${name}()`) : (source += text + "\n");
  }
  if (missing.length) {
    fail(
      `could not find these declarations in ${path.basename(HTML)}:\n` +
        missing.map((m) => `        ${m}`).join("\n") +
        `\n      They were renamed or reformatted. This script lifts them verbatim rather\n` +
        `      than restating them, so it has to be pointed at their new names.`
    );
  }
  const sandbox = {
    JSON,
    Object,
    Array,
    String,
    Number,
    Math,
    BigInt,
    Uint8Array,
    Uint32Array,
    DataView,
    console,
  };
  return vm.runInNewContext(`${source}\n({${FUNCTIONS.join(",")}})`, sandbox);
}

/* ============================================================================
   the check - a restatement of CIEmetaDB.html renderCsvResult() lines 2708-2758

   Every deliberate quirk of the original is preserved, including the ones that look like
   oversights, because the point of this script is to report what the tool reports:
     - a validationType absent from the metadata produces no result at all, neither pass nor
       warn (surfaced separately as "unchecked" in the report, never as a status);
     - sumOfColumns whose value is not wrapped in [...] is silently dropped;
     - sampleRow without a validationParameter is silently dropped;
     - wavelength_step and the columnHeaders text fields are never compared to the CSV;
     - warnings do not fail the validation.
   ==========================================================================*/

/* every check key this function can emit, in emission order - the report diffs against it to
   show which checks the metadata left unchecked */
const CHECK_KEYS = [
  "md5",
  "sha256",
  "fileName",
  "numberOfRows",
  "numberOfColumns",
  "sumOfColumns",
  "sampleRow",
  "wavelength_first",
  "wavelength_last",
];

function checkCsvAgainstPayload(api, p, filename, md5, sha, a) {
  const cs = p.checksums || [];
  const vs = (p.datatableInfo && p.datatableInfo.validations) || [];
  const chs = (p.datatableInfo && p.datatableInfo.columnHeaders) || [];
  const checks = [];
  const push = (key, status, text) => checks.push({ key, status, text });
  // checksums
  ["md5", "sha256"].forEach((method) => {
    const val = method === "md5" ? md5 : sha;
    const stored = cs.find((c) => (c.hashMethod || "").toLowerCase() === method);
    if (!stored) {
      push(method, "warn", `${method}: no stored checksum`);
      return;
    }
    const m = (stored.checksum || "").toLowerCase() === val.toLowerCase();
    push(method, m ? "pass" : "fail", `${method}: ${m ? "match" : "MISMATCH (stored " + stored.checksum + ")"}`);
  });
  // file name vs alternateIdentifier (type fileName)
  const metaFile = (p.alternateIdentifiers || []).find((x) => x.alternateIdentifierType === "fileName");
  if (metaFile) {
    const m = (metaFile.alternateIdentifier || "") === filename;
    push(
      "fileName",
      m ? "pass" : "fail",
      `fileName: ${m ? "match" : 'MISMATCH (metadata "' + metaFile.alternateIdentifier + '", file "' + filename + '")'}`
    );
  } else push("fileName", "warn", "fileName: none stored in metadata");
  // numeric / structural validations
  const vRows = vs.find((v) => v.validationType === "numberOfRows");
  if (vRows) {
    const m = String(a.nRows) === String(vRows.validationValue).trim();
    push("numberOfRows", m ? "pass" : "fail", `numberOfRows: ${m ? "match" : "MISMATCH (stored " + vRows.validationValue + ")"}`);
  }
  const vCols = vs.find((v) => v.validationType === "numberOfColumns");
  if (vCols) {
    const m = String(a.nCols) === String(vCols.validationValue).trim();
    push("numberOfColumns", m ? "pass" : "fail", `numberOfColumns: ${m ? "match" : "MISMATCH (stored " + vCols.validationValue + ")"}`);
  }
  const vSum = vs.find((v) => v.validationType === "sumOfColumns");
  if (vSum) {
    // Parse the stored array as raw decimal token STRINGS -- never via JSON.parse, whose
    // numbers would be coerced to IEEE-754 doubles and lose the exact decimal digits.
    const sv = String(vSum.validationValue).trim();
    const raw =
      sv.startsWith("[") && sv.endsWith("]")
        ? sv
            .slice(1, -1)
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t !== "")
        : null;
    if (raw) {
      const exact = a.sumsExact || [];
      // strict exact: the stored decimal must equal the exact BigInt sum rounded to its own
      // decimal places (fall back to numClose only for a column that is not exactly summable)
      const cmp = (tok, i) =>
        exact[i] != null
          ? api.normDec(api.roundDecimalStr(exact[i], api.decimalsOf(tok))) === api.normDec(tok)
          : api.numClose(Number(tok), a.sums[i]);
      const m = raw.length === a.sums.length && raw.every(cmp);
      const computed = "[" + a.sums.map((x, i) => (exact[i] != null ? exact[i] : api.fmtNum(x))).join(",") + "]";
      push(
        "sumOfColumns",
        m ? "pass" : "fail",
        `sumOfColumns: ${m ? "match" : "MISMATCH (stored " + vSum.validationValue + ", computed " + computed + ")"}`
      );
    }
  }
  const vSample = vs.find((v) => v.validationType === "sampleRow");
  if (vSample && vSample.validationParameter) {
    const idx = parseInt(vSample.validationParameter, 10) - 1;
    const line = a.lines[idx];
    const m = line !== undefined && line.trim() === String(vSample.validationValue).trim();
    push(
      "sampleRow",
      m ? "pass" : "fail",
      `sampleRow[${vSample.validationParameter}]: ${
        m
          ? "match"
          : "MISMATCH (stored " + vSample.validationValue + ", file " + (line === undefined ? "(no such row)" : line) + ")"
      }`
    );
  }
  // wavelength vs columnHeaders (sentinel strings like ":unap" mean "no wavelengths in this table" - skip)
  if (a.wl && chs[0]) {
    const c0 = chs[0];
    if (typeof c0.wavelength_first === "number") {
      const m = api.numClose(c0.wavelength_first, a.wl.first);
      push(
        "wavelength_first",
        m ? "pass" : "fail",
        `col1 wavelength_first: ${m ? "match" : "MISMATCH (meta " + c0.wavelength_first + ", file " + a.wl.first + ")"}`
      );
    }
    if (typeof c0.wavelength_last === "number") {
      const m = api.numClose(c0.wavelength_last, a.wl.last);
      push(
        "wavelength_last",
        m ? "pass" : "fail",
        `col1 wavelength_last: ${m ? "match" : "MISMATCH (meta " + c0.wavelength_last + ", file " + a.wl.last + ")"}`
      );
    }
  }
  if (a.nCols && chs.length && a.nCols !== chs.length)
    push("columnHeaders", "warn", `columnHeaders count (${chs.length}) differs from CSV columns (${a.nCols})`);
  if (!checks.length) push("", "warn", "No stored checksums/validations to check — use Generate below.");
  return checks;
}

/* ============================================================================
   self-tests

   Two different questions, deliberately kept apart:

   T1-T3 ask "is the lift faithful?". They must be answerable without reference to the corpus,
   or a CSV that legitimately changed would abort the run instead of being reported as a
   failure - which is the one thing this script exists to do. So they run against literals
   defined here and against node's own crypto, and they are fatal.

   T4 asks "does the corpus still agree with what the tool wrote into CIEmetaDBdataset.json?".
   That is a finding about the data, not about the lift, so it is informational and never fatal;
   the per-dataset report below is where such a disagreement is judged.
   ==========================================================================*/

/* A CSV small enough to reason about by hand, chosen so that the float and exact paths
   disagree: 0.1 + 0.2 + 0.30 is 0.6000000000000001 in IEEE-754 and exactly 0.60 in BigInt
   fixed point, and the mixed scales (1, 1, 2) exercise the common-scale alignment. */
const WITNESS_CSV = "380,0.1,1\n385,0.2,2\n390,0.30,3\n";
const WITNESS_TEXT_CSV = "380,:unap\n385,x";

function selfTest(api, datasets) {
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok, detail: detail || "", fatal: true });
  const note = (name, detail) => results.push({ name, ok: true, detail: detail || "", fatal: false });

  /* T1 - the hash functions, against the platform implementations. Independent of any file. */
  const cryptoBad = [];
  const probes = [Buffer.from(WITNESS_CSV, "utf8"), Buffer.from([]), Buffer.from("﻿380,1\r\n", "utf8")];
  for (const d of datasets) probes.push(d.bytes);
  for (const b of probes) {
    const u8 = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    if (api.md5Bytes(u8) !== crypto.createHash("md5").update(b).digest("hex")) cryptoBad.push("md5");
    if (api.sha256Bytes(u8) !== crypto.createHash("sha256").update(b).digest("hex")) cryptoBad.push("sha256");
  }
  check("T1 lifted md5/sha256 agree with node crypto", cryptoBad.length === 0, cryptoBad.join(", ") || `${probes.length} byte strings`);

  /* T2 - analyzeCsv, against hand-computed values for WITNESS_CSV. */
  const a = api.analyzeCsv(WITNESS_CSV);
  const t = api.analyzeCsv(WITNESS_TEXT_CSV);
  const t2 = [
    [a.nRows === 3, `nRows ${a.nRows} != 3 (trailing newline must not add a row)`],
    [a.nCols === 3, `nCols ${a.nCols} != 3`],
    [a.sumsExact[0] === "1155", `col1 exact sum ${a.sumsExact[0]} != 1155`],
    [a.sumsExact[1] === "0.60", `col2 exact sum ${a.sumsExact[1]} != 0.60`],
    [a.sumsExact[2] === "6", `col3 exact sum ${a.sumsExact[2]} != 6`],
    [a.sums[1] !== 0.6, "float sum of col2 is exactly 0.6, so this witness no longer proves the exact path is used"],
    [a.lines[1] === "385,0.2,2", `lines[1] ${JSON.stringify(a.lines[1])} != "385,0.2,2"`],
    [a.wl && a.wl.first === 380 && a.wl.last === 390 && a.wl.step === 5 && a.wl.uniform, "wavelength grid not 380..390 step 5"],
    [t.sumsExact[1] === null && t.sumsValid[1] === false, "a column holding :unap must have no exact sum"],
    [t.sumsExact[0] === "765", `text-witness col1 exact sum ${t.sumsExact[0]} != 765`],
  ];
  const t2Bad = t2.filter(([ok]) => !ok).map(([, msg]) => msg);
  check("T2 analyzeCsv reproduces hand-computed rows, columns, exact sums and wavelength grid", t2Bad.length === 0, t2Bad.join("; ") || "10 assertions");

  /* T3 - the comparison arithmetic: half-up rounding to the stored precision, and the
     normalisation that makes 0.60 and 0.6 the same stored value. */
  const t3 = [
    [api.decimalsOf("0.60") === 2 && api.decimalsOf("1155") === 0, "decimalsOf"],
    [api.roundDecimalStr("0.60", 1) === "0.6", `roundDecimalStr("0.60",1) = ${api.roundDecimalStr("0.60", 1)}`],
    [api.roundDecimalStr("0.25", 1) === "0.3", `half-up: roundDecimalStr("0.25",1) = ${api.roundDecimalStr("0.25", 1)}`],
    [api.roundDecimalStr("-0.25", 1) === "-0.3", `half-up on negatives: ${api.roundDecimalStr("-0.25", 1)}`],
    [api.roundDecimalStr("2", 3) === "2.000", `padding: ${api.roundDecimalStr("2", 3)}`],
    [api.normDec("0.60") === "0.6" && api.normDec("-0") === "0" && api.normDec("6") === "6", "normDec"],
    [api.normDec(api.roundDecimalStr("0.60", api.decimalsOf("0.6"))) === api.normDec("0.6"), "0.60 must match a stored 0.6"],
    [api.numClose(380, 380.0000001) && !api.numClose(380, 381), "numClose relative tolerance"],
  ];
  const t3Bad = t3.filter(([ok]) => !ok).map(([, msg]) => msg);
  check("T3 exact-decimal comparison rounds half-up at the stored precision", t3Bad.length === 0, t3Bad.join("; ") || "8 assertions");

  /* T4 - corroboration against the validationLog the tool wrote. Informational: a mismatch
     means the corpus moved, which the report is here to say, not that the lift is broken. */
  const byName = new Map();
  if (fs.existsSync(WITNESS_FILE)) {
    let db = null;
    try {
      db = JSON.parse(fs.readFileSync(WITNESS_FILE, "utf8"));
    } catch (e) {
      note(`T4 ${path.basename(WITNESS_FILE)} could not be read`, e.message);
    }
    for (const e of (db && db.entries) || []) {
      const logs = e.validationLog || [];
      const last = logs[logs.length - 1];
      if (last && last.fileName) byName.set(last.fileName, last);
    }
  }
  let compared = 0;
  const drifted = [];
  for (const d of datasets) {
    const w = byName.get(d.csv);
    if (!w || !w.md5 || !w.sha256) continue;
    compared++;
    if ((w.md5 || "").toLowerCase() !== d.md5 || (w.sha256 || "").toLowerCase() !== d.sha256) drifted.push(d.csv);
  }
  note(
    "T4 CSV bytes still match the hashes the tool logged in CIEmetaDBdataset.json",
    drifted.length
      ? `${compared} compared, ${drifted.length} differ — see the report: ${drifted.join(", ")}`
      : `${compared} compared, all identical`
  );

  const failed = results.filter((r) => !r.ok && r.fatal);
  for (const r of results) console.log(`  ${r.ok ? (r.fatal ? "pass" : "note") : "FAIL"}  ${r.name}${r.detail ? ` (${r.detail})` : ""}`);
  if (failed.length) {
    fail(
      `${failed.length} self-test(s) failed. The algorithms lifted from ${path.basename(HTML)} no longer\n` +
        `      behave as this script expects, so the report would be meaningless. Fix the lift first.`
    );
  }
  return results;
}

/* ============================================================================
   walk published/
   ==========================================================================*/

/* One CSV per folder, paired with the newest metadata JSON beside it. */
function collectDatasets(api, root) {
  if (!fs.existsSync(root)) fail(`${root} not found`);
  const out = [];
  const problems = [];
  const folders = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const folder of folders) {
    const dir = path.join(root, folder);
    const files = fs.readdirSync(dir);
    const csvs = files.filter((f) => f.toLowerCase().endsWith(".csv"));
    if (csvs.length !== 1) {
      problems.push(`${folder}: expected exactly one .csv, found ${csvs.length}`);
      continue;
    }
    const csv = csvs[0];
    const v2 = `${csv}_metadata_v2.json`;
    const v1 = `${csv}_metadata.json`;
    const metadataFile = files.includes(v2) ? v2 : files.includes(v1) ? v1 : null;
    if (!metadataFile) {
      problems.push(`${folder}: no ${v1} or ${v2} beside ${csv}`);
      continue;
    }
    let payload;
    try {
      payload = JSON.parse(fs.readFileSync(path.join(dir, metadataFile), "utf8"));
    } catch (e) {
      problems.push(`${folder}: ${metadataFile} is not valid JSON: ${e.message}`);
      continue;
    }
    /* Where a v2 supersedes a v1, the v1 is checked too - not to judge it, but to record what
       the revision changed. Reported separately; it never affects the dataset's verdict. */
    const supersedes = metadataFile === v2 && files.includes(v1) ? v1 : null;
    let prevPayload = null;
    if (supersedes) {
      try {
        prevPayload = JSON.parse(fs.readFileSync(path.join(dir, supersedes), "utf8"));
      } catch (e) {
        problems.push(`${folder}: ${supersedes} is not valid JSON: ${e.message}`);
      }
    }
    // hashes are over the raw bytes, before any BOM stripping; the text for analyzeCsv is
    // decoded separately, exactly as the tool does on the Validation tab
    const bytes = fs.readFileSync(path.join(dir, csv));
    const u8 = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const md5 = api.md5Bytes(u8);
    const sha256 = api.sha256Bytes(u8);
    const analysis = api.analyzeCsv(bytes.toString("utf8"));
    out.push({ folder, csv, metadataFile, supersedes, payload, prevPayload, bytes, md5, sha256, analysis });
  }
  return { datasets: out, problems };
}

/* ============================================================================
   report
   ==========================================================================*/

function metadataRevision(p) {
  return typeof p.metadataRevision === "number" ? p.metadataRevision : null;
}

function titleOf(p) {
  const t = (p.titles || [])[0];
  return (t && t.title) || "";
}

function buildRecords(datasets, when, by) {
  return datasets.map((d) => {
    const checks = d.checks;
    const emitted = new Set(checks.map((c) => c.key));
    return {
      folder: d.folder,
      title: titleOf(d.payload),
      metadataFile: d.metadataFile,
      metadataRevision: metadataRevision(d.payload),
      supersedes: d.supersedes,
      rows: d.analysis.nRows,
      columns: d.analysis.nCols,
      unchecked: CHECK_KEYS.filter((k) => !emitted.has(k)),
      date: when,
      by,
      fileName: d.csv,
      md5: d.md5,
      sha256: d.sha256,
      passed: checks.every((c) => c.status !== "fail"),
      results: checks.map((c) => ({ check: c.key || "", status: c.status, detail: c.text })),
      superseded: d.prevChecks
        ? {
            metadataFile: d.supersedes,
            metadataRevision: metadataRevision(d.prevPayload),
            passed: d.prevChecks.every((c) => c.status !== "fail"),
            results: d.prevChecks
              .filter((c) => c.status === "fail")
              .map((c) => ({ check: c.key || "", status: c.status, detail: c.text })),
          }
        : null,
    };
  });
}

const GLYPH = { pass: "✓", fail: "✗", warn: "!" };

function printConsole(records, quiet, tree) {
  const failed = records.filter((r) => !r.passed);
  const warned = records.filter((r) => r.passed && r.results.some((x) => x.status === "warn"));
  const verdict = failed.length
    ? `FAIL, ${failed.length} dataset${failed.length === 1 ? "" : "s"}`
    : warned.length
    ? `OK, ${warned.length} with warnings`
    : "OK";
  console.log(`${tree}/  ${verdict}  (${records.length} dataset${records.length === 1 ? "" : "s"})`);
  if (quiet) return;
  for (const r of records) {
    const notes = r.results.filter((x) => x.status !== "pass");
    if (!notes.length && !r.unchecked.length) continue;
    console.log(`  ${r.fileName} (${r.metadataFile}${r.metadataRevision ? `, rev ${r.metadataRevision}` : ""})`);
    for (const n of notes) console.log(`      ${GLYPH[n.status]} ${n.detail}`);
    if (r.unchecked.length) console.log(`      - not checked: ${r.unchecked.join(", ")}`);
  }
}

function mdEscape(s) {
  return String(s).replace(/\|/g, "\\|");
}

function buildMarkdown(records, when, problems, selfTests, root) {
  const passed = records.filter((r) => r.passed);
  const failed = records.filter((r) => !r.passed);
  const tree = root === PUBLISHED ? "published" : path.basename(root);
  const L = [];
  L.push("# Validation report — published CIE data tables");
  L.push("");
  L.push(`Generated ${when} by \`validate_published.js\` over \`${tree}/\`.`);
  L.push("");
  L.push(
    `Every CSV in \`${tree}/<title>/\` checked against the latest metadata revision beside it ` +
      "(`*_metadata_v2.json` where present, else `*_metadata.json`), using the algorithms lifted " +
      "verbatim from `CIEmetaDB.html`. Checksums are taken over the raw file bytes; column sums are " +
      "compared exactly, the stored decimal against the exact BigInt sum rounded to the stored " +
      "number of decimal places — not to a tolerance."
  );
  L.push("");
  L.push(`**${passed.length}/${records.length} passed, ${failed.length} failed.** ` + "Warnings do not fail a dataset, matching the tool.");
  L.push("");

  if (problems.length) {
    L.push("## Folders skipped");
    L.push("");
    for (const p of problems) L.push(`- ${p}`);
    L.push("");
  }

  L.push("## Summary");
  L.push("");
  L.push("| # | Data table | Metadata used | Rev | Rows | Cols | Verdict | Fail | Warn | Not checked |");
  L.push("|---|---|---|---|---|---|---|---|---|---|");
  records.forEach((r, i) => {
    const f = r.results.filter((x) => x.status === "fail").length;
    const w = r.results.filter((x) => x.status === "warn").length;
    L.push(
      `| ${i + 1} | \`${mdEscape(r.fileName)}\` | \`${mdEscape(r.metadataFile)}\` | ${r.metadataRevision ?? "—"} | ` +
        `${r.rows} | ${r.columns} | ${r.passed ? "PASS" : "**FAIL**"} | ${f || ""} | ${w || ""} | ${r.unchecked.length || ""} |`
    );
  });
  L.push("");

  const detail = (r) => {
    const out = [];
    out.push(`### ${r.passed ? "✓" : "✗"} ${mdEscape(r.title || r.fileName)}`);
    out.push("");
    out.push(`- folder: \`${r.folder}\``);
    out.push(`- data table: \`${r.fileName}\` — ${r.rows} rows × ${r.columns} columns`);
    out.push(
      `- metadata: \`${r.metadataFile}\`` +
        (r.metadataRevision ? ` (metadataRevision ${r.metadataRevision})` : "") +
        (r.supersedes ? `, superseding \`${r.supersedes}\`` : "")
    );
    out.push(`- md5: \`${r.md5}\``);
    out.push(`- sha256: \`${r.sha256}\``);
    out.push("");
    for (const x of r.results) out.push(`- ${GLYPH[x.status]} ${mdEscape(x.detail)}`);
    if (r.unchecked.length) {
      out.push("");
      out.push(
        `Not checked — absent from the metadata, so the tool emits no result either way: ` +
          r.unchecked.map((k) => `\`${k}\``).join(", ") +
          "."
      );
    }
    out.push("");
    return out;
  };

  if (failed.length) {
    L.push("## Failures");
    L.push("");
    for (const r of failed) L.push(...detail(r));
  }
  L.push(failed.length ? "## Passing datasets" : "## Datasets");
  L.push("");
  for (const r of passed) L.push(...detail(r));

  const revised = records.filter((r) => r.superseded);
  if (revised.length) {
    const fixed = revised.filter((r) => !r.superseded.passed && r.passed);
    const broke = revised.filter((r) => r.superseded.passed && !r.passed);
    L.push("## What the metadata revision changed");
    L.push("");
    L.push(
      `${revised.length} dataset${revised.length === 1 ? " has" : "s have"} a \`_metadata_v2.json\` sitting beside the ` +
        "original `_metadata.json`. Running the same checks against the superseded file shows what the revision fixed. " +
        "This is informational — the superseded file has no bearing on any verdict above."
    );
    L.push("");
    L.push(
      `**${fixed.length} now pass that previously failed.**` +
        (broke.length ? ` **${broke.length} regressed.**` : " No dataset regressed.")
    );
    L.push("");
    L.push("| Data table | Superseded file | Was | Now | What was wrong before |");
    L.push("|---|---|---|---|---|");
    for (const r of revised) {
      const keys = [...new Set(r.superseded.results.map((x) => x.check))];
      L.push(
        `| \`${mdEscape(r.fileName)}\` | \`${mdEscape(r.superseded.metadataFile)}\` | ` +
          `${r.superseded.passed ? "PASS" : "**FAIL**"} | ${r.passed ? "PASS" : "**FAIL**"} | ` +
          `${keys.map((k) => `\`${k}\``).join(", ") || "—"} |`
      );
    }
    L.push("");
    for (const r of revised.filter((x) => x.superseded.results.length)) {
      L.push(`\`${mdEscape(r.superseded.metadataFile)}\`:`);
      L.push("");
      for (const x of r.superseded.results) L.push(`- ✗ ${mdEscape(x.detail)}`);
      L.push("");
    }
  }

  L.push("## Notes on the checks");
  L.push("");
  L.push(
    "- `md5`, `sha256` — over the raw file bytes including any BOM. The BOM is stripped only for parsing."
  );
  L.push("- `fileName` — the `alternateIdentifierType: \"fileName\"` entry against the actual file name.");
  L.push("- `numberOfRows`, `numberOfColumns` — string comparison; the CSV is header-less, so row 1 is data.");
  L.push("- `sumOfColumns` — exact decimal arithmetic (BigInt fixed point), compared at the stored precision.");
  L.push("- `sampleRow` — whole-line string equality after trimming, 1-based row number.");
  L.push(
    "- `wavelength_first`, `wavelength_last` — column 1 only, and only when the metadata holds a number; " +
      "the sentinels `:unap` / `:null` are not numbers, so those tables are skipped by design."
  );
  L.push(
    "- Never compared against the CSV, by design of the tool: `wavelength_step`, and the `columnHeaders` " +
      "`title` / `unit` / `quantity` / `description` text. A `columnHeaders` count mismatch is a warning only."
  );
  L.push("");
  L.push("## Self-tests");
  L.push("");
  L.push(
    "The lifted algorithms are pinned before any dataset is judged. T1–T3 test the lift itself " +
      "against literals and against node's own crypto, so they stay meaningful when the data changes, " +
      "and they abort the run if they fail. T4 is corroboration against what the tool logged in " +
      "`CIEmetaDBdataset.json` — a difference there is a finding about the corpus, reported above, not a broken lift."
  );
  L.push("");
  for (const t of selfTests)
    L.push(`- ${t.ok ? (t.fatal ? "✓" : "·") : "✗"} ${mdEscape(t.name)}${t.detail ? ` — ${mdEscape(t.detail)}` : ""}`);
  L.push("");
  return L.join("\n");
}

/* ============================================================================
   main
   ==========================================================================*/

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(2);
}

function main(argv) {
  const args = argv.slice(2);
  const quiet = args.includes("--quiet");
  const dirIdx = args.indexOf("--dir");
  const outIdx = args.indexOf("--out");
  if (args.some((a) => a.startsWith("--") && !["--quiet", "--dir", "--out"].includes(a))) {
    console.error("usage: node validate_published.js [--dir DIR] [--out DIR] [--quiet]");
    return 2;
  }
  const root = dirIdx >= 0 ? path.resolve(args[dirIdx + 1] || "") : PUBLISHED;
  // reports describe a tree, so they follow it: only the canonical published/ tree reports
  // beside the script, where the report is version-controlled
  const outDir = outIdx >= 0 ? path.resolve(args[outIdx + 1] || "") : root === PUBLISHED ? HERE : root;
  const reportMd = path.join(outDir, REPORT_MD_NAME);
  const reportJson = path.join(outDir, REPORT_JSON_NAME);

  const api = liftPrimitives();
  const { datasets, problems } = collectDatasets(api, root);
  if (!datasets.length) fail(`no datasets found under ${root}`);

  const selfTests = selfTest(api, datasets);

  for (const d of datasets) {
    d.checks = checkCsvAgainstPayload(api, d.payload, d.csv, d.md5, d.sha256, d.analysis);
    d.prevChecks = d.prevPayload ? checkCsvAgainstPayload(api, d.prevPayload, d.csv, d.md5, d.sha256, d.analysis) : null;
  }

  // one timestamp for the whole run, so every record in the report shares it
  const when = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const records = buildRecords(datasets, when, "validate_published.js");

  fs.writeFileSync(reportJson, JSON.stringify(records, null, 2) + "\n", "utf8");
  fs.writeFileSync(reportMd, buildMarkdown(records, when, problems, selfTests, root), "utf8");

  for (const p of problems) console.log(`  ! ${p}`);
  printConsole(records, quiet, root === PUBLISHED ? "published" : path.basename(root));
  console.log(`  wrote ${REPORT_MD_NAME} and ${REPORT_JSON_NAME}` + (outDir === HERE ? "" : ` to ${outDir}`));

  return records.every((r) => r.passed) && !problems.length ? 0 : 1;
}

process.exit(main(process.argv));
