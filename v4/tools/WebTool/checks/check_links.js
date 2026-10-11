#!/usr/bin/env node
/* Check that the DOI landing pages and unit PIDs in a CIEmetaDB metadatabase exist.
 *
 * Three questions, each asked once per distinct value:
 *   1. Does each landing page exist? Fetched directly, following redirects. The tool cannot ask
 *      this itself: cie.co.at sends no CORS headers, so a page opened from file:// cannot read
 *      the HTTP status.
 *   2. Does the entry's DOI, as registered at doi.org, resolve to that landing page? The same
 *      comparison as the tool's Check button beside the landing page.
 *   3. Does each unit PID exist at the BIPM SI Digital Framework? The same request as the tool's
 *      Check unit PIDs button.
 *
 *     node check_links.js                  check CIEmetaDBdataset.json, write both reports
 *     node check_links.js FILE...          check other databases instead
 *     node check_links.js --out DIR        write the reports somewhere else
 *     node check_links.js --quiet          reports only, no per-item console detail
 *
 * Exit 0 when everything resolves; 1 when a landing page is missing, a DOI is not registered or
 * resolves elsewhere, a unit PID is not found, or anything could not be checked; 2 on a usage or
 * self-test error. Needs the network and node 18 or later for fetch().
 *
 * Nothing is reimplemented: checkDoi(), landingPageFinding(), checkUnitPid(), unitPidFindings() and
 * friends are lifted verbatim out of CIEmetaDB.html at run time, as in the other checks. Only the
 * direct page fetch lives here, being the one thing the tool cannot do.
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
const REPORT_MD_NAME = "LINK_REPORT.md";
const REPORT_JSON_NAME = "LINK_REPORT.json";
const CONCURRENCY = 4;

/* ============================================================================
   lift the primitives out of CIEmetaDB.html
   ==========================================================================*/

const CONSTS = ["DOI_API", "SI_UNITS"];
const FUNCTIONS = [
  "entryTitle",
  "entryDoi",
  "entryFilename",
  "kindOf",
  "normalizeDoi",
  "isDoiSyntax",
  "doiApiUrl",
  "classifyDoiResponse",
  "checkDoi",
  "sameUrl",
  "landingPageFinding",
  "classifyUnitPidResponse",
  "checkUnitPid",
  "unitPidFindings",
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
  // no fetch in the sandbox: every call passes fetchImpl explicitly
  return vm.runInNewContext(`${source}\n({${CONSTS.join(",")},${FUNCTIONS.join(",")}})`, { console });
}

/* ============================================================================
   self-tests

   Offline and fatal: the lifted code is fed canned replies (the shapes observed from doi.org and
   the SI Digital Framework) through a stub fetch, so a failure here is a defect in the code,
   never a network problem, and it aborts the run before any request is made.
   ==========================================================================*/

function stubFetch(replies) {
  const calls = [];
  const fn = (url) => {
    calls.push(url);
    const key = Object.keys(replies).find((k) => url.endsWith(k) || url.includes(k + "?"));
    if (key === undefined) return Promise.reject(new Error("stub: no reply for " + url));
    const r = replies[key];
    if (r instanceof Error) return Promise.reject(r);
    return Promise.resolve({ status: r.status, json: () => (r.body === undefined ? Promise.reject(new Error("no JSON")) : Promise.resolve(r.body)) });
  };
  fn.calls = calls;
  return fn;
}

