#!/usr/bin/env node
/* Compare every CIEmetaDB entry with the metadata file(s) published beside its data table.
 *
 * validate_published.js answers "does each CSV match its metadata?". It only ever reads the
 * fields that check needs - checksums, datatableInfo.validations, the first column header's
 * wavelengths and the fileName identifier - so titles, creators, subjects, descriptions,
 * rights, relatedItems and the column-header text are never compared to anything. Whether the
 * database and the published files actually describe the same dataset is a different question,
 * on a different axis, and CIEmetaDB.html answers it through "Compare with metadata-file
 * (JSON)" - one entry at a time, by hand.
 *
 *     node compare_published.js                  compare against published/, write both reports
 *     node compare_published.js --dir DIR        compare against a different tree, report into it
 *     node compare_published.js --out DIR        write the reports somewhere else
 *     node compare_published.js --quiet          reports only, no per-dataset console detail
 *
 * Entries are matched to folders by the fileName alternate identifier. Each entry's payload is
 * compared with the latest metadata file in its folder (<csv>_metadata_v2.json when present,
 * else <csv>_metadata.json); where a folder holds both, the superseded file is additionally
 * compared with reconstruct(history, 1), the entry's own revision-1 payload. A difference there
 * concerns a historical file and is reported separately, never failing the current verdict.
 *
 * Nothing is reimplemented. deepDiff(), reconstruct(), validate() and friends are lifted
 * verbatim out of CIEmetaDB.html at run time, the same single-source-of-truth reasoning as
 * db_integrity.js, sync_schema.py and validate_published.js. Only renderDiff() is left behind,
 * being DOM-bound; the ops are printed directly here using the dialog's own legend.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* HERE is checks/, where the reports live; the tool and its data sit one level up. */
const HERE = __dirname;
const TOOL_DIR = path.join(HERE, "..");
const HTML = path.join(TOOL_DIR, "CIEmetaDB.html");
const PUBLISHED = path.join(TOOL_DIR, "published");
const DB_FILE = path.join(TOOL_DIR, "CIEmetaDBdataset.json");
/* sync_schema.py holds the copy embedded in the HTML byte-identical to this file, so reading it
   directly is the same schema the tool validates against, without scraping the <script> block. */
const SCHEMA_FILE = path.join(TOOL_DIR, "..", "..", "schema", "CIEmetaDigitalProduct_schema_04.json");
const REPORT_MD_NAME = "COMPARISON_REPORT.md";
const REPORT_JSON_NAME = "COMPARISON_REPORT.json";

/* ============================================================================
   lift the primitives out of CIEmetaDB.html
   ==========================================================================*/

const CONSTS = [];
const FUNCTIONS = [
  "clone",
  "canonical",
  "ptrTokens",
  "esc6902",
  "deepDiff",
  "applyPatch",
  "reconstruct",
  "validate",
  "kindOf",
  "entryTitle",
  "entryDoi",
  "entryFilename",
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
  const sandbox = { JSON, Object, Array, String, Number, Math, Set, console };
  return vm.runInNewContext(`${source}\n({${FUNCTIONS.join(",")}})`, sandbox);
}

/* ============================================================================
   the comparison - mirroring CIEmetaDB.html lines 3400-3470
   ==========================================================================*/

/* metadataRevision is internal revision bookkeeping, not part of the DataCite metadata, and is
   absent from most exported files; the dialog strips it from both sides before diffing
   (lines 3444-3448) and so does this. It is reported separately instead of silently dropped. */
function strip(api, p) {
  const c = api.clone(p || {});
  delete c.metadataRevision;
  return c;
}

function diffPayloads(api, dbPayload, filePayload) {
  return api.deepDiff(strip(api, dbPayload), strip(api, filePayload), "");
}

/* deepDiff records a value only for add/replace; for remove the database side is the
   interesting one, so both sides are resolved from the documents by JSON pointer. */
