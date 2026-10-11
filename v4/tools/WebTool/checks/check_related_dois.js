#!/usr/bin/env node
/* Check that every related-item DOI in a CIEmetaDB metadatabase is actually registered.
 *
 * relatedItems[].relatedItemIdentifier is typed by hand, and the schema can only say that it is
 * a string. A transposed character or a DOI that was announced but never minted passes every
 * other check in this folder. This one asks doi.org: each distinct DOI (DOIs are
 * case-insensitive, so "tr.015.2018" and "TR.015.2018" are one) is resolved once through the
 * DOI Handle API, which answers for DataCite and Crossref DOIs alike.
 *
 *     node check_related_dois.js                  check CIEmetaDBdataset.json, write both reports
 *     node check_related_dois.js FILE...          check other databases instead
 *     node check_related_dois.js --out DIR        write the reports somewhere else
 *     node check_related_dois.js --quiet          reports only, no per-DOI console detail
 *
 * Exit 0 when every related-item DOI is registered, 1 when any is not found, not DOI-shaped or
 * could not be checked (the report keeps the three apart), 2 on a usage or self-test error.
 * Unlike the other checks this one needs the network, and node 18 or later for fetch().
 *
 * Nothing is reimplemented. normalizeDoi(), classifyDoiResponse(), checkDoi(), checkDois(),
 * relatedDoiIndex() and friends are lifted verbatim out of CIEmetaDB.html at run time - the
 * same code behind the tool's "Check related DOIs" dialog, and the same single-source-of-truth
 * reasoning as db_integrity.js and compare_published.js. Offline self-tests pin the lifted code
 * against canned doi.org replies before a single request is made.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* HERE is checks/, where the reports live; the tool and its databases sit one level up. */
const HERE = __dirname;
const TOOL_DIR = path.join(HERE, "..");
const HTML = path.join(TOOL_DIR, "CIEmetaDB.html");
const DEFAULT_DBS = [path.join(TOOL_DIR, "CIEmetaDBdataset.json")];
const REPORT_MD_NAME = "RELATED_DOI_REPORT.md";
const REPORT_JSON_NAME = "RELATED_DOI_REPORT.json";
const CONCURRENCY = 4;

/* ============================================================================
   lift the primitives out of CIEmetaDB.html
   ==========================================================================*/

const CONSTS = ["DOI_API"];
const FUNCTIONS = [
  "entryTitle",
  "normalizeDoi",
  "isDoiSyntax",
  "doiApiUrl",
  "classifyDoiResponse",
  "checkDoi",
  "checkDois",
  "relatedDoiIndex",
];

/* A declaration runs from its own line to the next line that starts one, all of these being
   written at column 0 in CIEmetaDB.html. Brace matching is deliberately avoided, as in the other
   checks: a regex literal containing "//" defeats a naive scanner. */
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
  const lines = fs.readFileSync(HTML, "utf8").split(/\r?\n/);
  const missing = [];
  let source = "";
  for (const name of CONSTS) {
    const text = liftDeclaration(lines, `const ${name}=`);
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
  // no fetch in the sandbox: every call passes fetchImpl explicitly, so a lifted function that
  // reached for the global would fail loudly instead of silently using the network
  return vm.runInNewContext(`${source}\n({DOI_API,${FUNCTIONS.join(",")}})`, { console });
}

/* ============================================================================
   self-tests

   Offline and fatal: the lifted code is fed canned doi.org replies (the shapes observed from
   https://doi.org/api/handles/) through a stub fetch, so a failure here is a defect in the code,
   never a network problem, and it aborts the run before any DOI is judged.
   ==========================================================================*/

function stubFetch(replies) {
  const calls = [];
  const fn = (url) => {
    calls.push(url);
    // keyed by the last DOI segment, matched whole: "/<key>?type=URL"
    const key = Object.keys(replies).find((k) => url.includes("/" + k + "?"));
    if (key === undefined) return Promise.reject(new Error("stub: no reply for " + url));
    const r = replies[key];
    if (r instanceof Error) return Promise.reject(r);
    return Promise.resolve({ status: r.status, json: () => (r.body === undefined ? Promise.reject(new Error("no body")) : Promise.resolve(r.body)) });
  };
  fn.calls = calls;
  return fn;
}

