#!/usr/bin/env node
/* Check and repair the derived fields of a CIEmetaDB metadatabase file.
 *
 * CIEmetaDB_schema.json defines several fields as derived from payload content:
 * contentHash is the sha256 of the canonical payload, history[].patch replays onto {} to
 * reproduce any revision, history[].baseHash is the hash of the payload before that patch,
 * and the database baseHash is a fingerprint over all entries. Nothing enforced them, and
 * they drifted: migrateDb() used to backfill the schema-4.1 field metadataRevision into
 * legacy payloads without recomputing contentHash and without recording it in the history, so
 * the stored hash described the pre-backfill payload and the history no longer replayed to it.
 * That silently disables historyContainsHash(), the ancestry test the merge path uses to
 * tell a fast-forward from a real conflict.
 *
 * A second group of fields is derived in the same sense but from the entry rather than the
 * payload: status is whatever kindOf() says it is, given rev and revisionOf. Those are
 * checked (E6, E7) and reported, never repaired - which revision belongs to which parent is
 * an editorial matter.
 *
 *     node db_integrity.js --check    report violations; exit 1 if any
 *     node db_integrity.js --fix      repair the derived fields in place
 *
 * With no file arguments both modes act on the three databases stored beside this script.
 *
 * Nothing here is reimplemented. canonical(), contentHash(), applyPatch(), kindOf(),
 * repairDerivedFields() and friends are lifted verbatim out of CIEmetaDB.html at run time, so
 * there is exactly one implementation to keep correct - the same single-source-of-truth
 * reasoning as sync_schema.py. Self-tests below prove the lifted code reproduces hashes the
 * tool wrote.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const HERE = __dirname;
const HTML = path.join(HERE, "CIEmetaDB.html");
const DEFAULT_DBS = [
  "CIEmetaDBdataset.json",
  "CIEmetaDB_starter.json",
  "CIEmetaDB_starter_short.json",
].map((f) => path.join(HERE, f));

/* ============================================================================
   lift the primitives out of CIEmetaDB.html
   ==========================================================================*/

const CONSTS = ["SHA_K", "_enc"];
const FUNCTIONS = [
  "sha256Bytes",
  "sha256Str",
  "canonical",
  "contentHash",
  "clone",
  "ptrTokens",
  "applyPatch",
  "esc6902",
  "diffPatch",
  "reconstruct",
  "repairDerivedFields",
  "contentDiff",
  "kindOf",
  "entryEnvFingerprint",
  "computeDbBaseHash",
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
    TextEncoder,
    JSON,
    Object,
    Array,
    String,
    Number,
    Math,
    Uint8Array,
    Uint32Array,
    console,
  };
  return vm.runInNewContext(`${source}\n({${FUNCTIONS.join(",")}})`, sandbox);
}

/* ============================================================================
   self-tests: the lifted code must reproduce hashes the tool itself wrote
   ==========================================================================*/

/* CIE_std_illum_A_1nm is the one entry in CIEmetaDBdataset.json that was published after
   metadataRevision was introduced, so the tool wrote its contentHash over the payload as it
   stands. Reproducing that hash proves the lift is faithful. */
const WITNESS_FILE = path.join(HERE, "CIEmetaDBdataset.json");
const WITNESS_ENTRY = "CIE_std_illum_A_1nm.csv";

function selfTest(api) {
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok, detail: detail || "" });

  if (fs.existsSync(WITNESS_FILE)) {
    const db = readDb(WITNESS_FILE);
    const witness = db.entries.find((e) => entryName(e) === WITNESS_ENTRY);
    if (!witness) {
      check("T1 witness entry present", false, `${WITNESS_ENTRY} not in ${path.basename(WITNESS_FILE)}`);
    } else {
      check(
        "T1 lifted contentHash reproduces the hash the tool stored",
        api.contentHash(witness.payload) === witness.contentHash,
        WITNESS_ENTRY
      );
      const canon = api.canonical(witness.payload);
      check(
        "T2 lifted sha256 agrees with node crypto",
        crypto.createHash("sha256").update(canon, "utf8").digest("hex") === api.sha256Str(canon)
      );
    }
  } else {
    check("T1/T2 witness file present", false, `${WITNESS_FILE} not found`);
  }

  const added = api.diffPatch({}, { metadataRevision: 1 }, "");
  const replaced = api.diffPatch({ metadataRevision: 1 }, { metadataRevision: 2 }, "");
  check(
    "T3 diffPatch emits the op shapes the repair appends",
    added.length === 1 &&
      added[0].op === "add" &&
      added[0].path === "/metadataRevision" &&
      replaced.length === 1 &&
      replaced[0].op === "replace" &&
      replaced[0].path === "/metadataRevision"
  );

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    fail(
      "self-tests failed - the code lifted from CIEmetaDB.html does not behave as expected:\n" +
        failed.map((r) => `        ${r.name}${r.detail ? " (" + r.detail + ")" : ""}`).join("\n")
    );
  }
  return results;
}

