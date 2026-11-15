#!/usr/bin/env node
// BMAD eval harness — runs the framework headless on reference projects and scores the result.
//
//   node evals/run.mjs                      run every project to its target gate, score, compare to baseline
//   node evals/run.mjs url-shortener        run one project
//   node evals/run.mjs --judge              add the LLM-judged quality score (extra cost)
//   node evals/run.mjs --score-only <dir> --project <name>   score an existing project folder, no model calls
//   node evals/run.mjs --save-baseline      store this run's scores as evals/baseline.json
//
// A full run starts Claude Code sessions and costs real tokens. Nothing here runs unless you start it.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(`--${n}`); if (i < 0) return undefined; const v = argv[i + 1]; return v && !v.startsWith('--') ? v : true; };
const valueFlags = ['score-only', 'project', 'threshold', 'to'];
const names = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && valueFlags.includes(argv[i - 1].slice(2))));
const GATE_ORDER = ['G1', 'G2', 'G3', 'G5'];
const ALLOWED = 'Read,Write,Edit,Glob,Grep,Agent,WebSearch,WebFetch,Bash(node bmad/tools/bmad.mjs *),Bash(git *),Bash(npm *),Bash(npx *),Bash(node *)';
const CLAUDE_ARGS = process.env.BMAD_EVAL_CLAUDE_ARGS || `--permission-mode acceptEdits --allowedTools "${ALLOWED}"`;

const sh = (cmd, cwd, env = {}) => spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 });
const bmad = (cwd, args) => sh(`node bmad/tools/bmad.mjs ${args}`, cwd);
const copy = (src, dst) => fs.cpSync(src, dst, { recursive: true, filter: (s) => !/[\\/](improvements|packs)[\\/]?$/.test(s) });
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);

function claude(prompt, cwd, env) {
  const r = sh(`claude -p ${JSON.stringify(prompt)} --output-format json ${CLAUDE_ARGS}`, cwd, env);
  let out = {};
  try { out = JSON.parse(r.stdout); } catch { out = { result: r.stdout, parse_error: true }; }
  return { exit: r.status, failed: r.status !== 0 || out.is_error === true || out.parse_error === true, cost: out.total_cost_usd ?? null, result: out.result ?? '', stderr: (r.stderr || '').slice(-2000) };
}

export function score(dir, exp) {
  const target = exp.target || 'G3';
  const gates = GATE_ORDER.slice(0, GATE_ORDER.indexOf(target) + 1);
  const status = JSON.parse(fs.readFileSync(path.join(dir, 'docs/bmad-status.json'), 'utf8'));
  // 1. structure: gates recorded as passed, and the validator agrees right now
  const gateDetail = {};
  for (const g of gates) {
    const v = bmad(dir, `validate --gate ${g} --json`);
    let errors = ['validator did not run'];
    try { errors = JSON.parse(v.stdout).errors.map((e) => e.code); } catch { /* keep default */ }
    gateDetail[g] = { recorded: status.gates?.[g]?.status || 'pending', by: status.gates?.[g]?.by || '', validator_errors: errors };
  }
  const structure = gates.filter((g) => gateDetail[g].recorded === 'passed' && !gateDetail[g].validator_errors.length).length / gates.length;
  // 2. coverage: things the documents must address
  const docs = walk(path.join(dir, 'docs')).filter((f) => f.endsWith('.md') && !f.includes(`${path.sep}reviews${path.sep}`));
  const text = docs.map((f) => fs.readFileSync(f, 'utf8')).join('\n').toLowerCase();
  const prd = (() => { try { return fs.readFileSync(path.join(dir, 'docs/02-planning/prd.md'), 'utf8').toLowerCase(); } catch { return ''; } })();
  const hit = (hay, item) => item.any_of.some((k) => hay.includes(k.toLowerCase()));
  const missed = (exp.must_cover || []).filter((c) => !hit(text, c)).map((c) => c.name);
  const coverage = exp.must_cover?.length ? 1 - missed.length / exp.must_cover.length : 1;
  // 3. discipline: scope creep and sizing
  const checks = [];
  for (const c of exp.must_not_be_in_mvp || []) checks.push({ name: `no scope creep: ${c.name}`, ok: !hit(prd, c) });
  const frs = new Set(prd.match(/^\|\s*fr-\d+/gm) || []).size;
  const stories = fs.existsSync(path.join(dir, 'docs/04-implementation/stories')) ? fs.readdirSync(path.join(dir, 'docs/04-implementation/stories')).filter((f) => f.endsWith('.md')).length : 0;
  if (exp.min_frs) checks.push({ name: `at least ${exp.min_frs} FRs (found ${frs})`, ok: frs >= exp.min_frs });
  if (exp.max_frs) checks.push({ name: `at most ${exp.max_frs} FRs (found ${frs})`, ok: frs <= exp.max_frs });
  if (exp.min_stories) checks.push({ name: `at least ${exp.min_stories} stories (found ${stories})`, ok: stories >= exp.min_stories });
  if (exp.max_stories) checks.push({ name: `at most ${exp.max_stories} stories (found ${stories})`, ok: stories <= exp.max_stories });
  const discipline = checks.length ? checks.filter((c) => c.ok).length / checks.length : 1;
  return { structure, coverage, discipline, detail: { gates: gateDetail, missed, checks, frs, stories, open_questions: status.open_questions?.length || 0 } };
}