function atPointer(api, doc, pointer) {
  let cur = doc;
  for (const tok of api.ptrTokens(pointer)) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[tok];
  }
  return cur;
}

function describeOps(api, ops, dbPayload, filePayload) {
  const A = strip(api, dbPayload);
  const B = strip(api, filePayload);
  return ops.map((o) => ({
    op: o.op,
    path: o.path,
    // the dialog's legend: ~ changed (database -> file), + only in file, - only in database
    glyph: o.op === "replace" ? "~" : o.op === "add" ? "+" : "−",
    database: atPointer(api, A, o.path),
    file: o.op === "remove" ? undefined : o.value !== undefined ? o.value : atPointer(api, B, o.path),
  }));
}

/* ============================================================================
   self-tests

   Corpus-independent and fatal: they test the lifted deepDiff against literals, so they stay
   meaningful when the data changes. A dataset that genuinely differs must be reported as a
   difference, never abort the run.
   ==========================================================================*/

function selfTest(api) {
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok, detail: detail || "" });

  const d = (a, b) => api.deepDiff(a, b, "");
  const t1 = [
    [d({ a: 1, b: 2 }, { b: 2, a: 1 }).length === 0, "key order alone must not produce an op"],
    [d({ a: 1 }, { a: 1 }).length === 0, "identical objects must produce no op"],
    [
      (() => {
        const ops = d({ checksums: [{ c: "x" }, { c: "y" }] }, { checksums: [{ c: "x" }, { c: "z" }] });
        return ops.length === 1 && ops[0].op === "replace" && ops[0].path === "/checksums/1/c" && ops[0].value === "z";
      })(),
      "a single changed array element must yield one replace at the precise leaf path",
    ],
    [
      (() => {
        const ops = d({ a: 1 }, { a: 1, extra: 5 });
        return ops.length === 1 && ops[0].op === "add" && ops[0].path === "/extra" && ops[0].value === 5;
      })(),
      "a key only in the file must yield add",
    ],
    [
      (() => {
        const ops = d({ a: 1, gone: 2 }, { a: 1 });
        return ops.length === 1 && ops[0].op === "remove" && ops[0].path === "/gone";
      })(),
      "a key only in the database must yield remove",
    ],
    [
      (() => {
        const ops = d({ xs: [1, 2] }, { xs: [1, 2, 3] });
        return ops.length === 1 && ops[0].op === "add" && ops[0].path === "/xs/2";
      })(),
      "a longer array in the file must yield add at the new index",
    ],
    [
      // the misspelled-key case this corpus actually contains: description -> descrition
      (() => {
        const ops = d({ h: { description: "x" } }, { h: { descrition: "x" } });
        return ops.length === 2 && ops.some((o) => o.op === "remove" && o.path === "/h/description") && ops.some((o) => o.op === "add" && o.path === "/h/descrition");
      })(),
      "a misspelled key must yield a remove plus an add, not a replace",
    ],
  ];
  const t1Bad = t1.filter(([ok]) => !ok).map(([, m]) => m);
  check("T1 deepDiff reports adds, removes and precise leaf paths", t1Bad.length === 0, t1Bad.join("; ") || `${t1.length} assertions`);

  const withRev = { a: 1, metadataRevision: 2 };
  const noRev = { a: 1 };
  check(
    "T2 metadataRevision is excluded from the comparison",
    d(withRev, noRev).length === 1 && diffPayloads(api, withRev, noRev).length === 0,
    "differs raw, agrees once stripped"
  );

  /* T3 - reconstruct is only meaningful if a history replays to its own payload; db_integrity.js
     owns that invariant, this just proves the lifted copy works on a synthetic history. */
  const hist = [{ patch: [{ op: "add", path: "/a", value: 1 }] }, { patch: [{ op: "add", path: "/b", value: 2 }] }];
  check(
    "T3 reconstruct replays history forward to a given revision",
    api.canonical(api.reconstruct(hist, 1)) === api.canonical({ a: 1 }) && api.canonical(api.reconstruct(hist, 2)) === api.canonical({ a: 1, b: 2 }),
    "rev 1 and rev 2 of a synthetic history"
  );

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`  ${r.ok ? "pass" : "FAIL"}  ${r.name}${r.detail ? ` (${r.detail})` : ""}`);
  if (failed.length) {
    fail(
      `${failed.length} self-test(s) failed. The functions lifted from ${path.basename(HTML)} no longer\n` +
        `      behave as this script expects, so the report would be meaningless. Fix the lift first.`
    );
  }
  return results;
}

