#!/usr/bin/env node
/* Self-test for the parts of CIEmetaDB.html that cannot be checked by opening the tool.
 *
 *     node selftest.js
 *
 * Exit 0 when everything passes, 1 otherwise. No dependencies, no framework, no network, and
 * it writes only to a temporary directory which it removes again.
 *
 * Why this exists. Two behaviours are both critical and invisible:
 *
 *   - migrateDb() has to leave a database consistent. When it did not, the symptom was not an
 *     error but every entry being reported as a merge conflict, because a stale contentHash
 *     silently defeats historyContainsHash(). See the contentHash section of ./README.md.
 *   - the revision pair (Start revision / publish / discard) has to leave the published parent
 *     untouched and the history chain contiguous. Getting that wrong corrupts the audit trail
 *     of a published record.
 *
 * db_integrity.js --check guards the shipped databases, but it cannot guard either of these:
 * the shipped databases are already migrated, and no database contains a revision pair. So the
 * fixtures here are built on the fly.
 *
 * The tool's own functions are lifted verbatim out of CIEmetaDB.html and evaluated in a
 * sandbox, exactly as db_integrity.js does it, so this tests the shipped code rather than a
 * copy of it. The globals the tool expects (DB, editMeta) are provided, and the four UI calls
 * saveEnvelope() makes are stubbed.
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const HERE = __dirname;
const TOOL_DIR = path.join(HERE, "..");
const HTML = path.join(TOOL_DIR, "CIEmetaDB.html");
const INTEGRITY = path.join(HERE, "db_integrity.js");
const DATASET = "CIEmetaDBdataset.json";
const STARTER_SHORT = "CIEmetaDB_starter_short.json";
const WITNESS = "CIE_std_illum_A_1nm.csv";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "ciemetadb-selftest-"));

/* ============================================================================
   lift the tool's code
   ==========================================================================*/

const CONSTS = ["SHA_K", "_enc", "DEFAULT_DOMAINS", "DEFAULT_VALUES"];
const LETS = ["migrationRepairs", "editMeta", "editDirty"];
const FUNCTIONS = [
  // hashing and patching
  "sha256Bytes", "sha256Str", "canonical", "contentHash", "clone", "nowISO", "uuid",
  "ptrTokens", "applyPatch", "esc6902", "diffPatch", "reconstruct", "contentDiff",
  "repairDerivedFields", "entryEnvFingerprint", "computeDbBaseHash",
  // entry identity and state
  "entryDoi", "kindOf", "pendingRev", "isRevision", "isRevisionPair", "isLocked",
  // editing and revisions
  "createEntry", "storeDraft", "publishEntry", "startRevision", "discardRevision",
  "publishRevisionPair", "openRevisionOf", "parentOf", "doiClashesWith",
  "metaChanged", "resetEditMeta", "saveEnvelope",
  // migration
  "migrateStatuses", "migrateDb",
];

/* A declaration runs from its own line to the next line that starts one, all of these being at
   column 0 in CIEmetaDB.html. Brace matching is deliberately avoided: esc6902 contains the
   regex literal /\//g, whose "//" makes a naive scanner treat the rest of the line as a comment
   and run past the closing brace. */
const STARTS_DECL = /^(function |const |let |var |\/\*|\/\/)/;

