#!/usr/bin/env node
// Install the BMAD framework into a project folder.
//
//   node bmad/tools/install.mjs <target-folder>                 full install (agents, commands, hooks, MCP, assets)
//   node bmad/tools/install.mjs <target-folder> --assets-only   only bmad/ and CLAUDE.md (when used as a plugin)
//   add --force to overwrite an existing bmad/config.yaml
//
// Never overwrites a project's own settings: hooks and MCP entries are merged in,
// CLAUDE.md is appended to, and an existing bmad/config.yaml is kept.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
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

// 1. bmad/ assets (templates, gates, lifecycle, tools, packs)
const keepConfig = fs.existsSync(path.join(DST, 'bmad/config.yaml')) && !force;
fs.cpSync(path.join(SRC, 'bmad'), path.join(DST, 'bmad'), {
  recursive: true,
  filter: (s) => {
    const rel = path.relative(path.join(SRC, 'bmad'), s).replace(/\\/g, '/');
    if (rel.startsWith('improvements/')) return false;      // proposals belong to the project they came from
    if (rel === 'config.yaml' && keepConfig) return false;
    return true;
  },
});
done.push(`bmad/ ${keepConfig ? '(kept existing config.yaml)' : ''}`);

// 2. orchestrator rules
const rules = fs.readFileSync(path.join(SRC, 'CLAUDE.md'), 'utf8');
const claudeMd = path.join(DST, 'CLAUDE.md');
if (!fs.existsSync(claudeMd)) { fs.writeFileSync(claudeMd, rules); done.push('CLAUDE.md (created)'); }
else if (!fs.readFileSync(claudeMd, 'utf8').includes('BMAD Orchestrator')) { fs.appendFileSync(claudeMd, `\n\n${rules}`); done.push('CLAUDE.md (orchestrator rules appended)'); }
else done.push('CLAUDE.md (already has the orchestrator rules)');

if (!assetsOnly) {
  // 3. agents and commands
  fs.cpSync(path.join(SRC, '.claude/agents'), path.join(DST, '.claude/agents'), { recursive: true });
  done.push(`.claude/agents/ (${fs.readdirSync(path.join(SRC, '.claude/agents')).length} files)`);
  // Commands are stored without the prefix (so the plugin shows /bmad:init) and get it back here,
  // so a project always sees /bmad-init, which does not clash with Claude Code's built-in /init.
  const cmdDir = path.join(DST, '.claude/commands');
  fs.mkdirSync(cmdDir, { recursive: true });
  const cmds = fs.readdirSync(path.join(SRC, '.claude/commands'));
  for (const c of cmds) fs.copyFileSync(path.join(SRC, '.claude/commands', c), path.join(cmdDir, 'bmad-' + c));
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
  if (!mcp.mcpServers.bmad) { mcp.mcpServers.bmad = readJson(path.join(SRC, '.mcp.json'), {}).mcpServers?.bmad; writeJson(mFile, mcp); done.push('.mcp.json (bmad server added)'); }
  else done.push('.mcp.json (bmad server already present)');
}

console.log(`BMAD installed into ${DST}\n${done.map((d) => '  ' + d).join('\n')}\n\nNext: open the folder in Claude Code and run /bmad-init.`);