async function selfTest(api) {
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail: detail || "" });

  // T1 normalizeDoi / isDoiSyntax
  const norm = [
    ["10.25039/tr.015.2018", "10.25039/tr.015.2018"],
    ["  10.25039/tr.015.2018 ", "10.25039/tr.015.2018"],
    ["https://doi.org/10.25039/TR.170-2.2015", "10.25039/TR.170-2.2015"],
    ["http://dx.doi.org/10.25039/S026.2018", "10.25039/S026.2018"],
    ["doi:10.25039/tr.224.2017", "10.25039/tr.224.2017"],
    [undefined, ""],
  ];
  const badNorm = norm.filter(([a, b]) => api.normalizeDoi(a) !== b);
  check("T1 normalizeDoi strips resolver prefixes and whitespace", !badNorm.length, badNorm.map(([a]) => JSON.stringify(a)).join(", "));
  const syn = [
    ["10.25039/tr.015.2018", true],
    ["10.1000/a/b", true],
    ["10.25039/", false],
    ["11.25039/x", false],
    ["CIE 015:2018", false],
    ["", false],
  ];
  const badSyn = syn.filter(([d, want]) => api.isDoiSyntax(d) !== want);
  check("T1 isDoiSyntax accepts 10.<prefix>/<suffix> only", !badSyn.length, badSyn.map(([d]) => JSON.stringify(d)).join(", "));

  // T2 doiApiUrl keeps the prefix/suffix "/" and escapes everything else
  const u = api.doiApiUrl("10.1000/a b#c/d");
  check("T2 doiApiUrl encodes each segment", u === "https://doi.org/api/handles/10.1000/a%20b%23c/d?type=URL", u);

  // T3 classifyDoiResponse on the replies doi.org gives
  const found = { responseCode: 1, handle: "10.25039/tr.015.2018", values: [{ index: 1, type: "URL", data: { format: "string", value: "https://cie.co.at/publications/colorimetry-4th-edition" } }] };
  const c1 = api.classifyDoiResponse(200, found);
  check("T3 200 + responseCode 1 is registered, with target", c1.state === "exists" && c1.target === found.values[0].data.value, JSON.stringify(c1));
  const c2 = api.classifyDoiResponse(404, { responseCode: 100, handle: "10.25039/nope" });
  check("T3 404 + responseCode 100 is not found", c2.state === "missing", JSON.stringify(c2));
  const c3 = api.classifyDoiResponse(200, { responseCode: 200, handle: "10.1/x", values: [] });
  check("T3 responseCode 200 (handle without URL value) is registered", c3.state === "exists" && c3.target === "", JSON.stringify(c3));
  const c4 = api.classifyDoiResponse(500, null);
  check("T3 a server error is undecided, not not-found", c4.state === "error", JSON.stringify(c4));
  const c5 = api.classifyDoiResponse(200, { responseCode: 2 });
  check("T3 responseCode 2 (handle server error) is undecided", c5.state === "error", JSON.stringify(c5));

  // T4 checkDoi end to end through a stub fetch
  const f = stubFetch({
    "tr.015.2018": { status: 200, body: found },
    "nope": { status: 404, body: { responseCode: 100 } },
    "garbled": { status: 502, body: undefined },
    "offline": new Error("ECONNRESET"),
  });
  const r1 = await api.checkDoi("https://doi.org/10.25039/tr.015.2018", f);
  check("T4 checkDoi: registered DOI", r1.state === "exists" && r1.doi === "10.25039/tr.015.2018", JSON.stringify(r1));
  const r2 = await api.checkDoi("10.25039/nope", f);
  check("T4 checkDoi: unregistered DOI", r2.state === "missing", JSON.stringify(r2));
  const r3 = await api.checkDoi("10.25039/garbled", f);
  check("T4 checkDoi: unparsable reply is undecided", r3.state === "error", JSON.stringify(r3));
  const r4 = await api.checkDoi("10.25039/offline", f);
  check("T4 checkDoi: network failure resolves as error, never rejects", r4.state === "error" && /ECONNRESET/.test(r4.message), JSON.stringify(r4));
  const before = f.calls.length;
  const r5 = await api.checkDoi("CIE 015:2018", f);
  check("T4 checkDoi: non-DOI is invalid and makes no request", r5.state === "invalid" && f.calls.length === before, JSON.stringify(r5));

  // T5 checkDois asks each DOI once and returns all of them
  const g = stubFetch({ "a": { status: 200, body: { responseCode: 1, values: [] } }, "b": { status: 404, body: { responseCode: 100 } } });
  const m = await api.checkDois(["10.1000/a", "10.1000/b", "10.1000/a"], g, 4);
  check("T5 checkDois dedupes and returns every DOI", m.size === 2 && g.calls.length === 2 && m.get("10.1000/a").state === "exists" && m.get("10.1000/b").state === "missing", `size ${m.size}, calls ${g.calls.length}`);
  const empty = await api.checkDois([], g, 4);
  check("T5 checkDois on no DOIs", empty.size === 0);

  // T6 relatedDoiIndex merges case variants and skips non-DOI identifiers
  const ri = (id, type) => ({ relatedItemIdentifier: id, relatedItemIdentifierType: type || "DOI", relationType: "IsPartOf", titles: ["t"] });
  const entries = [
    { entryId: "e1", payload: { titles: [{ title: "One" }], relatedItems: [ri("10.25039/tr.015.2018"), ri("http://example.org", "URL")] } },
    { entryId: "e2", payload: { titles: [{ title: "Two" }], relatedItems: [ri("10.25039/TR.015.2018"), ri("10.25039/tr.018.2019")] } },
    { entryId: "e3", payload: { titles: [{ title: "Three" }] } },
  ];
  const idx = api.relatedDoiIndex(entries);
  const tr015 = idx.get("10.25039/tr.015.2018");
  check(
    "T6 relatedDoiIndex merges case variants, keeps stored identifiers",
    idx.size === 2 && tr015 && tr015.refs.length === 2 && tr015.refs[1].identifier === "10.25039/TR.015.2018" && tr015.refs[0].title === "One",
    `size ${idx.size}`
  );

  return results;
}