function liftDeclarations() {
  const lines = fs.readFileSync(HTML, "utf8").split("\n");
  const take = (firstLine) => {
    const start = lines.findIndex((l) => l.startsWith(firstLine));
    if (start < 0) return null;
    let end = start + 1;
    while (end < lines.length && !STARTS_DECL.test(lines[end])) end++;
    return lines.slice(start, end).join("\n");
  };
  const missing = [];
  let source = "";
  for (const name of CONSTS) {
    const t = take(`const ${name}`);
    t === null ? missing.push(`const ${name}`) : (source += t + "\n");
  }
  for (const name of LETS) {
    const t = take(`let ${name}`);
    t === null ? missing.push(`let ${name}`) : (source += t + "\n");
  }
  for (const name of FUNCTIONS) {
    const t = take(`function ${name}(`);
    t === null ? missing.push(`function ${name}()`) : (source += t + "\n");
  }
  if (missing.length) {
    console.error(
      `error: these declarations were not found in ${path.basename(HTML)}:\n` +
        missing.map((m) => "        " + m).join("\n") +
        "\n      They were renamed or reformatted. This script drives the tool's own code" +
        "\n      rather than a copy, so it has to be pointed at their new names."
    );
    process.exit(2);
  }

  /* DB is a global the tool mutates in place; the sandbox exposes it through accessors so the
     suites can install a fixture. The UI calls saveEnvelope() makes are no-ops here - what is
     under test is what it does to the entry, not what it draws. */
  const preamble =
    "let DB=null;\n" +
    'function currentUser(){ return "selftest"; }\n' +
    "function persist(){}\nfunction renderList(){}\nfunction renderDetail(){}\nfunction toast(){}\n";
  const exports =
    "({" +
    FUNCTIONS.join(",") +
    ", setDB:(v)=>{DB=v;}, getDB:()=>DB, migrationRepairs:()=>migrationRepairs," +
    " setEditMeta:(v)=>{editMeta=v;}})";

  return vm.runInNewContext(preamble + source + "\n" + exports, {
    TextEncoder, JSON, Object, Array, String, Number, Math, Uint8Array, Uint32Array, Date,
    console, window: {},
  });
}

const api = liftDeclarations();

/* ============================================================================
   runner
   ==========================================================================*/

let total = 0;
let failed = 0;
const suite = (name) => console.log(`\n${name}`);
function ok(cond, msg) {
  total++;
  if (!cond) failed++;
  console.log(`  ${cond ? "pass" : "FAIL"}  ${msg}`);
}