async function selfTest(api) {
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail: detail || "" });
  const LP = "https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer";

  // T1 sameUrl
  const same = [
    [LP, LP, true],
    [LP, LP + "/", true],
    [LP, LP.replace("https:", "http:"), true],
    [LP, LP.replace("cie.co.at", "CIE.co.at"), true],
    [LP, LP + "-other", false],
    ["", "", false],
  ];
  const badSame = same.filter(([a, b, want]) => api.sameUrl(a, b) !== want);
  check("T1 sameUrl ignores http/https, host case and a trailing slash, nothing else", !badSame.length, badSame.map((x) => x[1]).join(", "));

  // T2 landingPageFinding
  const reg = (target) => ({ doi: "10.25039/CIE.DS.x", state: "exists", target, message: "" });
  const f = [
    ["no landing page, nothing to say", api.landingPageFinding("", reg(LP)) === null],
    ["not an http(s) URL is an error, known offline", (api.landingPageFinding("cie.co.at/x", null) || {}).level === "e"],
    ["unchecked: nothing to say yet", api.landingPageFinding(LP, null) === null],
    ["DOI resolves to it: fine", api.landingPageFinding(LP, reg(LP + "/")) === null],
    ["DOI resolves elsewhere: warning naming the target", /resolves to https:\/\/cie\.co\.at\/other/.test((api.landingPageFinding(LP, reg("https://cie.co.at/other")) || {}).text || "")],
    ["DOI not registered: warning", (api.landingPageFinding(LP, { doi: "10.25039/CIE.DS.x", state: "missing", target: "", message: "" }) || {}).level === "w"],
    ["could not check: warning", (api.landingPageFinding(LP, { doi: "d", state: "error", target: "", message: "timeout" }) || {}).level === "w"],
  ];
  for (const [name, ok] of f) check("T2 landingPageFinding: " + name, ok);

  // T3 classifyUnitPidResponse on the replies the SI Digital Framework gives
  const c1 = api.classifyUnitPidResponse(200, { pid: api.SI_UNITS + "one", label: "one", symbol: "1" });
  const c2 = api.classifyUnitPidResponse(200, { status: 0, resultsCombinedUnitList: [{ unitName: "lumen", exponent: 1 }, { unitName: "watt", exponent: -1 }] });
  const c3 = api.classifyUnitPidResponse(200, { status: 0, resultsCombinedUnitList: [{ prefixName: "nano", unitName: "metre", exponent: 1 }] });
  check("T3 a simple unit exists, labelled", c1.state === "exists" && c1.label === "one", JSON.stringify(c1));
  check("T3 a compound unit exists, labelled by its factors", c2.state === "exists" && c2.label === "lumen watt^-1" && c3.label === "nanometre", c2.label + " / " + c3.label);
  check("T3 HTTP 400 (PARSING_FAILURE) is not found", api.classifyUnitPidResponse(400, null).state === "missing");
  check("T3 a server error is undecided", api.classifyUnitPidResponse(500, null).state === "error");

  // T4 checkUnitPid through a stub fetch
  const g = stubFetch({ nanometre: { status: 200, body: { status: 0, resultsCombinedUnitList: [{ prefixName: "nano", unitName: "metre", exponent: 1 }] } }, bogusunit: { status: 400, body: undefined }, offline: new Error("ECONNRESET") });
  const r1 = await api.checkUnitPid(api.SI_UNITS + "nanometre", g);
  const r2 = await api.checkUnitPid(api.SI_UNITS + "bogusunit", g);
  const r3 = await api.checkUnitPid(api.SI_UNITS + "offline", g);
  const before = g.calls.length;
  const r4 = await api.checkUnitPid("http://qudt.org/vocab/unit/NanoM", g);
  check("T4 checkUnitPid: known unit exists", r1.state === "exists", JSON.stringify(r1));
  check("T4 checkUnitPid: 400 with a text body is not found", r2.state === "missing", JSON.stringify(r2));
  check("T4 checkUnitPid: network failure resolves as error, never rejects", r3.state === "error" && /ECONNRESET/.test(r3.message), JSON.stringify(r3));
  check("T4 checkUnitPid: a PID outside the SI Digital Framework is not asked", r4.state === "other" && g.calls.length === before, JSON.stringify(r4));

  // T5 unitPidFindings groups columns per PID
  const one = api.SI_UNITS + "one", bad = api.SI_UNITS + "bogusunit", nm = api.SI_UNITS + "nanometre";
  const payload = { datatableInfo: { columnHeaders: [{ title: "lambda", unitPID: nm }, { title: "a", unitPID: bad }, { title: "b", unitPID: bad }, { title: "c", unitPID: one }, { title: "d" }] } };
  const cache = new Map([[nm, { state: "exists" }], [bad, { state: "missing", message: "not found at the BIPM SI Digital Framework" }]]);
  const uf = api.unitPidFindings(payload, cache);
  check(
    "T5 unitPidFindings: one error per missing PID naming its columns; unchecked PIDs counted",
    uf.findings.length === 1 && uf.findings[0].level === "e" && /columns 2, 3/.test(uf.findings[0].text) && uf.unchecked === 1,
    JSON.stringify(uf)
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

/* run fn over items with at most n in flight, keeping the order */
async function pool(items, n, fn, onDone) {
  const out = new Array(items.length);
  let next = 0, done = 0;
  const worker = async () => {
    while (next < items.length) {
      const k = next++;
      out[k] = await fn(items[k]);
      if (onDone) onDone(++done, items.length);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, worker));
  return out;
}

/* the one check the tool cannot make: fetch the page itself, following redirects */
async function fetchPage(url) {
  try {
    const r = await fetch(url, { redirect: "follow" });
    try { if (r.body) await r.body.cancel(); } catch (e) { /* body already consumed */ }
    const state = r.ok ? "exists" : r.status === 404 || r.status === 410 ? "missing" : "error";
    return { url, state, status: r.status, finalUrl: r.url !== url ? r.url : "", message: r.ok ? "" : "HTTP " + r.status };
  } catch (e) {
    return { url, state: "error", status: 0, finalUrl: "", message: "not reachable: " + e.message };
  }
}

async function collect(api, files, quiet) {
  const progress = (label) => (!quiet && process.stdout.isTTY ? (d, n) => process.stdout.write(`\r  ${label} ${d}/${n}   `) : null);
  const databases = [];
  const pages = new Map(); // url -> {entries}
  const dois = new Map(); // doi key -> {doi, landingPages:Map(url -> entries)}
  const pids = new Map(); // pid -> {columns, entries:Set}
  const noLandingPage = [];
  for (const file of files) {
    const db = readJson(file, "the database");
    if (!db || !Array.isArray(db.entries)) fail(`${file} has no entries[] - is it a CIEmetaDB database?`);
    const base = path.basename(file);
    databases.push({ file: base, entries: db.entries.length });
    for (const e of db.entries) {
      const ref = { database: base, entryId: e.entryId, title: api.entryTitle(e), file: api.entryFilename(e), kind: api.kindOf(e) };
      const lp = String(e.landingPage || "").trim();
      const doi = api.normalizeDoi(api.entryDoi(e));
      if (!lp) noLandingPage.push(ref);
      else {
        if (!pages.has(lp)) pages.set(lp, []);
        pages.get(lp).push(ref);
        if (doi) {
          const k = doi.toLowerCase();
          if (!dois.has(k)) dois.set(k, { doi, landingPages: new Map() });
          const m = dois.get(k).landingPages;
          if (!m.has(lp)) m.set(lp, []);
          m.get(lp).push(ref);
        }
      }
      for (const c of (e.payload.datatableInfo && e.payload.datatableInfo.columnHeaders) || []) {
        const p = String(c.unitPID || "").trim();
        if (!p) continue;
        if (!pids.has(p)) pids.set(p, { columns: 0, entries: new Set() });
        pids.get(p).columns++;
        pids.get(p).entries.add(e.entryId);
      }
    }
  }

  const pageUrls = [...pages.keys()].sort();
  const pageResults = await pool(pageUrls.filter((u) => /^https?:\/\/\S+$/i.test(u)), CONCURRENCY, fetchPage, progress("landing pages"));
  const pageByUrl = new Map(pageResults.map((r) => [r.url, r]));
  const pageRecords = pageUrls.map((url) => ({
    ...(pageByUrl.get(url) || { url, state: "invalid", status: 0, finalUrl: "", message: "not an http(s) URL" }),
    references: pages.get(url),
  }));

  const doiKeys = [...dois.keys()].sort();
  const doiResults = await pool(doiKeys.map((k) => dois.get(k).doi), CONCURRENCY, (d) => api.checkDoi(d, fetch), progress("DOIs"));
  const doiRecords = [];
  doiKeys.forEach((k, i) => {
    const r = doiResults[i];
    for (const [lp, refs] of dois.get(k).landingPages) {
      const finding = api.landingPageFinding(lp, r);
      doiRecords.push({ doi: dois.get(k).doi, landingPage: lp, doiState: r.state, target: r.target, finding, references: refs });
    }
  });

  const pidList = [...pids.keys()].sort();
  const pidResults = await pool(pidList, CONCURRENCY, (p) => api.checkUnitPid(p, fetch), progress("unit PIDs"));
  const pidRecords = pidList.map((p, i) => ({ ...pidResults[i], columns: pids.get(p).columns, entries: pids.get(p).entries.size }));
  if (!quiet && process.stdout.isTTY) process.stdout.write("\r" + " ".repeat(40) + "\r");

  return { databases, pages: pageRecords, dois: doiRecords, unitPids: pidRecords, noLandingPage };
}

/* ============================================================================
   report
   ==========================================================================*/

const MARK = { exists: "✓", missing: "✗", invalid: "✗", error: "⚠", other: "-" };

function mdEscape(s) {
  return String(s).replace(/\|/g, "\\|");
}

function verdict(res) {
  const badPages = res.pages.filter((p) => p.state !== "exists");
  const badDois = res.dois.filter((d) => d.finding);
  const badPids = res.unitPids.filter((p) => p.state === "missing" || p.state === "error");
  return { badPages, badDois, badPids, ok: !badPages.length && !badDois.length && !badPids.length };
}

function printConsole(res, quiet) {
  const v = verdict(res);
  for (const d of res.databases) console.log(`${d.file}: ${d.entries} entries`);
  console.log(
    `links  ${v.ok ? "OK" : "FAIL"}  landing pages ${res.pages.length - v.badPages.length}/${res.pages.length} exist, ` +
      `DOI -> landing page ${res.dois.length - v.badDois.length}/${res.dois.length} match, ` +
      `unit PIDs ${res.unitPids.filter((p) => p.state === "exists").length}/${res.unitPids.length} found` +
      (res.noLandingPage.length ? `, ${res.noLandingPage.length} entries without a landing page` : "")
  );
  for (const p of v.badPages) console.log(`  ${MARK[p.state] || "?"} landing page ${p.url}  (${p.message})  ${p.references.map((r) => r.file || r.title).join(", ")}`);
  for (const d of v.badDois) console.log(`  ${d.finding.level === "e" ? "✗" : "⚠"} ${d.finding.text}`);
  for (const p of v.badPids) console.log(`  ${MARK[p.state]} unit PID ${p.pid}  (${p.message})`);
  if (quiet) return;
  for (const p of res.unitPids) if (p.state === "exists" || p.state === "other") console.log(`  ${MARK[p.state]} unit PID ${p.pid}  ${p.label || p.message}  (${p.columns} columns)`);
}

function buildMarkdown(res, selfTests, when) {
  const v = verdict(res);
  const L = [];
  L.push("# Link report - DOI landing pages and unit PIDs");
  L.push("");
  L.push(`Generated ${when} by \`check_links.js\` over ${res.databases.map((d) => `\`${d.file}\``).join(", ")}.`);
  L.push("");
  L.push(
    "Each distinct landing page is fetched directly (redirects followed); each entry DOI is resolved at doi.org " +
      "and compared with its landing page; each distinct unit PID is asked of the BIPM SI Digital Framework. The " +
      "comparison and the unit-PID request are the functions behind the tool's **Check** buttons, lifted from " +
      "`CIEmetaDB.html`; the direct page fetch is the one check the tool cannot make from a local file."
  );
  L.push("");
  L.push("## Summary");
  L.push("");
  L.push(`- Landing pages that exist: **${res.pages.length - v.badPages.length}** of ${res.pages.length}`);
  L.push(`- DOIs resolving to their landing page: **${res.dois.length - v.badDois.length}** of ${res.dois.length}`);
  L.push(`- Unit PIDs found: **${res.unitPids.filter((p) => p.state === "exists").length}** of ${res.unitPids.length}`);
  L.push(`- Entries without a landing page: **${res.noLandingPage.length}**`);
  L.push("");
  if (v.badPages.length || v.badDois.length || v.badPids.length) {
    L.push("## Problems");
    L.push("");
    for (const p of v.badPages) L.push(`- ${MARK[p.state] || "?"} landing page <${p.url}>: ${mdEscape(p.message)} (${p.references.map((r) => `\`${mdEscape(r.file || r.title)}\` ${r.kind}`).join(", ")})`);
    for (const d of v.badDois) L.push(`- ${d.finding.level === "e" ? "✗" : "⚠"} ${mdEscape(d.finding.text)} (${d.references.map((r) => `\`${mdEscape(r.file || r.title)}\` ${r.kind}`).join(", ")})`);
    for (const p of v.badPids) L.push(`- ${MARK[p.state]} unit PID <${p.pid}>: ${mdEscape(p.message)} (${p.columns} columns)`);
    L.push("");
  }
  L.push("## Unit PIDs");
  L.push("");
  L.push("| PID | Status | Unit | Columns | Entries |");
  L.push("|---|---|---|---:|---:|");
  for (const p of res.unitPids) L.push(`| <${p.pid}> | ${MARK[p.state]} ${p.state} | ${mdEscape(p.label || p.message)} | ${p.columns} | ${p.entries} |`);
  L.push("");
  L.push("## Landing pages");
  L.push("");
  L.push("| Landing page | Page | DOI resolves to it | Entries |");
  L.push("|---|---|---|---|");
  for (const p of res.pages) {
    const d = res.dois.filter((x) => x.landingPage === p.url);
    const doiCol = d.length ? d.map((x) => (x.finding ? `⚠ ${mdEscape(x.doi)}` : `✓ ${mdEscape(x.doi)}`)).join(", ") : "-";
    L.push(`| <${p.url}> | ${MARK[p.state] || "?"} ${p.status || ""}${p.finalUrl ? " -> " + p.finalUrl : ""} | ${doiCol} | ${p.references.map((r) => `${mdEscape(r.file || r.title)} (${r.kind})`).join(", ")} |`);
  }
  L.push("");
  if (res.noLandingPage.length) {
    L.push("## Entries without a landing page");
    L.push("");
    for (const r of res.noLandingPage) L.push(`- ${mdEscape(r.title)} (\`${mdEscape(r.file || r.entryId)}\`, ${r.kind})`);
    L.push("");
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
    console.error("usage: node check_links.js [FILE...] [--out DIR] [--quiet]");
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
    fail(`${failed.length} self-test(s) failed; nothing was checked`);
  }

  const res = await collect(api, files, quiet);
  const when = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  fs.writeFileSync(path.join(outDir, REPORT_JSON_NAME), JSON.stringify({ date: when, ...res }, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(outDir, REPORT_MD_NAME), buildMarkdown(res, selfTests, when), "utf8");

  printConsole(res, quiet);
  console.log(`  wrote ${REPORT_MD_NAME} and ${REPORT_JSON_NAME}` + (outDir === HERE ? "" : ` to ${outDir}`));
  return verdict(res).ok ? 0 : 1;
}

main(process.argv).then((code) => process.exit(code), (e) => fail(e && e.stack ? e.stack : String(e)));