/* ============================================================================
   collect and check
   ==========================================================================*/

function readJson(file, what) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail(`${what} (${file}) is not valid JSON: ${e.message}`);
  }
}

/* one record per distinct DOI across all databases given, referencing entries per database */
async function collect(api, files, quiet) {
  const merged = new Map();
  const databases = [];
  for (const file of files) {
    const db = readJson(file, "the database");
    if (!db || !Array.isArray(db.entries)) fail(`${file} has no entries[] - is it a CIEmetaDB database?`);
    const idx = api.relatedDoiIndex(db.entries);
    let items = 0;
    for (const [key, v] of idx) {
      items += v.refs.length;
      if (!merged.has(key)) merged.set(key, { doi: v.doi, refs: [] });
      merged.get(key).refs.push(...v.refs.map((r) => ({ database: path.basename(file), ...r })));
    }
    databases.push({ file: path.basename(file), entries: db.entries.length, relatedDoiItems: items, distinctDois: idx.size });
  }

  const keys = [...merged.keys()].sort();
  const progress = !quiet && process.stdout.isTTY;
  const results = await api.checkDois(keys.map((k) => merged.get(k).doi), fetch, CONCURRENCY, (d, r, done) => {
    if (progress) process.stdout.write(`\r  asked doi.org ${done}/${keys.length}`);
  });
  if (progress && keys.length) process.stdout.write("\r" + " ".repeat(40) + "\r");

  const records = keys.map((k) => {
    const v = merged.get(k);
    const r = results.get(v.doi);
    return { doi: v.doi, state: r.state, target: r.target, message: r.message, references: v.refs };
  });
  return { databases, records };
}

/* ============================================================================
   report
   ==========================================================================*/

const STATE_LABEL = { exists: "✓ registered", missing: "✗ not found", invalid: "✗ invalid", error: "⚠ could not check" };

function mdEscape(s) {
  return String(s).replace(/\|/g, "\\|");
}

function counts(records) {
  const n = (s) => records.filter((r) => r.state === s).length;
  return { exists: n("exists"), missing: n("missing"), invalid: n("invalid"), error: n("error") };
}

function printConsole(res, quiet) {
  const c = counts(res.records);
  const bad = c.missing + c.invalid + c.error;
  for (const d of res.databases)
    console.log(`${d.file}: ${d.entries} entries, ${d.relatedDoiItems} related items with a DOI, ${d.distinctDois} distinct DOIs`);
  console.log(`related-item DOIs  ${bad ? "FAIL" : "OK"}  ${c.exists} registered, ${c.missing} not found, ${c.invalid} invalid, ${c.error} could not be checked`);
  for (const r of res.records) {
    if (quiet && r.state === "exists") continue;
    console.log(`  ${STATE_LABEL[r.state].padEnd(18)} ${r.doi}${r.target ? "  ->  " + r.target : ""}${r.state !== "exists" ? "  (" + r.message + ")" : ""}`);
    if (r.state !== "exists") for (const ref of r.references) console.log(`        referenced by ${ref.title} [${ref.database}, ${ref.relationType}]`);
  }
}