function judge(dir) {
  const rubric = fs.readFileSync(path.join(HERE, 'rubric.md'), 'utf8');
  const prompt = `You are grading the output of a product-development framework. Read the rubric below, then read the documents in ./docs (project brief, PRD, UX spec, architecture, ADRs, two story files of your choice). Grade strictly against the rubric; do not reward length. Reply with ONLY a JSON object: {"scores": {"<criterion id>": <0-4>, ...}, "notes": "<three sentences>"}.\n\n${rubric}`;
  const r = sh(`claude -p ${JSON.stringify(prompt)} --output-format json --allowedTools "Read,Glob,Grep"`, dir);
  try {
    const obj = JSON.parse((JSON.parse(r.stdout).result.match(/\{[\s\S]*\}/) || [])[0]);
    const vals = Object.values(obj.scores).map(Number);
    return { score: vals.reduce((a, b) => a + b, 0) / (vals.length * 4), scores: obj.scores, notes: obj.notes };
  } catch { return { score: null, error: 'judge output could not be parsed' }; }
}

const total = (s, j) => (j == null ? (0.5 * s.structure + 0.35 * s.coverage + 0.15 * s.discipline) : (0.35 * s.structure + 0.25 * s.coverage + 0.1 * s.discipline + 0.3 * j));
const round = (n) => (n == null ? null : Math.round(n * 1000) / 1000);

function main() {
  const projDir = path.join(HERE, 'projects');
  const loadExp = (n) => JSON.parse(fs.readFileSync(path.join(projDir, n, 'expectations.json'), 'utf8'));

  if (flag('score-only')) {
    const name = flag('project');
    if (!name || name === true) { console.error('--score-only <dir> needs --project <name> for the expectations'); return 1; }
    const s = score(path.resolve(String(flag('score-only'))), loadExp(name));
    console.log(JSON.stringify({ project: name, total: round(total(s, null)), ...s }, null, 2));
    return 0;
  }

  const all = fs.readdirSync(projDir).filter((n) => fs.existsSync(path.join(projDir, n, 'expectations.json')));
  const run = names.length ? names : all;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const results = { stamp, framework_commit: sh('git rev-parse --short HEAD', REPO).stdout.trim(), judged: !!flag('judge'), projects: {} };

  for (const name of run) {
    if (!all.includes(name)) { console.error(`unknown project ${name} (have: ${all.join(', ')})`); return 1; }
    const exp = loadExp(name);
    const target = (flag('to') && flag('to') !== true ? flag('to') : exp.target) || 'G3';
    const dir = path.join(HERE, 'runs', stamp, name);
    fs.mkdirSync(dir, { recursive: true });
    for (const item of ['.claude', 'bmad', 'CLAUDE.md']) copy(path.join(REPO, item), path.join(dir, item));
    copy(path.join(projDir, name), path.join(dir, 'eval-input'));
    fs.rmSync(path.join(dir, 'eval-input', 'expectations.json'));   // the framework must not see the answer key
    sh('git init -q && git add -A && git -c user.name=eval -c user.email=eval@example.invalid commit -q -m "eval start"', dir);
    bmad(dir, `init --name "${exp.name}" --track ${exp.track || 'standard'}`);
    console.log(`▶ ${name}: running to ${target} in ${dir}`);
    const started = Date.now();
    const r = claude(`/bmad-auto to ${target} --answers eval-input/answers.md`, dir, { BMAD_EVAL: '1' });
    if (r.failed) {
      // A session that never ran is not a score of zero — report it and stop.
      console.error(`\n✘ ${name}: the headless Claude session failed (exit ${r.exit}).\n  ${String(r.result || r.stderr).trim().slice(0, 600)}\n  Nothing was scored. If this is an authentication error, sign in to the Claude Code CLI in a terminal and run again.`);
      return 2;
    }
    const s = score(dir, { ...exp, target });
    const j = flag('judge') ? judge(dir) : null;
    results.projects[name] = { total: round(total(s, j?.score ?? null)), structure: round(s.structure), coverage: round(s.coverage), discipline: round(s.discipline), judge: round(j?.score ?? null), minutes: Math.round((Date.now() - started) / 60000), cost_usd: r.cost, exit: r.exit, detail: s.detail, judge_detail: j, run_dir: path.relative(REPO, dir) };
    console.log(`  total ${results.projects[name].total}  structure ${round(s.structure)}  coverage ${round(s.coverage)}  discipline ${round(s.discipline)}${j ? `  judge ${round(j.score)}` : ''}  cost $${r.cost ?? '?'}`);
    if (s.detail.missed.length) console.log(`  not covered: ${s.detail.missed.join(', ')}`);
    for (const [g, d] of Object.entries(s.detail.gates)) if (d.recorded !== 'passed' || d.validator_errors.length) console.log(`  ${g}: ${d.recorded} ${d.validator_errors.join(',')}`);
  }

  fs.mkdirSync(path.join(HERE, 'results'), { recursive: true });
  fs.writeFileSync(path.join(HERE, 'results', `${stamp}.json`), JSON.stringify(results, null, 2));
  const basePath = path.join(HERE, 'baseline.json');
  let regressed = false;
  if (fs.existsSync(basePath)) {
    const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
    const thr = Number(flag('threshold') && flag('threshold') !== true ? flag('threshold') : 0.05);
    for (const [n, p] of Object.entries(results.projects)) {
      const b = base.projects?.[n]?.total;
      if (b == null) continue;
      const d = round(p.total - b);
      console.log(`  ${n}: ${b} → ${p.total} (${d >= 0 ? '+' : ''}${d})${d < -thr ? '  REGRESSION' : ''}`);
      if (d < -thr) regressed = true;
    }
    if (base.judged !== results.judged) console.log('  note: baseline and this run differ in --judge; totals are not comparable');
  } else console.log('no baseline yet — run with --save-baseline to create one');
  if (flag('save-baseline')) { fs.writeFileSync(basePath, JSON.stringify(results, null, 2)); console.log('baseline saved'); }
  return regressed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