/* ============================================================================
   walk the database and the published tree
   ==========================================================================*/

function readJson(file, what) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail(`${what} (${file}) is not valid JSON: ${e.message}`);
  }
}

/* expectComplete: only the canonical published/ tree is presumed to hold every entry, so only
   there is a database entry without a folder a problem. Under --dir the tree may deliberately be
   a subset (a single folder being spot-checked), and reporting the other 38 entries as failures
   would bury the difference the run was made to find. */
function collect(api, root, db, schema, expectComplete) {
  if (!fs.existsSync(root)) fail(`${root} not found`);

  const byFile = new Map();
  const noFileName = [];
  for (const e of db.entries || []) {
    const fn = api.entryFilename(e);
    if (!fn) {
      noFileName.push(e.entryId);
      continue;
    }
    byFile.set(fn, e);
  }

  const records = [];
  const problems = [];
  const seen = new Set();
  const folders = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((x) => x.isDirectory())
    .map((x) => x.name)
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
    const entry = byFile.get(csv);
    if (!entry) {
      problems.push(`${folder}: no database entry carries fileName "${csv}"`);
      continue;
    }
    seen.add(csv);

    const filePayload = readJson(path.join(dir, metadataFile), metadataFile);

    // soft identity check - warn, and compare anyway (CIEmetaDB.html:3421-3430)
    const identity = [];
    const fileDoi = filePayload.identifier && filePayload.identifier.identifier;
    const fileFn = (filePayload.alternateIdentifiers || [])
      .filter((x) => x && x.alternateIdentifierType === "fileName")
      .map((x) => x.alternateIdentifier)[0];
    if (api.entryDoi(entry) && fileDoi && api.entryDoi(entry) !== fileDoi)
      identity.push(`DOI (entry: ${api.entryDoi(entry)} · file: ${fileDoi})`);
    if (api.entryFilename(entry) && fileFn && api.entryFilename(entry) !== fileFn)
      identity.push(`fileName (entry: ${api.entryFilename(entry)} · file: ${fileFn})`);

    let schemaIssues = [];
    try {
      schemaIssues = api.validate(filePayload, schema) || [];
    } catch (e) {
      schemaIssues = [`validator threw: ${e.message}`];
    }

    const ops = diffPayloads(api, entry.payload, filePayload);

    /* Where a v2 supersedes a v1, the older file should describe the entry as it stood at
       revision 1 - which the entry's own history can reconstruct. */
    let superseded = null;
    if (metadataFile === v2 && files.includes(v1)) {
      const oldPayload = readJson(path.join(dir, v1), v1);
      const rev1 = api.reconstruct(entry.history || [], 1);
      const oldOps = diffPayloads(api, rev1, oldPayload);
      superseded = {
        metadataFile: v1,
        comparedWith: `entry revision 1 (reconstructed from history)`,
        metadataRevision: typeof oldPayload.metadataRevision === "number" ? oldPayload.metadataRevision : null,
        agrees: oldOps.length === 0,
        ops: describeOps(api, oldOps, rev1, oldPayload),
      };
    }

    records.push({
      folder,
      csv,
      title: api.entryTitle(entry),
      entryId: entry.entryId,
      rev: entry.rev,
      status: entry.status,
      kind: api.kindOf(entry),
      doi: api.entryDoi(entry),
      metadataFile,
      metadataRevision: typeof filePayload.metadataRevision === "number" ? filePayload.metadataRevision : null,
      identity,
      schemaIssues,
      agrees: ops.length === 0,
      ops: describeOps(api, ops, entry.payload, filePayload),
      superseded,
    });
  }

  const orphanEntries = [];
  for (const [fn, e] of byFile) if (!seen.has(fn)) orphanEntries.push({ entryId: e.entryId, fileName: fn });
  if (expectComplete) {
    for (const o of orphanEntries) problems.push(`database entry ${o.entryId} (${o.fileName}) has no folder under ${path.basename(root)}`);
  }
  for (const id of noFileName) problems.push(`database entry ${id} carries no fileName alternate identifier`);

  return { records, problems, orphanEntries, expectComplete };
}