const readDb = (name) => JSON.parse(fs.readFileSync(path.join(TOOL_DIR, name), "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));
const nameOf = (e) => {
  const alt = ((e.payload && e.payload.alternateIdentifiers) || []).find((a) =>
    /^CIE_/.test(a.alternateIdentifier || "")
  );
  return alt ? alt.alternateIdentifier : e.entryId;
};

/* db_integrity.js insists a database is stored the way the tool writes it, so fixtures are
   serialised the same way. Returns its exit status and output. */
function integrity(mode, db, fixtureName) {
  const file = path.join(TMP, fixtureName);
  fs.writeFileSync(file, JSON.stringify(db, null, 2), "utf8");
  try {
    return { ok: true, out: require("child_process").execFileSync(process.execPath, [INTEGRITY, mode, file], { encoding: "utf8" }) };
  } catch (e) {
    return { ok: false, out: (e.stdout || "") + (e.stderr || "") };
  }
}
/* count of a violation code in a --check report, read off the summary line */
const codeCount = (out, code) => {
  const m = out.match(new RegExp("^\\s+" + code + " .*?(\\d+)\\s*$", "m"));
  return m ? Number(m[1]) : 0;
};

/* ============================================================================
   1. the lifted code really is the tool's code
   ==========================================================================*/

suite("1. lifted primitives");
{
  const db = readDb(DATASET);
  const witness = db.entries.find((e) => nameOf(e) === WITNESS);
  ok(!!witness, `${WITNESS} is present to act as the witness entry`);
  if (witness) {
    /* The one entry whose contentHash the tool itself wrote after metadataRevision was
       introduced. Reproducing it proves the lift is faithful. */
    ok(api.contentHash(witness.payload) === witness.contentHash,
       "lifted contentHash reproduces the hash the tool stored");
    const canon = api.canonical(witness.payload);
    ok(crypto.createHash("sha256").update(canon, "utf8").digest("hex") === api.sha256Str(canon),
       "the tool's hand-rolled sha256 agrees with node crypto");
  }
  const added = api.diffPatch({}, { metadataRevision: 1 }, "");
  const replaced = api.diffPatch({ metadataRevision: 1 }, { metadataRevision: 2 }, "");
  ok(added.length === 1 && added[0].op === "add" && added[0].path === "/metadataRevision" &&
     replaced.length === 1 && replaced[0].op === "replace",
     "diffPatch emits add for a new key and replace for a changed one");
}

/* ============================================================================
   2. migrateDb
   ==========================================================================*/

/* The state these databases were in before metadataRevision existed: the field absent from
   every payload and patch, and the hashes computed over those payloads. */
function makeLegacy(name) {
  const db = readDb(name);
  for (const e of db.entries) {
    delete e.payload.metadataRevision;
    for (const h of e.history) h.patch = h.patch.filter((op) => op.path !== "/metadataRevision");
    e.contentHash = api.contentHash(e.payload);
    for (let i = 1; i < e.history.length; i++) e.history[i].baseHash = api.contentHash(api.reconstruct(e.history, i));
  }
  db.baseHash = api.computeDbBaseHash(db);
  return db;
}

/* How the two-state model stored unpublished edits to a published record: status draft, rev
   still pointing at the published revision. migrateStatuses splits these into a pair. */
function addLegacyDraft(db) {
  const source = db.entries.find((e) => e.status === "published" && e.rev > 0);
  const draft = clone(source);
  draft.entryId = "00000000-0000-4000-8000-00000000dr01";
  draft.status = "draft";
  draft.payload.titles[0].title += " (pending edit)";
  delete draft.payload.metadataRevision;
  draft.contentHash = api.contentHash(draft.payload);
  db.entries.push(draft);
  db.baseHash = api.computeDbBaseHash(db);
  return { entryId: draft.entryId, rev: draft.rev, count: db.entries.length };
}

for (const name of [DATASET, STARTER_SHORT]) {
  suite(`2. migrateDb on a pre-4.1 ${name} carrying a legacy draft`);
  const legacy = makeLegacy(name);
  const draft = addLegacyDraft(legacy);

  /* The hash chain of a pre-4.1 database is sound - it simply lacks the field. The legacy
     draft draws exactly two violations, and both are correct: kindOf() reads rev > 0 with no
     revisionOf as published, so its stored "draft" is an E6, and its payload being ahead of
     its history is an E3. That is the state migrateStatuses exists to resolve. */
  const before = integrity("--check", legacy, "legacy_" + name);
  ok(codeCount(before.out, "E4") === 0, "the pre-4.1 hash chain is sound (no E4)");
  ok(codeCount(before.out, "E3") === 1 && codeCount(before.out, "E6") === 1,
     "only the legacy draft is flagged (E3 x1, E6 x1)");

  /* The one-line backfill this replaced: payload touched, nothing recomputed. */
  const oldWay = clone(legacy);
  for (const e of oldWay.entries) if (e.payload.metadataRevision == null) e.payload.metadataRevision = e.rev;
  const broken = integrity("--check", oldWay, "oldbackfill_" + name);
  ok(!broken.ok && /E3/.test(broken.out) && /E4/.test(broken.out),
     "the old payload-only backfill reproduces defect 7 (E3 and E4 appear)");

  const migrated = api.migrateDb(clone(legacy));
  ok(api.migrationRepairs() > 0, `migrateDb reported ${api.migrationRepairs()} repaired derived fields`);
  ok(migrated.entries.every((e) => e.payload.metadataRevision != null),
     "every payload carries metadataRevision again");
  ok(migrated.entries.every((e) => e.payload.metadataRevision === (api.kindOf(e) === "published" ? e.rev : e.rev + 1)),
     "metadataRevision is rev when published and rev+1 otherwise");

  const child = migrated.entries.find((e) => e.entryId === draft.entryId);
  const parent = child && migrated.entries.find((e) => e.entryId === child.revisionOf);
  ok(migrated.entries.length === draft.count + 1,
     `the legacy draft was split into a pair (${draft.count} entries -> ${migrated.entries.length})`);
  ok(!!child && child.status === "review" && !!child.revisionOf, "the draft became a revision");
  ok(!!parent && parent.status === "published" && parent.rev === draft.rev,
     `its parent exists, published at rev ${parent && parent.rev}`);
  ok(!!parent && parent.payload.metadataRevision === draft.rev, "parent metadataRevision equals rev");
  ok(!!child && child.payload.metadataRevision === draft.rev + 1, "child metadataRevision equals rev + 1");
  ok(!!parent && api.canonical(api.reconstruct(parent.history, parent.rev)) === api.canonical(parent.payload),
     "the parent's history replays to its payload");
  ok(!!child && api.canonical(api.reconstruct(child.history, child.rev)) !== api.canonical(child.payload),
     "the child's payload is ahead of its history, as a pending revision should be");

  migrated.baseHash = api.computeDbBaseHash(migrated);
  ok(integrity("--check", migrated, "migrated_" + name).ok, "the migrated database passes --check");

  api.migrateDb(migrated);
  ok(api.migrationRepairs() === 0, "migrating an already-migrated database repairs nothing");
}

/* ============================================================================
   3. db_integrity's own invariants
   ==========================================================================*/

suite("3. db_integrity invariants");
{
  const base = readDb(STARTER_SHORT);

  /* A legitimate revision pair: a clone with an edit. This is the case the first version of E6
     wrongly rejected, because a revision starts life identical to its parent. */
  const withPair = clone(base);
  const parent = withPair.entries[1];
  const revision = clone(parent);
  revision.entryId = "00000000-0000-4000-8000-0000000000r1";
  revision.revisionOf = parent.entryId;
  revision.status = "review";
  revision.payload.titles[0].title += " (pending)";
  revision.payload.metadataRevision = revision.rev + 1;
  api.repairDerivedFields(revision);
  withPair.entries.push(revision);
  withPair.baseHash = api.computeDbBaseHash(withPair);
  ok(integrity("--check", withPair, "pair_ok.json").ok, "a legitimate revision pair passes");

  const empty = clone(withPair);
  const emptyRev = empty.entries[empty.entries.length - 1];
  emptyRev.payload = clone(empty.entries[1].payload);
  emptyRev.payload.metadataRevision = emptyRev.rev + 1;
  api.repairDerivedFields(emptyRev);
  empty.baseHash = api.computeDbBaseHash(empty);
  ok(integrity("--check", empty, "pair_empty.json").ok,
     "a revision that still matches its parent passes too - you start one before editing it");

  const staleStatus = clone(base);
  staleStatus.entries[0].status = "draft";
  const r1 = integrity("--check", staleStatus, "e6.json");
  ok(!r1.ok && codeCount(r1.out, "E6") === 1, "E6 catches a status that disagrees with kindOf()");

  const orphan = clone(base);
  orphan.entries[0].revisionOf = "does-not-exist";
  orphan.entries[0].status = "review";
  const r2 = integrity("--check", orphan, "e7_orphan.json");
  ok(!r2.ok && codeCount(r2.out, "E7") === 1, "E7 catches a revisionOf with no parent in the database");

  const twice = clone(withPair);
  const dup = clone(twice.entries[twice.entries.length - 1]);
  dup.entryId = "00000000-0000-4000-8000-0000000000r2";
  twice.entries.push(dup);
  twice.baseHash = api.computeDbBaseHash(twice);
  const r3 = integrity("--check", twice, "e7_twice.json");
  ok(!r3.ok && codeCount(r3.out, "E7") === 1, "E7 catches two revisions claiming one parent");

  /* E6 and E7 are not repairable, and must not hold up the hash repairs of other entries. */
  ok(integrity("--fix", orphan, "e7_orphan_fix.json").ok, "--fix still writes when an unrepairable E7 is present");
  ok(integrity("--fix", staleStatus, "e6_fix.json").ok, "--fix still writes when an unrepairable E6 is present");

  /* and the repair path itself: break something repairable, fix it, confirm it is clean */
  const stale = clone(base);
  stale.entries[0].contentHash = "0".repeat(64);
  const r4 = integrity("--check", stale, "e4.json");
  ok(!r4.ok && codeCount(r4.out, "E4") === 1, "E4 catches a stale contentHash");
  const fixFile = "e4_fix.json";
  ok(integrity("--fix", stale, fixFile).ok, "--fix repairs it");
  const repaired = JSON.parse(fs.readFileSync(path.join(TMP, fixFile), "utf8"));
  ok(integrity("--check", repaired, "e4_after.json").ok, "and the result passes --check");
}

/* ============================================================================
   4. the revision pair
   ==========================================================================*/

suite("4. revision pair lifecycle");
{
  const db = readDb(STARTER_SHORT);
  api.setDB(db);
  const parent = db.entries.find((e) => api.kindOf(e) === "published" && e.rev > 0);
  const parentBefore = clone(parent);

  const revision = api.startRevision(parent);
  db.entries.push(revision);

  ok(revision.revisionOf === parent.entryId && revision.rev === parent.rev,
     "startRevision clones the parent at the same rev and points revisionOf at it");
  ok(api.canonical(revision.payload) === api.canonical(parent.payload) &&
     revision.history.length === parent.history.length,
     "the clone carries the parent's payload and its whole history");
  ok(revision.entryId !== parent.entryId, "the revision has an identity of its own");
  ok(api.kindOf(revision) === "review" && api.kindOf(parent) === "published",
     "kindOf reports review and published for the two halves");
  ok(api.isLocked(parent) && !api.isLocked(revision), "the parent is locked, the revision is not");
  ok(api.isRevisionPair(parent, revision) && api.isRevisionPair(revision, parent),
     "the two are recognised as a pair, in both directions");
  ok(api.parentOf(revision) === parent && api.openRevisionOf(parent) === revision,
     "parentOf and openRevisionOf resolve the pair");
  ok(api.canonical(parentBefore) === api.canonical(parent), "starting a revision left the parent untouched");

  /* the shared DOI is legitimate while the revision is open, but only for the pair */
  const doi = api.entryDoi(revision);
  ok(api.doiClashesWith(revision, doi) === null, "the pair is exempt from the duplicate-DOI rule");
  const unrelated = db.entries.find((e) => e.entryId !== parent.entryId && e.entryId !== revision.entryId);
  const unrelatedDoiBefore = api.entryDoi(unrelated);
  unrelated.payload.identifier.identifier = doi;
  ok(api.doiClashesWith(revision, doi) === unrelated, "an unrelated entry sharing the DOI is still flagged");
  unrelated.payload.identifier.identifier = unrelatedDoiBefore;

  /* edit the revision */
  const edited = clone(revision.payload);
  edited.titles[0].title += " (revised)";
  ok(api.storeDraft(revision, edited), "storeDraft accepts the edit");
  ok(revision.payload.metadataRevision === parent.rev + 1,
     "the pending payload carries the revision it will become");
  ok(api.kindOf(revision) === "review", "it is still a revision after the edit");
  ok(api.repairDerivedFields(revision).length === 0, "storeDraft left the derived fields consistent");
  ok(api.canonical(parentBefore) === api.canonical(parent), "editing the revision left the parent untouched");

  /* publish, collapsing the pair */
  const revBefore = parent.rev;
  const published = api.publishRevisionPair(revision, revision.payload, "revision published by selftest");
  ok(published, "publishRevisionPair reports success");
  ok(revision.rev === revBefore + 1 && revision.history.length === revBefore + 1,
     `rev advanced ${revBefore} -> ${revision.rev} with a matching history length`);
  ok(revision.revisionOf === undefined, "revisionOf is cleared, so it is no longer half of a pair");
  ok(api.kindOf(revision) === "published", "it is now simply published");
  ok(!db.entries.some((e) => e.entryId === parent.entryId), "the parent row has been removed");
  ok(revision.history.every((h, i) => h.rev === i + 1), "the history chain is contiguous after the collapse");
  ok(api.canonical(api.reconstruct(revision.history, revision.rev)) === api.canonical(revision.payload),
     "the collapsed entry's history replays to its payload");
  ok(api.repairDerivedFields(revision).length === 0, "publishing left the derived fields consistent");
  ok(api.canonical(api.reconstruct(revision.history, revBefore)) === api.canonical(parentBefore.payload),
     "the published parent is still reconstructable from the chain, at its own revision");

  /* discard, which must restore the parent exactly */
  const db2 = readDb(STARTER_SHORT);
  api.setDB(db2);
  const parent2 = db2.entries.find((e) => api.kindOf(e) === "published" && e.rev > 0);
  const parent2Before = clone(parent2);
  const revision2 = api.startRevision(parent2);
  db2.entries.push(revision2);
  const edited2 = clone(revision2.payload);
  edited2.titles[0].title += " (to be discarded)";
  api.storeDraft(revision2, edited2);
  const count2 = db2.entries.length;
  const restored = api.discardRevision(revision2);
  ok(restored === parent2, "discardRevision returns the parent");
  ok(db2.entries.length === count2 - 1 && !db2.entries.some((e) => e.entryId === revision2.entryId),
     "the revision row is gone");
  ok(api.canonical(parent2Before) === api.canonical(parent2), "the parent is byte-identical to before the revision");

  /* publishing a brand-new record for the first time. rev 1 has no previous revision, so the
     schema requires baseHash null rather than a hash of anything. */
  const fresh = api.createEntry(
    { identifier: { identifier: "10.25039/CIE.DS.selftest", identifierType: "DOI" },
      titles: [{ title: "selftest record" }], schemaName: "CIEmetaDigitalProduct",
      schemaVersion: 4, schemaURL: "https://doi.org/10.25039/CIE.SC.4taqevcd" },
    { status: "draft", comment: "New entry" }
  );
  ok(fresh.rev === 0 && fresh.history.length === 0, "a new draft starts at rev 0 with no history");
  const freshEdit = clone(fresh.payload);
  freshEdit.titles[0].title = "selftest record, edited";
  api.storeDraft(fresh, freshEdit);
  ok(api.publishEntry(fresh, fresh.payload, "first publish"), "publishing the new draft succeeds");
  ok(fresh.rev === 1 && fresh.history.length === 1, "it becomes rev 1 with one history record");
  ok(fresh.history[0].baseHash === null, "rev 1 records baseHash null, having no previous revision");
  ok(api.repairDerivedFields(fresh).length === 0, "the first publish left the derived fields consistent");

  /* envelope fields are editable on a published entry and must not mint a revision */
  const target = db2.entries.find((e) => api.kindOf(e) === "published");
  const snapshot = { rev: target.rev, history: target.history.length, status: target.status,
                     payload: api.canonical(target.payload), contentHash: target.contentHash };
  api.setEditMeta({ domains: ["D2"], landingPage: "https://cie.co.at/datatable/selftest" });
  api.saveEnvelope(target);
  ok(target.landingPage === "https://cie.co.at/datatable/selftest" &&
     api.canonical(target.domains) === api.canonical(["D2"]),
     "saveEnvelope stores the domains and the landing page");
  ok(target.rev === snapshot.rev && target.history.length === snapshot.history &&
     target.status === snapshot.status && api.canonical(target.payload) === snapshot.payload &&
     target.contentHash === snapshot.contentHash,
     "and leaves rev, history, status, payload and contentHash untouched");
  api.setDB(null);
}

/* ============================================================================
   done
   ==========================================================================*/

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${total - failed}/${total} checks passed${failed ? ` - ${failed} FAILED` : ""}`);
process.exit(failed ? 1 : 0);
