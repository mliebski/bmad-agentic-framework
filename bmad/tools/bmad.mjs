#!/usr/bin/env node
// BMAD tool — zero-dependency CLI that owns project state, validates gates,
// locks acceptance tests, plans parallel waves, builds the requirements graph
// and serves as the Claude Code hook handler.
//
//   node bmad/tools/bmad.mjs help
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const P = {
  status: 'docs/bmad-status.json',
  locks: 'docs/04-implementation/test-locks.json',
  metrics: 'docs/bmad-metrics.jsonl',
  graph: 'docs/bmad-graph.json',
  stories: 'docs/04-implementation/stories',
  reviews: 'docs/reviews',
  bundles: 'docs/04-implementation/bundles',
};
const PROTECTED = [P.status, P.locks, P.metrics];
const STORY_STATES = ['draft', 'ready', 'in-progress', 'review', 'done', 'blocked', 'deferred'];
const GATES = ['G1', 'G2', 'G3', 'G5', 'G6'];
const PLACEHOLDERS = ['{project name}', '{date}', '{title}', '{short title}', '{version}'];

// ---------- small helpers ----------
const norm = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
const today = () => new Date().toISOString().slice(0, 10);
const read = (root, rel) => { try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return null; } };
const exists = (root, rel) => fs.existsSync(path.join(root, rel));
const readJson = (root, rel, dflt) => { const t = read(root, rel); if (t == null) return dflt; return JSON.parse(t); };
const writeJson = (root, rel, obj) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(obj, null, 2) + '\n'); };

export function findRoot(start) {
  let d = path.resolve(start || process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(d, 'bmad', 'config.yaml'))) return d;
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

// Minimal YAML subset: nested maps by indentation, scalars, inline lists, "- item" lists.
function scalar(v) {
  v = v.trim();
  if (v.startsWith('[') && v.endsWith(']')) { const inner = v.slice(1, -1).trim(); return inner ? inner.split(',').map(scalar) : []; }
  if (v === 'true' || v === 'false') return v === 'true';
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v.replace(/^(["'])(.*)\1$/, '$2');
}
export function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/(^|\s)#.*$/, '');
    if (!line.trim()) continue;
    const indent = line.match(/^ */)[0].length;
    const t = line.trim();
    if (t.startsWith('- ')) {
      const top = stack.at(-1);
      if (top.parent) { if (!Array.isArray(top.parent[top.key])) top.parent[top.key] = []; top.parent[top.key].push(scalar(t.slice(2))); }
      continue;
    }
    const m = t.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    while (stack.at(-1).indent >= indent) stack.pop();
    const parent = stack.at(-1).obj;
    const key = m[1].trim();
    if (m[2] === '') { parent[key] = {}; stack.push({ indent, obj: parent[key], parent, key }); }
    else parent[key] = scalar(m[2]);
  }
  return root;
}
export function frontmatter(text) {
  const m = text && text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? parseYaml(m[1]) : {};
}
const asList = (v) => (Array.isArray(v) ? v.map(String) : v && typeof v === 'string' && v !== 'none' ? [v] : []);

export function config(root) {
  const c = parseYaml(read(root, 'bmad/config.yaml') || '');
  c.developer ||= {}; c.gates ||= {}; c.autopilot ||= {}; c.reviews ||= {}; c.budgets ||= {}; c.qa ||= {};
  return c;
}
export function loadStatus(root) { return readJson(root, P.status, null); }
function saveStatus(root, s) { writeJson(root, P.status, s); }
function metric(root, ev) {
  const f = path.join(root, P.metrics);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.appendFileSync(f, JSON.stringify({ ts: new Date().toISOString(), ...ev }) + '\n');
}

// ---------- stories ----------
export function stories(root) {
  const dir = path.join(root, P.stories);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const rel = `${P.stories}/${f}`;
    const text = read(root, rel);
    const fm = frontmatter(text);
    const section = (name) => { const m = text.match(new RegExp(`^## ${name}[^\\n]*\\n([\\s\\S]*?)(?=^## |^---\\s*$|(?![\\s\\S]))`, 'm')); return m ? m[1] : ''; };
    const verdict = (text.match(/\*\*Verdict:\*\*\s*(PASS|CONCERNS|FAIL)\s*$/m) || [])[1] || null;
    return {
      id: String(fm.id || f.replace(/\.md$/, '')), file: rel, title: fm.title || '', status: fm.status || 'draft',
      epic: fm.epic || '', requirements: asList(fm.requirements), depends_on: asList(fm.depends_on),
      touches: asList(fm.touches).map(norm), acceptance_tests: asList(fm.acceptance_tests).map(norm),
      tests_exempt_reason: fm.tests_exempt_reason || '', risk: ['low', 'normal', 'high'].includes(fm.risk) ? fm.risk : (fm.risk ? String(fm.risk) : 'normal'), refs: asList(fm.refs), verdict, text, section,
    };
  });
}
// Cheap scan for the hook: reads only the head of each story file, not the whole story.
export function activeStories(root) {
  const dir = path.join(root, P.stories);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const buf = Buffer.alloc(4096);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const fd = fs.openSync(path.join(dir, f), 'r');
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    const head = buf.toString('utf8', 0, n);
    if (!/^status:\s*in-progress\s*$/m.test(head)) continue;
    const fm = frontmatter(head);
    out.push({ id: String(fm.id || f.replace(/\.md$/, '')), touches: asList(fm.touches).map(norm) });
  }
  return out;
}