/* ============================================================================
   report
   ==========================================================================*/

function short(v) {
  if (v === undefined) return "(absent)";
  const s = JSON.stringify(v);
  return s.length > 160 ? s.slice(0, 157) + "..." : s;
}

function printConsole(records, problems, quiet, tree, res) {
  const differ = records.filter((r) => !r.agrees);
  const supDiffer = records.filter((r) => r.superseded && !r.superseded.agrees);
  const verdict = differ.length || problems.length ? `FAIL, ${differ.length + problems.length}` : supDiffer.length ? `OK, ${supDiffer.length} superseded file(s) differ` : "OK";
  console.log(`${tree}/ vs ${path.basename(DB_FILE)}  ${verdict}  (${records.length} dataset${records.length === 1 ? "" : "s"})`);
  if (!res.expectComplete && res.orphanEntries.length)
    console.log(`      - subset tree: ${res.orphanEntries.length} database entr${res.orphanEntries.length === 1 ? "y has" : "ies have"} no folder here (not counted)`);
  for (const p of problems) console.log(`      ! ${p}`);
  if (quiet) return;
  for (const r of records) {
    const notes = [];
    if (!r.agrees) notes.push(...r.ops.map((o) => `${o.glyph} ${o.path}   db: ${short(o.database)}   file: ${short(o.file)}`));
    for (const i of r.identity) notes.push(`! identity: ${i}`);
    if (r.schemaIssues.length) notes.push(`! ${r.schemaIssues.length} schema issue(s)`);
    if (r.superseded && !r.superseded.agrees) notes.push(`! superseded ${r.superseded.metadataFile}: ${r.superseded.ops.length} difference(s) from entry rev 1`);
    if (!notes.length) continue;
    console.log(`  ${r.csv} (${r.metadataFile}, entry rev ${r.rev})`);
    for (const n of notes.slice(0, 12)) console.log(`      ${n}`);
    if (notes.length > 12) console.log(`      ... ${notes.length - 12} more`);
  }
}

function mdEscape(s) {
  return String(s).replace(/\|/g, "\\|");
}

function opTable(ops) {
  const L = [];
  L.push("| | Path | Database | File |");
  L.push("|---|---|---|---|");
  for (const o of ops)
    L.push(`| ${o.glyph} | \`${mdEscape(o.path)}\` | ${o.database === undefined ? "—" : "`" + mdEscape(short(o.database)) + "`"} | ${o.file === undefined ? "—" : "`" + mdEscape(short(o.file)) + "`"} |`);
  return L;
}

