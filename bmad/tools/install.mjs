#!/usr/bin/env node
// Install the BMAD framework into a project folder.
//
//   node bmad/tools/install.mjs <target-folder>                 full install (agents, commands, hooks, MCP, assets)
//   node bmad/tools/install.mjs <target-folder> --assets-only   only bmad/ (used by /bmad:init when running as a plugin)
//   add --force to overwrite an existing bmad/config.yaml
//   node bmad/tools/install.mjs --sync-rules                    regenerate this repository's CLAUDE.md from the skill
//
// Command names. The sources write every command as /bmad:<name>, which is how Claude Code shows
// a plugin's commands. A full install copies the commands into the project as bmad-<name>.md and
// rewrites every /bmad:<name> to /bmad-<name> in what it copies, so a project sees /bmad-init and
// never clashes with Claude Code's built-in /init. An assets-only install (plugin mode) copies the
// text unchanged, because the plugin's own names are already /bmad:<name>.
//
// Never overwrites a project's own settings: hooks and MCP entries are merged in,
// CLAUDE.md is appended to, and an existing bmad/config.yaml is kept.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COMMANDS = 'architect|auto|change|discover|gate|golive|help|improve|init|party|prd|prototype|qa|redteam|release|retro|sprint|stories|ux';
const PLUGIN_FORM = new RegExp(`(?<![\\w./:-])/bmad:(${COMMANDS})(?![\\w-])`, 'g');
const toProjectForm = (text) => text.replace(PLUGIN_FORM, '/bmad-$1');

const args = process.argv.slice(2);
const SKILL = path.join(SRC, 'skills/orchestrator/SKILL.md');
const rulesFromSkill = () => fs.readFileSync(SKILL, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, '');

if (args.includes('--sync-rules')) {   // the skill is the single source of the orchestrator rules
  fs.writeFileSync(path.join(SRC, 'CLAUDE.md'), rulesFromSkill());
  console.log('CLAUDE.md regenerated from skills/orchestrator/SKILL.md');
  process.exit(0);
}

const target = args.find((a) => !a.startsWith('--'));
const assetsOnly = args.includes('--assets-only');
const force = args.includes('--force');
if (!target) { console.error('usage: node install.mjs <target-folder> [--assets-only] [--force]'); process.exit(1); }
const DST = path.resolve(target);
if (DST === SRC) { console.error('target is the framework folder itself — nothing to do'); process.exit(1); }
fs.mkdirSync(DST, { recursive: true });
const done = [];
const readJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);
const writeJson = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
const TEXT = /\.(md|mjs|yaml|yml|json)$/;
const adapt = (text) => (assetsOnly ? text : toProjectForm(text));

// copy a folder, adapting command names in text files; filter(rel) may skip entries
function copyTree(from, to, filter = () => true, rel = '') {
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (!filter(r)) continue;
    const s = path.join(from, e.name), d = path.join(to, e.name);
    if (e.isDirectory()) n += copyTree(s, d, filter, r);
    else if (TEXT.test(e.name)) { fs.writeFileSync(d, adapt(fs.readFileSync(s, 'utf8'))); n++; }
    else { fs.copyFileSync(s, d); n++; }
  }
  return n;
}

// 1. bmad/ assets (templates, gates, lifecycle, tools, packs)
const keepConfig = fs.existsSync(path.join(DST, 'bmad/config.yaml')) && !force;
copyTree(path.join(SRC, 'bmad'), path.join(DST, 'bmad'), (rel) => {
  if (rel.startsWith('improvements')) return false;      // proposals belong to the project they came from
  if (rel === 'config.yaml' && keepConfig) return false;
  return true;
});
done.push(`bmad/ ${keepConfig ? '(kept existing config.yaml)' : ''}`);

if (!assetsOnly) {
  // 2. orchestrator rules (single source: the skill)
  const rules = adapt(rulesFromSkill());
  const claudeMd = path.join(DST, 'CLAUDE.md');
  if (!fs.existsSync(claudeMd)) { fs.writeFileSync(claudeMd, rules); done.push('CLAUDE.md (created)'); }
  else if (!fs.readFileSync(claudeMd, 'utf8').includes('BMAD Orchestrator')) { fs.appendFileSync(claudeMd, `\n\n${rules}`); done.push('CLAUDE.md (orchestrator rules appended)'); }
  else done.push('CLAUDE.md (already has the orchestrator rules)');

  // 3. agents and commands (commands get the bmad- prefix)
  const na = copyTree(path.join(SRC, '.claude/agents'), path.join(DST, '.claude/agents'));
  done.push(`.claude/agents/ (${na} files)`);
  const cmdDir = path.join(DST, '.claude/commands');
  fs.mkdirSync(cmdDir, { recursive: true });
  const cmds = fs.readdirSync(path.join(SRC, '.claude/commands'));
  for (const c of cmds) fs.writeFileSync(path.join(cmdDir, 'bmad-' + c), toProjectForm(fs.readFileSync(path.join(SRC, '.claude/commands', c), 'utf8')));
  done.push(`.claude/commands/ (${cmds.length} files, named bmad-*)`);

  // 4. hooks — merge into existing settings
  const sFile = path.join(DST, '.claude/settings.json');
  const settings = readJson(sFile, {});
  const ours = readJson(path.join(SRC, '.claude/settings.json'), {}).hooks?.PreToolUse || [];
  settings.hooks ||= {}; settings.hooks.PreToolUse ||= [];
  if (!JSON.stringify(settings.hooks.PreToolUse).includes('bmad.mjs')) { settings.hooks.PreToolUse.push(...ours); writeJson(sFile, settings); done.push('.claude/settings.json (hook added)'); }
  else done.push('.claude/settings.json (hook already present)');
  // 5. MCP server — merge
  const mFile = path.join(DST, '.mcp.json');
  const mcp = readJson(mFile, {});
  mcp.mcpServers ||= {};
  // project form; the plugin's own .mcp.json uses ${CLAUDE_PLUGIN_ROOT}
  if (!mcp.mcpServers.bmad) { mcp.mcpServers.bmad = { command: 'node', args: ['bmad/tools/mcp-server.mjs'] }; writeJson(mFile, mcp); done.push('.mcp.json (bmad server added)'); }
  else done.push('.mcp.json (bmad server already present)');
}

const first = assetsOnly ? '/bmad:init' : '/bmad-init';
console.log(`BMAD installed into ${DST}\n${done.map((d) => '  ' + d).join('\n')}\n\nNext: open the folder in Claude Code and run ${first}.`);