// ---------- context bundles: stories name their sources (refs); the tool assembles them ----------
function mdSection(text, query) {
  const q = query.replace(/^§\s*/, '').trim().toLowerCase();
  const lines = text.split(/\r?\n/);
  // headings, ignoring '#' lines inside fenced code blocks
  let fence = false; const heads = [];
  lines.forEach((l, i) => { if (/^\s*(```|~~~)/.test(l)) fence = !fence; else if (!fence) { const m = l.match(/^(#{1,4})\s+(.*)$/); if (m) heads.push({ i, level: m[1].length, text: m[2] }); } });
  let start = -1; let level = 0;
  for (const hd of heads) {
    const h = hd.text.trim().toLowerCase();
    const numbered = /^[\d.]+$/.test(q) && new RegExp(`^${q.replace(/\./g, '\\.')}(?![\\d])`).test(h);
    if (numbered || (!/^[\d.]+$/.test(q) && h.includes(q))) { start = hd.i; level = hd.level; break; }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (const hd of heads) if (hd.i > start && hd.level <= level) { end = hd.i; break; }
  return lines.slice(start, end).join('\n').trim();
}
const DOCS = { prd: 'docs/02-planning/prd.md', arch: 'docs/03-solutioning/architecture.md', ux: 'docs/02-planning/ux-spec.md', strategy: 'docs/03-solutioning/test-strategy.md', brief: 'docs/01-discovery/project-brief.md' };
const BUNDLE_CAP = 8000;
export function resolveRef(root, ref) {
  let body = null;
  if (/^(?:FR|NFR)-\d+$/.test(ref)) { const c = reqRows(read(root, DOCS.prd))[ref]; body = c ? `${ref}: ${c.filter(Boolean).join(' | ')}` : null; }
  else if (/^ADR-\d+$/i.test(ref)) {
    const dir = path.join(root, 'docs/03-solutioning/adr');
    const f = fs.existsSync(dir) ? fs.readdirSync(dir).find((n) => n.toUpperCase().startsWith(ref.toUpperCase())) : null;
    if (f) { const t = read(root, `docs/03-solutioning/adr/${f}`); body = `${ref} — ${(t.match(/^# (.*)$/m) || [])[1] || f}\n${mdSection(t, 'Decision') || t.slice(0, 1200)}`; }
  } else {
    const m = ref.match(/^(prd|arch|ux|strategy|brief):(.+)$/);
    if (m) { const t = read(root, DOCS[m[1]]); body = t ? mdSection(t, m[2]) : null; }
  }
  if (body && body.length > BUNDLE_CAP) body = body.slice(0, body.lastIndexOf('\n', BUNDLE_CAP)) + `\n… (TRUNCATED at ${BUNDLE_CAP} characters — narrow the reference)`;
  return body;
}
export function bundleBody(root, s) {
  const parts = []; const missing = [];
  for (const r of s.refs) { const b = resolveRef(root, r); if (b == null) missing.push(r); else parts.push(`### ${r}\n${b}`); }
  const all = s.depends_on.length ? stories(root) : [];
  const deps = s.depends_on.map((d) => { const x = all.find((y) => y.id === d); return `- ${d}: ${x ? x.status + ' — ' + x.title : 'unknown'}`; });
  const body = [`# Context bundle for ${s.id}: ${s.title}`, '_Assembled by the BMAD tool from the `refs` in the story. Do not edit; it is regenerated when the story starts._', '', ...parts, ...(deps.length ? ['### Dependencies', ...deps] : [])].join('\n');
  return { body, missing, sha: crypto.createHash('sha256').update(body).digest('hex').slice(0, 16) };
}
export function writeBundle(root, s) {
  const b = bundleBody(root, s);
  const rel = `${P.bundles}/${s.id}.md`;
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, `<!-- bmad-bundle sha:${b.sha} -->\n${b.body}\n`);
  return { rel, ...b };
}
function bundleStale(root, s) {
  const t = read(root, `${P.bundles}/${s.id}.md`);
  if (t == null) return true;
  return (t.match(/bmad-bundle sha:(\w+)/) || [])[1] !== bundleBody(root, s).sha;
}

function setStoryStatus(root, story, status) {
  const f = path.join(root, story.file);
  const t = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, t.replace(/^(---\r?\n[\s\S]*?^status:)[^\r\n]*/m, `$1 ${status}`));
}
const overlaps = (a, b) => a.some((x) => b.some((y) => x === y || x.startsWith(y + '/') || y.startsWith(x + '/')));

// ---------- acceptance test locks ----------
function expand(root, rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [norm(rel)];
  return fs.readdirSync(abs).flatMap((n) => expand(root, `${rel}/${n}`));
}
const sha = (root, rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
export function lockTests(root, id) {
  const s = stories(root).find((x) => x.id === id);
  if (!s) throw new Error(`unknown story ${id}`);
  const files = s.acceptance_tests.flatMap((p) => expand(root, p));
  if (!files.length) throw new Error(`${id}: acceptance_tests lists no existing files`);
  const locks = readJson(root, P.locks, {});
  locks[id] = { locked_at: new Date().toISOString(), files: Object.fromEntries(files.map((f) => [f, sha(root, f)])) };
  writeJson(root, P.locks, locks);
  return files;
}
export function verifyLocks(root, id) {
  const locks = readJson(root, P.locks, {});
  const out = [];
  for (const [sid, l] of Object.entries(locks)) {
    if (id && sid !== id) continue;
    for (const [f, h] of Object.entries(l.files)) {
      if (!exists(root, f)) out.push(`${sid}: locked acceptance test deleted: ${f}`);
      else if (sha(root, f) !== h) out.push(`${sid}: locked acceptance test modified: ${f}`);
    }
  }
  return out;
}
const lockedFiles = (root) => Object.values(readJson(root, P.locks, {})).flatMap((l) => Object.keys(l.files));
const testsReady = (root, s, cfg, locks) => cfg.developer.tests_first === false || !!locks[s.id] || !!s.tests_exempt_reason;

// ---------- wave planning ----------
export function wave(root, max) {
  const cfg = config(root);
  const all = stories(root);
  const locks = readJson(root, P.locks, {});
  const done = new Set(all.filter((s) => s.status === 'done').map((s) => s.id));
  const limit = max || cfg.developer.max_parallel || 3;
  const res = { wave: [], waiting: [], needs_tests: [] };
  const busy = all.filter((s) => s.status === 'in-progress').flatMap((s) => s.touches);
  let taken = [...busy];
  for (const s of all.filter((x) => x.status === 'ready')) {
    const unmet = s.depends_on.filter((d) => !done.has(d));
    if (unmet.length) { res.waiting.push({ id: s.id, reason: `depends on ${unmet.join(', ')}` }); continue; }
    if (!testsReady(root, s, cfg, locks)) { res.needs_tests.push(s.id); continue; }
    if (res.wave.length >= limit) { res.waiting.push({ id: s.id, reason: 'wave full' }); continue; }
    if (overlaps(s.touches, taken)) { res.waiting.push({ id: s.id, reason: 'touches overlap with this wave' }); continue; }
    res.wave.push({ id: s.id, file: s.file, title: s.title, touches: s.touches });
    taken = taken.concat(s.touches);
  }
  return res;
}

// ---------- requirements parsing ----------
function reqRows(text) {
  const out = {};
  for (const line of (text || '').split(/\r?\n/)) {
    const m = line.match(/^\|\s*((?:FR|NFR)-\d+)\s*\|(.*)\|\s*$/);
    if (m) out[m[1]] = m[2].split('|').map((c) => c.trim());
  }
  return out;
}
const ids = (text, re = /\b(?:FR|NFR)-\d+\b/g) => [...new Set((text || '').match(re) || [])];

// ---------- validation ----------
export function validate(root, gate, storyId) {
  const E = []; const W = [];
  const err = (code, msg) => E.push({ code, msg });
  const cfg = config(root);
  const st = loadStatus(root);
  if (!st) { err('no-status', `${P.status} missing — run /bmad:init`); return { gate, errors: E, warnings: W }; }
  const quick = st.track === 'quick';
  const need = (rel, code) => { const t = read(root, rel); if (t == null) { err(code || 'missing-artifact', `missing ${rel}`); return null; } for (const ph of PLACEHOLDERS) if (t.includes(ph)) err('placeholder', `${rel} still contains template placeholder ${ph}`); return t; };
  const review = (name) => {
    if (!asList(cfg.reviews.required).includes(name)) return;
    const t = read(root, `${P.reviews}/${name}.review.md`);
    if (t == null) return err('no-review', `no adversarial review for ${name} — run /bmad:redteam ${name}`);
    const fm = frontmatter(t);
    if (fm.unresolved_critical !== 0) err('review-critical', `${name} review has ${fm.unresolved_critical ?? 'unknown'} unresolved critical finding(s)`);
  };
  const prd = read(root, 'docs/02-planning/prd.md');
  const rows = reqRows(prd);
  const budget = (k) => cfg.budgets?.[st.track]?.[k];
  const over = (what, n, k) => { const b = budget(k); if (b && n > b) W.push(`${what}: ${n} exceeds the ${st.track}-track budget of ${b} (bmad/config.yaml budgets) — cut scope or record why the budget is wrong`); };
  const all = stories(root);

  if (gate === 'G1') {
    need('docs/01-discovery/project-brief.md');
    const r = need('docs/01-discovery/requirements.md');
    if (r && !ids(r).some((i) => i.startsWith('FR-'))) err('no-frs', 'requirements.md defines no FR-n requirements');
    if (r && !ids(r).some((i) => i.startsWith('NFR-'))) W.push('requirements.md defines no NFR-n requirements');
  }
  if (gate === 'G2') {
    need('docs/02-planning/prd.md');
    const frs = Object.keys(rows).filter((i) => i.startsWith('FR-'));
    if (prd && !frs.length) err('no-frs', 'PRD requirement table has no FR rows');
    for (const [id, c] of Object.entries(rows)) {
      if (id.startsWith('FR-')) {
        if (!c[0]) err('fr-empty', `${id} has no requirement text`);
        if (!c[c.length - 1]) err('fr-no-ac', `${id} has no acceptance criteria`);
      } else if (!/\d/.test(c.slice(1).join(' '))) err('nfr-no-number', `${id} has no number — NFRs must be measurable`);
    }
    if (cfg.gates.ux_required !== false) {
      const ux = need('docs/02-planning/ux-spec.md');
      if (ux) { const miss = frs.filter((f) => !ux.includes(f)); if (miss.length) W.push(`UX spec does not mention: ${miss.join(', ')}`); }
    }
    over('FR count', frs.length, 'max_frs');
    if (prd) over('PRD words', prd.split(/\s+/).length, 'prd_words');
    review('prd');
  }
  if (gate === 'G3') {
    if (!quick) {
      const arch = need('docs/03-solutioning/architecture.md');
      if (arch) { const miss = Object.keys(rows).filter((i) => !arch.includes(i)); if (miss.length) err('arch-trace', `architecture does not address: ${miss.join(', ')}`); }
      const adr = path.join(root, 'docs/03-solutioning/adr');
      if (!fs.existsSync(adr) || !fs.readdirSync(adr).some((f) => f.endsWith('.md'))) err('no-adr', 'no ADR in docs/03-solutioning/adr/');
      need('docs/03-solutioning/test-strategy.md');
      const must = Object.entries(rows).filter(([i, c]) => i.startsWith('FR-') && /^M/i.test(c[1] || '')).map(([i]) => i);
      const covered = new Set(all.flatMap((s) => s.requirements));
      const unc = must.filter((i) => !covered.has(i));
      if (unc.length) err('fr-uncovered', `must-have requirements with no story: ${unc.join(', ')}`);
      for (const s of all) for (const r of s.requirements) if (!rows[r]) err('story-orphan-req', `${s.id} references ${r}, which is not in the PRD`);
      review('architecture');
    }
    if (!cfg.developer.test_command) err('no-test-command', 'developer.test_command is empty in bmad/config.yaml');
    if (!all.length) err('no-stories', `no story files in ${P.stories}/`);
    over('story count', all.length, 'max_stories');
    const byId = new Map(all.map((s) => [s.id, s]));
    for (const s of all) {
      for (const ph of PLACEHOLDERS) if (s.text.includes(ph)) err('placeholder', `${s.id} still contains template placeholder ${ph}`);
      const ac = s.section('Acceptance criteria');
      if (!/^\s*\d+\.\s*\S/m.test(ac) || ac.includes('…')) err('story-no-ac', `${s.id} has no concrete acceptance criteria`);
      if (!s.touches.length) err('story-no-touches', `${s.id} has an empty touches list`);
      for (const d of s.depends_on) if (!byId.has(d)) err('story-bad-dep', `${s.id} depends on unknown story ${d}`);
      if (!s.refs.length && s.section('Context').trim().length < 200) W.push(`${s.id} has no refs and a very short context section — is the story self-contained?`);
      for (const r of s.refs) if ((resolveRef(root, r) || '').includes('(TRUNCATED at')) err('ref-too-long', `${s.id} ref "${r}" exceeds the bundle cap — reference a narrower heading`);
      for (const r of s.refs) if (resolveRef(root, r) == null) err('ref-unresolved', `${s.id} ref "${r}" does not resolve to any PRD row, ADR or document section`);
      if (!['low', 'normal', 'high'].includes(s.risk)) err('story-bad-risk', `${s.id} risk must be low, normal or high`);
      if (!STORY_STATES.includes(s.status)) err('story-bad-status', `${s.id} has invalid status "${s.status}"`);
    }
    const seen = new Set(); const stackSet = new Set();
    const visit = (id) => { if (stackSet.has(id)) { err('story-cycle', `dependency cycle through ${id}`); return; } if (seen.has(id) || !byId.has(id)) return; seen.add(id); stackSet.add(id); byId.get(id).depends_on.forEach(visit); stackSet.delete(id); };
    all.forEach((s) => visit(s.id));
  }
  if (gate === 'G4') {
    const s = all.find((x) => x.id === storyId);
    if (!s) err('unknown-story', `unknown story ${storyId}`);
    else {
      if (/^\s*- \[ \]/m.test(s.section('Tasks'))) err('tasks-open', `${s.id} has unticked tasks`);
      const rec = s.section('Dev Record');
      if (!/\*\*Files changed:\*\*\s*\S/.test(rec)) err('no-dev-record', `${s.id} Dev Record does not list files changed`);
      if (!/\*\*Commands run and results:\*\*\s*(?!test \/ lint \/ build)\S/.test(rec)) err('no-test-evidence', `${s.id} Dev Record has no recorded command results`);
      const locks = readJson(root, P.locks, {});
      if (!testsReady(root, s, cfg, locks)) err('no-locked-tests', `${s.id} has no locked acceptance tests and no tests_exempt_reason`);
      verifyLocks(root, s.id).forEach((m) => err('lock-broken', m));
      if (cfg.gates.story_review_by_qa !== false && !s.verdict) err('no-qa-verdict', `${s.id} has no QA verdict`);
      if (s.verdict === 'FAIL') err('qa-fail', `${s.id} QA verdict is FAIL`);
      if (s.risk === 'high') { const rv = read(root, `${P.reviews}/code-${s.id}.review.md`); if (rv == null) err('no-code-review', `${s.id} is high risk — run /bmad:redteam code ${s.id}`); else if (frontmatter(rv).unresolved_critical !== 0) err('review-critical', `${s.id} code review has unresolved critical finding(s)`); }
      if (s.refs.length && bundleStale(root, s)) W.push(`${s.id}: context bundle is stale or missing — the PRD, architecture or an ADR changed since the developer started`);
    }
  }
  if (gate === 'G5') {
    const open = all.filter((s) => !['done', 'deferred'].includes(s.status));
    if (open.length) err('stories-open', `stories not done or deferred: ${open.map((s) => `${s.id}(${s.status})`).join(', ')}`);
    verifyLocks(root).forEach((m) => err('lock-broken', m));
    const qa = need('docs/05-release/qa-report.md');
    if (qa) { const v = (qa.match(/^## Verdict:\s*(PASS|CONCERNS|FAIL)\s*$/m) || [])[1]; if (!v) err('no-qa-verdict', 'qa-report.md has no single verdict'); if (v === 'FAIL') err('qa-fail', 'release QA verdict is FAIL'); }
    need('docs/05-release/release-notes.md');
    const rb = need('docs/05-release/deployment-runbook.md');
    if (rb && !/^## .*Rollback/m.test(rb)) err('no-rollback', 'deployment runbook has no Rollback section');
    if (!quick) need('docs/05-release/launch-plan.md');
  }
  if (gate === 'G6') {
    if (!['passed'].includes(st.gates?.G5?.status)) err('g5-not-passed', 'G5 has not passed');
    const c = need('docs/05-release/go-live-checklist.md');
    if (c && !/Decision:\s*\*\*GO\*\*/.test(c)) err('no-go', 'go-live checklist does not record a GO decision');
  }
  return { gate, errors: E, warnings: W };
}

// ---------- graph ----------
export function buildGraph(root) {
  const nodes = {}; const edges = [];
  const add = (id, type, extra = {}) => { nodes[id] = { id, type, ...nodes[id], ...extra }; };
  const link = (from, to, rel) => { if (from !== to) edges.push({ from, to, rel }); };
  const rows = reqRows(read(root, 'docs/02-planning/prd.md'));
  for (const [id, c] of Object.entries(rows)) add(id, id.startsWith('FR') ? 'requirement' : 'nfr', { text: c[id.startsWith('FR') ? 0 : 1] || '', file: 'docs/02-planning/prd.md' });
  const adrDir = 'docs/03-solutioning/adr';
  if (exists(root, adrDir)) for (const f of fs.readdirSync(path.join(root, adrDir)).filter((x) => x.endsWith('.md'))) {
    const id = (f.match(/^(ADR-\d+)/i) || [f])[0].toUpperCase();
    const t = read(root, `${adrDir}/${f}`);
    add(id, 'decision', { text: (t.match(/^# (.*)$/m) || [])[1] || f, file: `${adrDir}/${f}` });
    ids(t).forEach((r) => link(id, r, 'addresses'));
  }
  const locks = readJson(root, P.locks, {});
  for (const s of stories(root)) {
    add(s.id, 'story', { text: s.title, status: s.status, file: s.file });
    s.requirements.forEach((r) => link(s.id, r, 'implements'));
    s.depends_on.forEach((d) => link(s.id, d, 'depends_on'));
    ids(s.text, /\bADR-\d+\b/g).forEach((a) => link(s.id, a, 'applies'));
    for (const f of Object.keys(locks[s.id]?.files || {})) { add(f, 'test', { file: f }); link(f, s.id, 'verifies'); }
  }
  const g = { built: new Date().toISOString(), nodes, edges };
  writeJson(root, P.graph, g);
  return g;
}
export function impact(root, id) {
  const g = buildGraph(root);
  if (!g.nodes[id]) throw new Error(`unknown node ${id}`);
  const hit = new Map(); const queue = [id];
  while (queue.length) {
    const cur = queue.shift();
    for (const e of g.edges) if (e.to === cur && !hit.has(e.from) && e.from !== id) { hit.set(e.from, e.rel); queue.push(e.from); }
  }
  return [...hit].map(([n, rel]) => ({ ...g.nodes[n], via: rel, text: undefined, title: g.nodes[n].text }));
}
export function trace(root) {
  const g = buildGraph(root);
  return Object.values(g.nodes).filter((n) => n.type === 'requirement' || n.type === 'nfr').map((r) => {
    const st = g.edges.filter((e) => e.to === r.id && e.rel === 'implements').map((e) => e.from);
    const tests = g.edges.filter((e) => e.rel === 'verifies' && st.includes(e.to)).map((e) => e.from);
    return { id: r.id, text: r.text, stories: st.map((s) => `${s}(${g.nodes[s].status})`), decisions: g.edges.filter((e) => e.to === r.id && e.rel === 'addresses').map((e) => e.from), tests: tests.length };
  });
}
export function storyContext(root, id) {
  const s = stories(root).find((x) => x.id === id);
  if (!s) throw new Error(`unknown story ${id}`);
  const g = buildGraph(root);
  const out = [`# Context pack for ${s.id}: ${s.title}`, '', '## Requirements'];
  for (const r of s.requirements) out.push(`- ${r}: ${g.nodes[r]?.text || '(not found in PRD)'}`);
  out.push('', '## Decisions addressing these requirements');
  const adrs = new Set(g.edges.filter((e) => e.rel === 'addresses' && s.requirements.includes(e.to)).map((e) => e.from));
  for (const a of adrs) { const t = read(root, g.nodes[a].file) || ''; const d = (t.match(/^## Decision\s*\n([\s\S]*?)(?=^## )/m) || [])[1] || ''; out.push(`- ${a} ${g.nodes[a].text}: ${d.trim().replace(/\s+/g, ' ')}`); }
  out.push('', '## Dependencies');
  for (const d of s.depends_on) out.push(`- ${d}: ${g.nodes[d]?.status || 'unknown'} — ${g.nodes[d]?.text || ''}`);
  return out.join('\n');
}

// ---------- metrics ----------
export function metricsSummary(root) {
  const lines = (read(root, P.metrics) || '').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const gates = {}; const codes = {}; const rework = {}; let blocked = 0;
  for (const e of lines) {
    if (e.type === 'gate') { const g = (gates[e.gate] ||= { attempts: 0, passed: 0, failed: 0, waived: 0, first_attempt: e.result }); g.attempts++; g[e.result === 'pass' ? 'passed' : e.result === 'waive' ? 'waived' : 'failed']++; (e.failures || []).forEach((c) => (codes[c] = (codes[c] || 0) + 1)); }
    if (e.type === 'story') { if (e.from === 'review' && e.to === 'in-progress') rework[e.id] = (rework[e.id] || 0) + 1; if (e.to === 'blocked') blocked++; (e.failures || []).forEach((c) => (codes[c] = (codes[c] || 0) + 1)); }
  }
  return { events: lines.length, gates, failure_codes: codes, story_rework: rework, stories_blocked: blocked };
}

// ---------- mechanical verification (low-risk stories) and resume digest ----------
function runCmd(root, cmd) {
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', timeout: 600000 });
  const tail = `${r.stdout || ''}${r.stderr || ''}`.trim().split(/\r?\n/).slice(-4).join(' / ');
  return { ok: r.status === 0, tail: tail.slice(0, 300), cmd };
}
function verifyStory(root, s) {
  const cfg = config(root);
  const fail = (msg) => { console.error(`${s.id} cannot be verified mechanically: ${msg}`); return 1; };
  if (cfg.qa.mechanical_for_low_risk === false) return fail('qa.mechanical_for_low_risk is false in bmad/config.yaml');
  if (s.risk !== 'low') return fail(`risk is ${s.risk}; only low-risk stories skip the QA agent`);
  if (!['in-progress', 'review'].includes(s.status)) return fail(`status is ${s.status}; the developer must finish first`);
  const locks = verifyLocks(root, s.id);
  if (locks.length) return fail(locks.join('; '));
  const d = cfg.developer;
  const paths = s.acceptance_tests.join(' ');
  const cmds = [];
  const scoped = d.scoped_test_command && paths ? String(d.scoped_test_command).replace('{paths}', paths) : d.test_command;
  if (scoped) cmds.push(scoped); else return fail('developer.test_command is empty');
  if (d.lint_command) cmds.push(d.lint_command);
  if (d.build_command) cmds.push(d.build_command);
  const results = [];
  for (const c of cmds) { const r = runCmd(root, c); results.push(r); if (!r.ok) { metric(root, { type: 'story', id: s.id, from: s.status, to: 'verify-failed', failures: ['verify-command'] }); console.error(`${s.id} verification failed: ${r.cmd}\n${r.tail}`); return 1; } }
  const f = path.join(root, s.file);
  let t = fs.readFileSync(f, 'utf8');
  const evidence = `mechanical verification by the BMAD tool — ${results.map((r) => `\`${r.cmd}\` exit 0`).join('; ')}`;
  t = t.replace(/^- \*\*Verdict:\*\*.*$/m, '- **Verdict:** PASS').replace(/^- \*\*Commands re-run and results:\*\*.*$/m, `- **Commands re-run and results:** ${evidence}`);
  fs.writeFileSync(f, t);
  if (s.status !== 'review') setStoryStatus(root, { ...s }, 'review');
  const r = validate(root, 'G4', s.id);
  if (r.errors.length) { console.error(`${s.id} cannot be done:\n${r.errors.map((e) => `  ✘ [${e.code}] ${e.msg}`).join('\n')}`); return 1; }
  setStoryStatus(root, s, 'done');
  metric(root, { type: 'story', id: s.id, from: s.status, to: 'done', by: 'mechanical-verification' });
  console.log(`${s.id}: verified mechanically → done (${results.length} command(s) passed)`);
  return 0;
}

const PHASE_GATE = { 1: 'G1', 2: 'G2', 3: 'G3', 5: 'G5', 6: 'G6' };
export function resume(root) {
  const st = loadStatus(root);
  if (!st) return 'not initialised — run /bmad:init';
  const L = [`${st.project_name || '(unnamed)'} — ${st.track} track, phase ${st.current_phase}. Gates: ${Object.entries(st.gates).map(([g, v]) => `${g} ${v.status}`).join(', ')}`];
  const all = stories(root);
  if (all.length) { const c = {}; all.forEach((x) => (c[x.status] = (c[x.status] || 0) + 1)); L.push(`Stories: ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(', ')}`); }
  let next;
  if (st.current_phase === 4) {
    const w = wave(root);
    const failed = st.gates.G3?.status === 'failed';
    if (failed) next = '/bmad:gate G3';
    else if (all.length && all.every((x) => ['done', 'deferred'].includes(x.status))) next = '/bmad:release';
    else { L.push(`Wave: ${w.wave.map((x) => x.id).join(', ') || 'none'}${w.needs_tests.length ? `; need tests: ${w.needs_tests.join(', ')}` : ''}`); next = '/bmad:sprint (or /bmad:auto)'; }
  } else {
    const g = PHASE_GATE[st.current_phase];
    const v = g ? validate(root, g) : { errors: [], warnings: [] };
    if (v.errors.length) { L.push(`${g} blockers (${v.errors.length}): ${v.errors.slice(0, 6).map((e) => `[${e.code}] ${e.msg}`).join(' | ')}${v.errors.length > 6 ? ' | …' : ''}`); next = `${{ 1: '/bmad:discover', 2: '/bmad:prd, /bmad:ux, /bmad:redteam prd', 3: '/bmad:architect, /bmad:redteam architecture, /bmad:stories', 5: '/bmad:release', 6: '/bmad:golive' }[st.current_phase]} (or /bmad:auto)`; }
    else { if (v.warnings.length) L.push(`Warnings: ${v.warnings.slice(0, 4).join(' | ')}`); next = `/bmad:gate ${g}`; }
  }
  if (st.open_questions.length) L.push(`Open questions: ${st.open_questions.length} (bmad.mjs status lists them)`);
  L.push(`Next: ${next}`);
  return L.join('\n');
}

// ---------- hook handler (Claude Code PreToolUse / SessionStart) ----------
function hook() {
  let input;
  try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { return 0; }
  try {
    if (input.hook_event_name === 'SessionStart') {
      const root = findRoot(input.cwd);
      if (!root) console.log(`BMAD framework is available but this project has no bmad/ folder yet. /bmad:init must first run: node "${path.join(TOOL_DIR, 'install.mjs')}" . --assets-only`);
      else if (fs.existsSync(path.join(root, P.status))) console.log('This is a BMAD project (' + P.status + '). Act as the BMAD orchestrator: follow the rules in the bmad:orchestrator skill (or CLAUDE.md), read state with the BMAD tool, and stop at gates for human approval.');
      return 0;
    }
    if (input.hook_event_name !== 'PreToolUse') return 0;
    const agent = String(input.agent_type || '');
    const isDev = /(^|:)developer$/.test(agent);
    const isQa = /(^|:)qa-tester$/.test(agent);
    const deny = (msg) => { process.stderr.write(`BMAD gate: ${msg}\n`); return 2; };
    const ti = input.tool_input || {};
    if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(input.tool_name)) {
      const file = ti.file_path || ti.notebook_path;
      if (!file) return 0;
      const abs = path.resolve(input.cwd || '.', file);
      const root = findRoot(path.dirname(abs)) || findRoot(input.cwd);
      if (!root || !loadStatus(root)) return 0;
      const rel = norm(path.relative(root, abs));
      if (PROTECTED.includes(rel)) return deny(`${rel} is managed by the BMAD tool. Use "node bmad/tools/bmad.mjs help" (gate, story, artifact, question, change) instead of editing it.`);
      if (lockedFiles(root).includes(rel) && !isQa) return deny(`${rel} is a locked acceptance test. Developers do not change acceptance tests: if the test is wrong, set the story to blocked and report why; QA amends and re-locks it.`);
      if (isDev) {
        const cfg = config(root);
        if (cfg.developer.enforce_touches === false) return 0;
        const active = activeStories(root);
        if (!active.length) return 0;
        const allowed = active.flatMap((s) => s.touches).concat(asList(cfg.developer.shared_files).map(norm), [P.stories]);
        if (!overlaps([rel], allowed) && !allowed.some((a) => rel.startsWith(a + '/') || rel === a)) return deny(`${rel} is outside the touches of the story in progress (${active.map((s) => s.id).join(', ')}): ${allowed.join(', ')}. If the story genuinely needs it, set the story to blocked and report which file and why.`);
      }
      return 0;
    }
    if (['Agent', 'Task'].includes(input.tool_name) && /(^|:)developer$/.test(String(ti.subagent_type || ''))) {
      const root = findRoot(input.cwd);
      const st = root && loadStatus(root);
      if (!st) return 0;
      if (!['passed', 'waived'].includes(st.gates?.G3?.status)) return deny('developers cannot start before gate G3 (implementation readiness) has passed. Run /bmad:gate G3.');
      const cfg = config(root); const locks = readJson(root, P.locks, {});
      const all = stories(root);
      for (const id of new Set(String(ti.prompt || '').match(/\bE\d+-S\d+\b/g) || [])) {
        const s = all.find((x) => x.id === id);
        if (s && !testsReady(root, s, cfg, locks)) return deny(`${id} has no locked acceptance tests. Run the qa-tester in acceptance-test mode for ${id} first (tests before code), or give the story a tests_exempt_reason.`);
      }
    }
  } catch { return 0; } // never break a session because of a tooling fault
  return 0;
}

// ---------- CLI ----------
const HELP = `BMAD tool
  init --name <n> --track <quick|standard|enterprise>   create docs structure and status
  status [--json]                      project state summary
  artifact <path> <draft|review|approved>
  question <text> | question --resolve <n>
  change <text>                        add a change-log line
  phase <1..6>                         set the current phase (new iteration after go-live)
  validate --gate <G1|G2|G3|G5|G6> | --story <id>  [--json]
  gate <G> <pass|fail|waive> --by <who> [--notes <text>]   pass is refused unless validate is clean
  resume                               compact digest: where the project is, what blocks the gate, the next command
  stories [--json]                     story table from story front matter
  story <id> <status> [--accept-concerns --by <human>]   done is refused unless the G4 checks pass
  story <id> verify                    low-risk stories only: the tool re-runs the checks and records a mechanical PASS
  bundle <story>                       assemble the story's refs (PRD rows, ADRs, doc sections) into one context file
  wave [--max <n>] [--json]            next set of stories that can run in parallel
  lock-tests <id> | unlock-tests <id> | verify-locks [id]
  graph | trace | impact <node> | context <story>   [--json]
  metrics [--json]
  pack list | pack add <name>
  hook                                 Claude Code hook handler (reads JSON on stdin)`;

function main(argv) {
  const flags = {}; const pos = [];
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const n = argv[i + 1]; if (n === undefined || n.startsWith('--')) flags[a.slice(2)] = true; else { flags[a.slice(2)] = n; i++; } } else pos.push(a); }
  const [cmd, a1, a2] = pos;
  if (cmd === 'hook') return hook();
  if (!cmd || cmd === 'help') { console.log(HELP); return 0; }
  const root = findRoot();
  if (!root) { console.error('No bmad/config.yaml found in this folder or its parents.'); return 1; }
  const out = (obj, text) => console.log(flags.json ? JSON.stringify(obj, null, 2) : text);
  const needStatus = () => { const s = loadStatus(root); if (!s) throw new Error(`${P.status} missing — run init`); return s; };

  switch (cmd) {
    case 'init': {
      if (loadStatus(root) && !flags.force) throw new Error('already initialised (use --force to overwrite)');
      const track = flags.track || 'standard';
      if (!['quick', 'standard', 'enterprise'].includes(track)) throw new Error('track must be quick, standard or enterprise');
      for (const d of ['docs/01-discovery', 'docs/02-planning', 'docs/03-solutioning/adr', P.stories, 'docs/05-release', 'docs/06-operate', 'docs/user-guide', P.reviews]) fs.mkdirSync(path.join(root, d), { recursive: true });
      const waived = { status: 'waived', date: today(), by: 'init', notes: 'quick track' };
      saveStatus(root, { project_name: flags.name || '', track, current_phase: track === 'quick' ? 3 : 1, artifacts: {}, gates: { G1: track === 'quick' ? waived : { status: 'pending' }, G2: track === 'quick' ? waived : { status: 'pending' }, G3: { status: 'pending' }, G5: { status: 'pending' }, G6: { status: 'pending' } }, open_questions: [], change_log: [] });
      const cf = path.join(root, 'bmad/config.yaml');
      fs.writeFileSync(cf, fs.readFileSync(cf, 'utf8').replace(/^project_name:.*$/m, `project_name: "${flags.name || ''}"`).replace(/^track:\s*\S+/m, `track: ${track}`));
      console.log(`Initialised "${flags.name || ''}" on the ${track} track.`);
      return 0;
    }
    case 'status': {
      const s = needStatus(); const all = stories(root);
      const counts = {}; all.forEach((x) => (counts[x.status] = (counts[x.status] || 0) + 1));
      out({ ...s, story_counts: counts }, [`${s.project_name || '(unnamed)'} — track ${s.track}, phase ${s.current_phase}`, `Gates: ${Object.entries(s.gates).map(([g, v]) => `${g}=${v.status}`).join('  ')}`, `Stories: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`, flags.verbose ? `Artifacts: ${Object.entries(s.artifacts).map(([k, v]) => `${k} (${v})`).join(', ') || 'none'}` : `Artifacts: ${Object.keys(s.artifacts).length} (--verbose lists them)`, `Open questions:${s.open_questions.length ? '\n' + s.open_questions.map((q, i) => `  ${i + 1}. ${q}`).join('\n') : 'none'}`].join('\n'));
      return 0;
    }
    case 'artifact': { const s = needStatus(); if (!['draft', 'review', 'approved'].includes(a2)) throw new Error('state must be draft, review or approved'); if (!exists(root, a1)) throw new Error(`${a1} does not exist`); s.artifacts[norm(a1)] = a2; saveStatus(root, s); console.log(`${norm(a1)}: ${a2}`); return 0; }
    case 'question': { const s = needStatus(); if (flags.resolve) s.open_questions.splice(Number(flags.resolve) - 1, 1); else if (a1) s.open_questions.push(a1); else throw new Error('give the question text or --resolve <n>'); saveStatus(root, s); console.log(`${s.open_questions.length} open question(s)`); return 0; }
    case 'change': { const s = needStatus(); if (!a1) throw new Error('give the change text'); s.change_log.push(`${today()} ${a1}`); saveStatus(root, s); metric(root, { type: 'change', text: a1 }); console.log('logged'); return 0; }
    case 'phase': { const s = needStatus(); const n = Number(a1); if (!(n >= 1 && n <= 6)) throw new Error('phase must be 1..6'); s.current_phase = n; saveStatus(root, s); console.log(`phase ${n}`); return 0; }
    case 'validate': {
      const gate = flags.story ? 'G4' : flags.gate;
      if (!gate) throw new Error('give --gate <G> or --story <id>');
      const r = validate(root, gate, flags.story);
      out(r, [`${gate}${flags.story ? ' ' + flags.story : ''}: ${r.errors.length ? 'FAIL' : 'CLEAN'}`, ...r.errors.map((e) => `  ✘ [${e.code}] ${e.msg}`), ...r.warnings.map((w) => `  ! ${w}`)].join('\n'));
      return r.errors.length ? 1 : 0;
    }
    case 'gate': {
      const s = needStatus();
      if (!GATES.includes(a1)) throw new Error(`gate must be one of ${GATES.join(', ')} (G4 is per story: use "story <id> done")`);
      if (!['pass', 'fail', 'waive'].includes(a2)) throw new Error('decision must be pass, fail or waive');
      if (!flags.by || flags.by === true) throw new Error('--by <who approved> is required');
      const auto = String(flags.by).toLowerCase() === 'autopilot';
      const cfg = config(root);
      if (auto && a2 !== 'fail') {
        if (a1 === 'G6') throw new Error('autopilot can never decide G6 — go-live needs a human');
        if (a2 === 'waive') throw new Error('autopilot cannot waive a gate');
        if (!process.env.BMAD_EVAL && !asList(cfg.autopilot.auto_pass).includes(a1)) throw new Error(`autopilot is not allowed to pass ${a1} (see autopilot.auto_pass in bmad/config.yaml) — ask the human`);
      }
      if (a2 === 'waive' && (!flags.notes || flags.notes === true)) throw new Error('waiving needs --notes <reason>');
      const r = validate(root, a1);
      if (a2 === 'pass' && r.errors.length) { metric(root, { type: 'gate', gate: a1, result: 'fail', by: flags.by, failures: r.errors.map((e) => e.code) }); s.gates[a1] = { status: 'failed', date: today(), by: 'validator', notes: r.errors.map((e) => e.msg).join('; ') }; saveStatus(root, s); console.error(`${a1} cannot pass — validator found:\n${r.errors.map((e) => `  ✘ [${e.code}] ${e.msg}`).join('\n')}`); return 1; }
      const status = { pass: 'passed', fail: 'failed', waive: 'waived' }[a2];
      s.gates[a1] = { status, date: today(), by: flags.by, notes: flags.notes && flags.notes !== true ? flags.notes : '' };
      if (a2 !== 'fail') { const n = Number(a1[1]); s.current_phase = Math.max(s.current_phase, Math.min(6, n === 5 ? 6 : n + 1)); }
      saveStatus(root, s);
      metric(root, { type: 'gate', gate: a1, result: a2, by: flags.by, failures: a2 === 'fail' ? r.errors.map((e) => e.code) : [] });
      console.log(`${a1}: ${status} by ${flags.by}. Phase ${s.current_phase}.`);
      return 0;
    }
    case 'stories': { const all = stories(root); const locks = readJson(root, P.locks, {}); out(all.map(({ text, section, ...x }) => ({ ...x, tests_locked: !!locks[x.id] })), all.map((s) => `${s.id.padEnd(8)} ${s.status.padEnd(12)} ${locks[s.id] ? 'T' : s.tests_exempt_reason ? 'x' : '-'} deps[${s.depends_on.join(',')}] ${s.title}`).join('\n') || 'no stories'); return 0; }
    case 'story': {
      const s = stories(root).find((x) => x.id === a1);
      if (!s) throw new Error(`unknown story ${a1}`);
      if (a2 === 'verify') return verifyStory(root, s);
      if (!STORY_STATES.includes(a2)) throw new Error(`status must be one of ${STORY_STATES.join(', ')} (or "verify")`);
      if (a2 === 'done') {
        const r = validate(root, 'G4', a1);
        if (flags['accept-concerns'] && (!flags.by || flags.by === true || /^(autopilot|orchestrator|claude)$/i.test(String(flags.by)))) throw new Error('--accept-concerns needs --by <a human name>; an agent cannot accept CONCERNS');
        if (s.verdict === 'CONCERNS' && !flags['accept-concerns']) r.errors.push({ code: 'qa-concerns', msg: `${a1} QA verdict is CONCERNS — the human must accept (--accept-concerns)` });
        if (r.errors.length) { metric(root, { type: 'story', id: a1, from: s.status, to: 'done-refused', failures: r.errors.map((e) => e.code) }); console.error(`${a1} cannot be done:\n${r.errors.map((e) => `  ✘ [${e.code}] ${e.msg}`).join('\n')}`); return 1; }
      }
      setStoryStatus(root, s, a2);
      metric(root, { type: 'story', id: a1, from: s.status, to: a2 });
      console.log(`${a1}: ${s.status} → ${a2}`);
      if (a2 === 'in-progress' && s.refs.length) { const b = writeBundle(root, s); console.log(`context bundle: ${b.rel}${b.missing.length ? `  (UNRESOLVED refs: ${b.missing.join(', ')})` : ''}`); }
      if (a2 === 'review') console.log(s.risk === 'low' && config(root).qa.mechanical_for_low_risk !== false ? `risk low: run "story ${a1} verify" — no QA agent needed` : `risk ${s.risk}: needs a QA review (batched per wave or epic)`);
      return 0;
    }
    case 'bundle': {
      const s = stories(root).find((x) => x.id === a1);
      if (!s) throw new Error(`unknown story ${a1}`);
      const b = writeBundle(root, s);
      console.log(`${b.rel}${b.missing.length ? `\nUNRESOLVED refs: ${b.missing.join(', ')}` : ''}`);
      return b.missing.length ? 1 : 0;
    }
    case 'resume': { console.log(resume(root)); return 0; }
    case 'wave': { const w = wave(root, flags.max && Number(flags.max)); out(w, [`Wave: ${w.wave.map((s) => s.id).join(', ') || '(nothing can start)'}`, ...w.wave.map((s) => `  ${s.id} ${s.file}`), w.needs_tests.length ? `Need acceptance tests first: ${w.needs_tests.join(', ')}` : '', ...w.waiting.map((x) => `  waiting ${x.id}: ${x.reason}`)].filter(Boolean).join('\n')); return 0; }
    case 'lock-tests': { const f = lockTests(root, a1); console.log(`${a1}: locked ${f.length} file(s)\n${f.map((x) => '  ' + x).join('\n')}`); return 0; }
    case 'unlock-tests': { const l = readJson(root, P.locks, {}); delete l[a1]; writeJson(root, P.locks, l); console.log(`${a1}: unlocked`); return 0; }
    case 'verify-locks': { const p = verifyLocks(root, a1); console.log(p.length ? p.join('\n') : 'all locked acceptance tests intact'); return p.length ? 1 : 0; }
    case 'graph': { const g = buildGraph(root); out(g, `graph: ${Object.keys(g.nodes).length} nodes, ${g.edges.length} edges → ${P.graph}`); return 0; }
    case 'trace': { const t = trace(root); out(t, t.map((r) => `${r.id.padEnd(7)} stories[${r.stories.join(', ') || 'NONE'}] decisions[${r.decisions.join(', ')}] tests:${r.tests}`).join('\n') || 'no requirements found in the PRD'); return 0; }
    case 'impact': { const r = impact(root, a1); out(r, r.map((n) => `${n.type.padEnd(11)} ${n.id}${n.status ? ` (${n.status})` : ''} via ${n.via} — ${n.title || n.file || ''}`).join('\n') || 'nothing depends on it'); return 0; }
    case 'context': { console.log(storyContext(root, a1)); return 0; }
    case 'metrics': { const m = metricsSummary(root); out(m, JSON.stringify(m, null, 2)); return 0; }
    case 'pack': {
      const dir = path.join(TOOL_DIR, '..', 'packs');
      const names = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => fs.existsSync(path.join(dir, n, 'pack.json'))) : [];
      if (a1 === 'list' || !a1) { console.log(names.map((n) => `${n} — ${JSON.parse(fs.readFileSync(path.join(dir, n, 'pack.json'), 'utf8')).description}`).join('\n') || 'no packs'); return 0; }
      if (a1 !== 'add' || !names.includes(a2)) throw new Error(`usage: pack add <${names.join('|')}>`);
      const src = path.join(dir, a2);
      const copied = [];
      for (const f of fs.existsSync(path.join(src, 'agents')) ? fs.readdirSync(path.join(src, 'agents')) : []) { fs.mkdirSync(path.join(root, '.claude/agents'), { recursive: true }); fs.copyFileSync(path.join(src, 'agents', f), path.join(root, '.claude/agents', f)); copied.push(`.claude/agents/${f}`); }
      const marker = `<!-- pack:${a2} -->`;
      const gatesFile = path.join(root, 'bmad/gates.md');
      const add = path.join(src, 'gates.md');
      if (fs.existsSync(add) && !fs.readFileSync(gatesFile, 'utf8').includes(marker)) { fs.appendFileSync(gatesFile, `\n${marker}\n${fs.readFileSync(add, 'utf8')}`); copied.push('bmad/gates.md (items appended)'); }
      console.log(`pack ${a2} added:\n${copied.map((c) => '  ' + c).join('\n')}\nRestart the session so the new agent loads.`);
      return 0;
    }
    default: console.error(`unknown command "${cmd}"\n${HELP}`); return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(`bmad: ${e.message}`); process.exitCode = 1; }
}