function buildMarkdown(records, problems, selfTests, when, root, res) {
  const tree = root === PUBLISHED ? "published" : path.basename(root);
  const agree = records.filter((r) => r.agrees);
  const differ = records.filter((r) => !r.agrees);
  const withSup = records.filter((r) => r.superseded);
  const supDiffer = withSup.filter((r) => !r.superseded.agrees);
  const L = [];

  L.push("# Comparison report — database vs published metadata files");
  L.push("");
  L.push(`Generated ${when} by \`compare_published.js\` over \`${tree}/\` and \`${path.basename(DB_FILE)}\`.`);
  L.push("");
  L.push(
    `Every entry in the database compared field by field with the metadata file published beside its ` +
      `data table, using \`deepDiff\` lifted verbatim from \`CIEmetaDB.html\` — the same comparison the ` +
      `tool's **Compare with metadata-file (JSON)** dialog performs, one entry at a time. Arrays are ` +
      `compared element by element, so a single changed value is pinpointed to its exact path. ` +
      `\`metadataRevision\` is excluded from the comparison, as it is in the dialog, and reported separately below.`
  );
  L.push("");
  L.push(
    `**${agree.length}/${records.length} datasets agree with the database.**` +
      (differ.length ? ` **${differ.length} differ.**` : "") +
      (problems.length ? ` **${problems.length} pairing problem(s).**` : "")
  );
  L.push("");
  L.push(
    "This is a different question from `VALIDATION_REPORT.md`, which checks each CSV against its " +
      "metadata. That check reads only the checksums, `datatableInfo.validations`, the first column " +
      "header's wavelengths and the `fileName` identifier; everything else in the metadata — titles, " +
      "creators, subjects, descriptions, rights, related items, column-header text — is compared only here."
  );
  L.push("");

  if (!res.expectComplete && res.orphanEntries.length) {
    L.push(
      `> This run used \`--dir\`, so the tree is not presumed to hold the whole corpus: ` +
        `${res.orphanEntries.length} database entries have no folder here and are not counted as problems.`
    );
    L.push("");
  }

  if (problems.length) {
    L.push("## Pairing problems");
    L.push("");
    for (const p of problems) L.push(`- ${p}`);
    L.push("");
  }

  L.push("## Summary");
  L.push("");
  L.push("| # | Data table | Metadata file | Entry rev | Agrees | Diffs | Superseded file |");
  L.push("|---|---|---|---|---|---|---|");
  records.forEach((r, i) => {
    const sup = !r.superseded ? "—" : r.superseded.agrees ? "matches rev 1" : `**${r.superseded.ops.length} differ**`;
    L.push(
      `| ${i + 1} | \`${mdEscape(r.csv)}\` | \`${mdEscape(r.metadataFile)}\` | ${r.rev} | ` +
        `${r.agrees ? "yes" : "**no**"} | ${r.ops.length || ""} | ${sup} |`
    );
  });
  L.push("");

  if (differ.length) {
    L.push("## Differences");
    L.push("");
    L.push("Legend: `~` changed (database → file), `+` only in file, `−` only in database.");
    L.push("");
    for (const r of differ) {
      L.push(`### ✗ ${mdEscape(r.title)}`);
      L.push("");
      L.push(`- entry \`${r.entryId}\` rev ${r.rev} (${r.status}) — \`${mdEscape(r.csv)}\``);
      L.push(`- file: \`${mdEscape(r.metadataFile)}\``);
      L.push("");
      L.push(...opTable(r.ops));
      L.push("");
    }
  }

  L.push("## Superseded metadata files");
  L.push("");
  if (!withSup.length) {
    L.push("No folder holds both a `_metadata.json` and a `_metadata_v2.json`.");
    L.push("");
  } else {
    L.push(
      `${withSup.length} folders hold a superseded \`_metadata.json\` beside the current ` +
        `\`_metadata_v2.json\`. Each is compared with **revision 1 of its entry, reconstructed from the ` +
        `entry's own history** — so a difference here says the file published at the time does not match ` +
        `what the database records for that revision. These never affect the verdict above.`
    );
    L.push("");
    L.push(`**${withSup.length - supDiffer.length}/${withSup.length} match revision 1 exactly.**`);
    L.push("");
    for (const r of supDiffer) {
      L.push(`### ✗ \`${mdEscape(r.superseded.metadataFile)}\``);
      L.push("");
      L.push(`${r.superseded.ops.length} difference(s) from entry \`${r.entryId}\` revision 1.`);
      L.push("");
      L.push(...opTable(r.superseded.ops));
      L.push("");
    }
  }

  L.push("## Revision alignment");
  L.push("");
  L.push(
    "`metadataRevision` is bookkeeping, excluded from the comparison because exported files often " +
      "omit it. Recorded here so its absence is visible rather than silently ignored."
  );
  L.push("");
  L.push("| Data table | File `metadataRevision` | Entry rev | |");
  L.push("|---|---|---|---|");
  for (const r of records) {
    const state = r.metadataRevision === null ? "not in file" : r.metadataRevision === r.rev ? "aligned" : "**differs**";
    L.push(`| \`${mdEscape(r.csv)}\` | ${r.metadataRevision === null ? "—" : r.metadataRevision} | ${r.rev} | ${state} |`);
  }
  L.push("");

  L.push("## Schema check on the published files");
  L.push("");
  const bad = records.filter((r) => r.schemaIssues.length);
  L.push(
    "Informational, as in the Compare dialog: each published file validated against " +
      "`CIEmetaDigitalProduct_schema_04.json`. Note the validator **skips unknown properties**, so a " +
      "misspelled key passes the schema and shows up only in the field comparison above."
  );
  L.push("");
  if (!bad.length) L.push(`All ${records.length} files validate cleanly.`);
  else
    for (const r of bad) {
      L.push(`- \`${mdEscape(r.metadataFile)}\` — ${r.schemaIssues.length} issue(s):`);
      for (const i of r.schemaIssues.slice(0, 10)) L.push(`  - ${mdEscape(i)}`);
      if (r.schemaIssues.length > 10) L.push(`  - … ${r.schemaIssues.length - 10} more`);
    }
  L.push("");

  const idBad = records.filter((r) => r.identity.length);
  L.push("## Identity");
  L.push("");
  if (!idBad.length) L.push("Every file's DOI and `fileName` identifier agree with its database entry.");
  else for (const r of idBad) L.push(`- \`${mdEscape(r.metadataFile)}\` — ${r.identity.map(mdEscape).join("; ")}`);
  L.push("");

  L.push("## Self-tests");
  L.push("");
  L.push(
    "The lifted comparison is pinned against literals before any dataset is judged, so it stays " +
      "meaningful when the data changes; a dataset that genuinely differs is reported, never fatal."
  );
  L.push("");
  for (const t of selfTests) L.push(`- ${t.ok ? "✓" : "✗"} ${mdEscape(t.name)}${t.detail ? ` — ${mdEscape(t.detail)}` : ""}`);
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
    console.error("usage: node compare_published.js [--dir DIR] [--out DIR] [--quiet]");
    return 2;
  }
  const root = dirIdx >= 0 ? path.resolve(args[dirIdx + 1] || "") : PUBLISHED;
  // reports describe a tree, so they follow it: only the canonical published/ tree reports
  // beside the script, where the report is version-controlled
  const outDir = outIdx >= 0 ? path.resolve(args[outIdx + 1] || "") : root === PUBLISHED ? HERE : root;

  const api = liftPrimitives();
  const selfTests = selfTest(api);

  const db = readJson(DB_FILE, "the database");
  const schema = readJson(SCHEMA_FILE, "the schema");
  const res = collect(api, root, db, schema, root === PUBLISHED);
  const { records, problems, orphanEntries } = res;
  if (!records.length) fail(`no datasets could be paired under ${root}`);

  const when = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  fs.writeFileSync(
    path.join(outDir, REPORT_JSON_NAME),
    JSON.stringify({ date: when, database: path.basename(DB_FILE), tree: root, completeTree: res.expectComplete, records, problems, orphanEntries }, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(path.join(outDir, REPORT_MD_NAME), buildMarkdown(records, problems, selfTests, when, root, res), "utf8");

  printConsole(records, problems, quiet, root === PUBLISHED ? "published" : path.basename(root), res);
  console.log(`  wrote ${REPORT_MD_NAME} and ${REPORT_JSON_NAME}` + (outDir === HERE ? "" : ` to ${outDir}`));

  return records.every((r) => r.agrees) && !problems.length ? 0 : 1;
}

process.exit(main(process.argv));