/* ============================================================================
   database i/o
   ==========================================================================*/

/* The tool writes databases with JSON.stringify(db,null,2) and no trailing newline
   (writeText in CIEmetaDB.html). Reading and rewriting an untouched file must therefore be
   byte-neutral; serialise() is checked against that on every run (T4). */
function serialise(db) {
  return JSON.stringify(db, null, 2);
}

function readDb(file) {
  const text = fs.readFileSync(file, "utf8");
  let db;
  try {
    db = JSON.parse(text);
  } catch (e) {
    fail(`${path.basename(file)} is not valid JSON: ${e.message}`);
  }
  if (db.dbSchemaName !== "CIEmetaDB") {
    fail(`${path.basename(file)} is not a CIEmetaDB database (dbSchemaName: ${db.dbSchemaName})`);
  }
  db.__text = text;
  return db;
}

function entryName(e) {
  const alt = ((e.payload && e.payload.alternateIdentifiers) || []).find((a) =>
    /^CIE_/.test(a.alternateIdentifier || "")
  );
  if (alt) return alt.alternateIdentifier;
  const doi = e.payload && e.payload.identifier && e.payload.identifier.identifier;
  return doi || e.entryId;
}

/* ============================================================================
   invariants
   ==========================================================================*/

/* An unpublished payload is deliberately ahead of its history: a draft holds the first
   revision and a revision the next one, neither of which is recorded as a patch until it is
   published. E3 therefore applies to published entries only, and E2 expects rev+1 rather
   than rev.

   The kind is taken from kindOf(), the tool's own derivation from rev and revisionOf, rather
   than from the stored status. E6 alone polices the stored status, so a status that has gone
   stale reports once as E6 instead of cascading into unrelated E2 and E3 failures. */
function checkEntry(api, entry) {
  const violations = [];
  const add = (code, detail) => violations.push({ code, detail });
  const kind = api.kindOf(entry);
  const published = kind === "published";
  const history = entry.history || [];

  if (history.length !== entry.rev) {
    add("E1", `history.length ${history.length} != rev ${entry.rev}`);
  }
  history.forEach((h, i) => {
    if (h.rev !== i + 1) add("E1", `history[${i}].rev is ${h.rev}, expected ${i + 1}`);
  });

  const wantMdRev = published ? entry.rev : entry.rev + 1;
  const gotMdRev = entry.payload ? entry.payload.metadataRevision : undefined;
  if (gotMdRev !== wantMdRev) {
    add("E2", `payload.metadataRevision ${gotMdRev} != ${wantMdRev} (${kind}, rev ${entry.rev})`);
  }

  /* E1 failures make replay meaningless, so only walk the history when it is well-formed. */
  const replayable = history.length === entry.rev && history.every((h, i) => h.rev === i + 1);

  if (replayable && published) {
    const replay = api.reconstruct(history, entry.rev);
    if (api.canonical(replay) !== api.canonical(entry.payload)) {
      add("E3", `replaying history does not reproduce payload: ${describeDivergence(api, replay, entry.payload)}`);
    }
  }

  if (api.contentHash(entry.payload) !== entry.contentHash) {
    add("E4", "contentHash does not match payload");
  }

  if (replayable) {
    if (history.length && history[0].baseHash !== null) {
      add("E5", `history[0].baseHash is ${JSON.stringify(history[0].baseHash)}, expected null`);
    }
    for (let i = 1; i < history.length; i++) {
      const want = api.contentHash(api.reconstruct(history, i));
      if (history[i].baseHash !== want) add("E5", `history[${i}].baseHash does not match revision ${i}`);
    }
  }

  /* status is derived, not chosen - CIEmetaDB_schema.json says so, and kindOf() is where the
     tool derives it: revisionOf present means a revision under way, rev 0 means never
     published, anything else is published. A stored status that disagrees is stale, and
     because status feeds entryEnvFingerprint it also puts db.baseHash out of step. */
  if (entry.status !== kind) {
    add("E6", `status is "${entry.status}" but rev ${entry.rev}${entry.revisionOf ? " with revisionOf" : ""} makes it "${kind}"`);
  }

  return violations;
}

/* Name the differing top-level keys so a real content divergence is distinguishable from
   the metadataRevision gap at a glance. */
function describeDivergence(api, replay, payload) {
  const keys = new Set([...Object.keys(replay || {}), ...Object.keys(payload || {})]);
  const differing = [...keys].filter(
    (k) => api.canonical((replay || {})[k]) !== api.canonical((payload || {})[k])
  );
  return differing.length ? differing.map((k) => "/" + k).join(", ") : "(no top-level key differs)";
}