function buildMarkdown(res, selfTests, when) {
  const c = counts(res.records);
  const L = [];
  L.push("# Related-item DOI report");
  L.push("");
  L.push(`Generated ${when} by \`check_related_dois.js\` over ${res.databases.map((d) => `\`${d.file}\``).join(", ")}.`);
  L.push("");
  L.push(
    "Every distinct `relatedItems[].relatedItemIdentifier` of type DOI, resolved once through the DOI Handle API " +
      "(`https://doi.org/api/handles/<doi>`), using the functions lifted verbatim from `CIEmetaDB.html` that also " +
      "drive the tool's **Check related DOIs** dialog. DOIs are compared case-insensitively. *Registered* means " +
      "doi.org knows the handle; it says nothing about whether the landing page itself is reachable."
  );
  L.push("");
  L.push("## Summary");
  L.push("");
  L.push("| Database | Entries | Related items with a DOI | Distinct DOIs |");
  L.push("|---|---:|---:|---:|");
  for (const d of res.databases) L.push(`| \`${mdEscape(d.file)}\` | ${d.entries} | ${d.relatedDoiItems} | ${d.distinctDois} |`);
  L.push("");
  L.push(`- ✓ registered: **${c.exists}**`);
  L.push(`- ✗ not found: **${c.missing}**`);
  L.push(`- ✗ invalid (not DOI-shaped): **${c.invalid}**`);
  L.push(`- ⚠ could not be checked: **${c.error}**`);
  L.push("");
  L.push("## DOIs");
  L.push("");
  L.push("| DOI | Status | Resolves to | Referenced by |");
  L.push("|---|---|---|---:|");
  for (const r of res.records)
    L.push(
      `| [${mdEscape(r.doi)}](https://doi.org/${encodeURI(r.doi)}) | ${STATE_LABEL[r.state]} | ${r.target ? mdEscape(r.target) : r.message ? mdEscape(r.message) : ""} | ${r.references.length} |`
    );
  L.push("");
  const failing = res.records.filter((r) => r.state !== "exists");
  if (failing.length) {
    L.push("## Entries referencing a DOI that is not registered or could not be checked");
    L.push("");
    for (const r of failing) {
      L.push(`### ${mdEscape(r.doi)} - ${STATE_LABEL[r.state]}`);
      L.push("");
      L.push(`${mdEscape(r.message)}`);
      L.push("");
      for (const ref of r.references) L.push(`- ${mdEscape(ref.title)} (\`${mdEscape(ref.database)}\`, entry \`${mdEscape(ref.entryId)}\`, ${mdEscape(ref.relationType)}, stored as \`${mdEscape(ref.identifier)}\`)`);
      L.push("");
    }
  }
  L.push("## Self-tests");
  L.push("");
  for (const t of selfTests) L.push(`- ${t.ok ? "✓" : "✗"} ${mdEscape(t.name)}${t.detail ? ` - ${mdEscape(t.detail)}` : ""}`);
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

async function main(argv) {
  const args = argv.slice(2);
  const quiet = args.includes("--quiet");
  const outIdx = args.indexOf("--out");
  if (args.some((a) => a.startsWith("--") && !["--quiet", "--out"].includes(a)) || (outIdx >= 0 && !args[outIdx + 1])) {
    console.error("usage: node check_related_dois.js [FILE...] [--out DIR] [--quiet]");
    return 2;
  }
  const outDir = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : HERE;
  const fileArgs = args.filter((a, i) => !a.startsWith("--") && !(outIdx >= 0 && i === outIdx + 1));
  const files = fileArgs.length ? fileArgs.map((f) => path.resolve(f)) : DEFAULT_DBS;
  for (const f of files) if (!fs.existsSync(f)) fail(`${f} not found`);
  if (typeof fetch !== "function") fail(`this node (${process.version}) has no global fetch(); node 18 or later is needed`);

  const api = liftPrimitives();
  const selfTests = await selfTest(api);
  const failed = selfTests.filter((t) => !t.ok);
  if (failed.length) {
    for (const t of failed) console.error(`  ✗ ${t.name}${t.detail ? `: ${t.detail}` : ""}`);
    fail(`${failed.length} self-test(s) failed; no DOI was checked`);
  }

  const res = await collect(api, files, quiet);
  const when = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  fs.writeFileSync(path.join(outDir, REPORT_JSON_NAME), JSON.stringify({ date: when, ...res }, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(outDir, REPORT_MD_NAME), buildMarkdown(res, selfTests, when), "utf8");

  printConsole(res, quiet);
  console.log(`  wrote ${REPORT_MD_NAME} and ${REPORT_JSON_NAME}` + (outDir === HERE ? "" : ` to ${outDir}`));
  return res.records.every((r) => r.state === "exists") ? 0 : 1;
}

main(process.argv).then((code) => process.exit(code), (e) => fail(e && e.stack ? e.stack : String(e)));