/* E7 needs the whole entry list, so it is checked here rather than per entry: a revisionOf
   pointer is only meaningful relative to the other entries. These are the same three rules
   migrateStatuses() applies on load - it drops a pointer whose parent is missing and demotes a
   second revision claiming one parent - so a stored database breaking them is one that was
   hand-edited or merged outside the tool. */
function checkRevisionPairs(api, db) {
  const out = [];
  const entries = db.entries || [];
  const byId = new Map(entries.map((e) => [e.entryId, e]));
  const claimed = new Map();
  /* A revision is a clone of its parent, so the two share a DOI and a filename by design.
     Naming them alone would print the same string twice, and a truncated entryId can itself
     collide, so these messages carry the whole thing - they are rare diagnostics. */
  const ref = (e) => `${entryName(e)} [${e.entryId}]`;
  for (const e of entries) {
    if (!e.revisionOf) continue;
    const parent = byId.get(e.revisionOf);
    if (!parent) {
      out.push({ code: "E7", detail: `${ref(e)} revises entryId ${e.revisionOf}, which is not in this database` });
      continue;
    }
    if (parent === e) {
      out.push({ code: "E7", detail: `${ref(e)} lists itself as revisionOf` });
      continue;
    }
    if (api.kindOf(parent) !== "published") {
      out.push({ code: "E7", detail: `${ref(e)} revises ${ref(parent)}, which is ${api.kindOf(parent)} rather than published` });
    }
    const first = claimed.get(e.revisionOf);
    if (first) {
      out.push({ code: "E7", detail: `${ref(parent)} is revised by both ${ref(first)} and ${ref(e)}; only one revision may be open` });
    } else {
      claimed.set(e.revisionOf, e);
    }
  }
  return out;
}

function checkDb(api, db) {
  const entries = (db.entries || []).map((e) => ({ entry: e, violations: checkEntry(api, e) }));
  const dbViolations = checkRevisionPairs(api, db);
  const wantBase = api.computeDbBaseHash(db);
  if (db.baseHash !== wantBase) dbViolations.push({ code: "D1", detail: "baseHash does not match the entries" });
  return { entries, dbViolations };
}

/* ============================================================================
   repair
   ==========================================================================*/

/* The repair itself is repairDerivedFields(), lifted from CIEmetaDB.html along with the hash
   chain: migrateDb() calls the same function, so the tool and this script cannot disagree
   about what a consistent entry looks like. It touches derived fields only - an E2 violation
   is a statement about payload content, so it is reported and left alone. */
function repairDb(api, db) {
  const repaired = (db.entries || []).map((e) => ({ entry: e, done: api.repairDerivedFields(e) }));
  const wantBase = api.computeDbBaseHash(db);
  const baseChanged = db.baseHash !== wantBase;
  if (baseChanged) db.baseHash = wantBase;
  return { repaired, baseChanged };
}

/* ============================================================================
   reporting
   ==========================================================================*/

const CODES = {
  E1: "history length / rev numbering",
  E2: "payload.metadataRevision",
  E3: "history does not replay to payload",
  E4: "contentHash stale",
  E5: "history baseHash inconsistent",
  E6: "stored status disagrees with kindOf()",
  E7: "revisionOf does not resolve to one published parent",
  D1: "database baseHash stale",
};

/* Two different questions, deliberately kept apart.

   REPAIRABLE - what --fix is answerable for. Anything outside this set survives a repair by
   definition, so it must not block the write: refusing to fix 38 stale hashes because one
   entry has an unrelated content problem helps nobody.

   WARNINGS - what --check tolerates. E2 alone: a metadataRevision that disagrees with the
   entry's revision is a payload value the tool rewrites on the next edit anyway, and a gate
   that can never go green is a gate everyone learns to ignore. Everything else fails --check,
   including codes --fix cannot repair - E6 and E7 are genuinely invalid states that want a
   human decision, not silence. */
const REPAIRABLE = new Set(["E1", "E3", "E4", "E5", "D1"]);
const WARNINGS = new Set(["E2"]);
const isFailure = (v) => !WARNINGS.has(v.code);

function summarise(report) {
  const counts = {};
  for (const { violations } of report.entries) {
    for (const v of new Set(violations.map((v) => v.code))) counts[v] = (counts[v] || 0) + 1;
  }
  for (const v of report.dbViolations) counts[v.code] = (counts[v.code] || 0) + 1;
  return counts;
}

/* Returns true when nothing that --fix is answerable for is outstanding. */
function printReport(file, report, api) {
  const bad = report.entries.filter((e) => e.violations.length);
  const failures =
    report.entries.reduce((n, e) => n + e.violations.filter(isFailure).length, 0) +
    report.dbViolations.filter(isFailure).length;
  const warnings =
    report.entries.reduce((n, e) => n + e.violations.filter((v) => !isFailure(v)).length, 0) +
    report.dbViolations.filter((v) => !isFailure(v)).length;

  const verdict = failures ? "FAIL" : warnings ? `OK, ${warnings} warning${warnings === 1 ? "" : "s"}` : "OK";
  console.log(`${path.basename(file)}  ${verdict}  (${report.entries.length} entries)`);
  if (!failures && !warnings) return true;

  const counts = summarise(report);
  for (const code of Object.keys(CODES)) {
    if (!counts[code]) continue;
    const label = `${code} ${CODES[code]}${WARNINGS.has(code) ? " (warning)" : ""}`;
    console.log(`  ${label.padEnd(56, ".")} ${counts[code]}`);
  }
  for (const { entry, violations } of bad) {
    console.log(`  ${entryName(entry)} (rev ${entry.rev}, ${entry.status})`);
    for (const v of violations) console.log(`      ${v.code} ${v.detail}`);
  }
  for (const v of report.dbViolations) console.log(`      ${v.code} ${v.detail}`);
  return failures === 0;
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
  const doFix = args.includes("--fix");
  const doCheck = args.includes("--check");
  const files = args.filter((a) => !a.startsWith("--"));

  if (doFix === doCheck) {
    console.error("usage: node db_integrity.js (--check | --fix) [file.json ...]");
    return 2;
  }

  const api = liftPrimitives();
  selfTest(api);

  const targets = files.length ? files.map((f) => path.resolve(f)) : DEFAULT_DBS;
  for (const file of targets) {
    if (!fs.existsSync(file)) fail(`${file} not found`);
  }

  let failures = 0;

  for (const file of targets) {
    const db = readDb(file);
    const original = db.__text;
    delete db.__text;

    /* T4: rewriting an untouched database has to be byte-neutral, otherwise every repair
       would bury its real changes under a reformat. */
    if (serialise(db) !== original) {
      fail(
        `${path.basename(file)} is not stored the way the tool writes it ` +
          `(JSON.stringify(db,null,2), no trailing newline). Refusing to rewrite it, because ` +
          `doing so would reformat the whole file.`
      );
    }

    if (doCheck) {
      if (!printReport(file, checkDb(api, db), api)) failures++;
      continue;
    }

    const { repaired, baseChanged } = repairDb(api, db);
    const touched = repaired.filter((r) => r.done.length);

    /* Repairing only derived fields cannot resolve a content divergence. If one survives,
       say so and write nothing - a stale hash is a visible defect, a hash freshly computed
       over a payload its own history contradicts is a hidden one. */
    const after = checkDb(api, db);
    const blocking = after.entries
      .map((e) => ({ entry: e.entry, violations: e.violations.filter((v) => REPAIRABLE.has(v.code)) }))
      .filter((e) => e.violations.length);
    /* Database-level violations are filtered the same way as the per-entry ones. D1 is
       repairable and so must be gone by now; E7 is not, and must not hold up the write. */
    const blockingDb = after.dbViolations.filter((v) => REPAIRABLE.has(v.code));
    if (blocking.length || blockingDb.length) {
      console.error(`${path.basename(file)}  NOT WRITTEN - violations remain after repair:`);
      printReport(file, { entries: blocking, dbViolations: blockingDb }, api);
      console.error(
        `      These are payload-content problems, which this script does not touch. ` +
          `Resolve them in the tool (or by an explicit, documented edit) and run again.`
      );
      failures++;
      continue;
    }

    /* Left standing on purpose - reported so the write is not silently hiding them. */
    const noted = after.entries.filter((e) => e.violations.length);
    for (const { entry, violations } of noted) {
      for (const v of violations) {
        console.log(`${path.basename(file)}  note: ${entryName(entry)} ${v.code} ${v.detail} (not repaired)`);
      }
    }
    for (const v of after.dbViolations) {
      console.log(`${path.basename(file)}  note: ${v.code} ${v.detail} (not repaired)`);
    }

    if (!touched.length && !baseChanged) {
      console.log(`${path.basename(file)}  already consistent, unchanged`);
      continue;
    }

    fs.writeFileSync(file, serialise(db), "utf8");
    const ops = touched.reduce((n, r) => n + r.done.length, 0);
    console.log(
      `${path.basename(file)}  repaired ${touched.length} of ${repaired.length} entries ` +
        `(${ops} field${ops === 1 ? "" : "s"}${baseChanged ? ", plus the database baseHash" : ""})`
    );
  }

  return failures ? 1 : 0;
}

process.exit(main(process.argv));
