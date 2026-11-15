#!/usr/bin/env node
// BMAD MCP server — read-only view of project state and the requirements graph.
// Zero dependencies: newline-delimited JSON-RPC 2.0 over stdio.
// State is changed only through the CLI (bmad.mjs), never through this server.
import readline from 'node:readline';
import { findRoot, loadStatus, stories, wave, validate, trace, impact, storyContext, metricsSummary } from './bmad.mjs';

const str = { type: 'string' };
const TOOLS = [
  { name: 'bmad_status', description: 'Project name, track, current phase, gate decisions, artifact states, open questions and change log.', inputSchema: { type: 'object', properties: {} }, run: (r) => loadStatus(r) ?? { error: 'not initialised — run /bmad-init' } },
  { name: 'bmad_validate', description: 'Run the machine checks for a gate (G1, G2, G3, G5, G6) or, with story, the story-done checks (G4). Returns errors and warnings.', inputSchema: { type: 'object', properties: { gate: str, story: str } }, run: (r, a) => validate(r, a.story ? 'G4' : a.gate, a.story) },
  { name: 'bmad_stories', description: 'All stories with status, requirements, dependencies and touched paths.', inputSchema: { type: 'object', properties: {} }, run: (r) => stories(r).map(({ text, section, ...s }) => s) },
  { name: 'bmad_wave', description: 'Stories that can be developed in parallel right now, stories that still need acceptance tests, and stories that are waiting with the reason.', inputSchema: { type: 'object', properties: { max: { type: 'number' } } }, run: (r, a) => wave(r, a.max) },
  { name: 'bmad_trace', description: 'Traceability matrix: each requirement with the stories implementing it, the decisions addressing it and the number of locked acceptance tests.', inputSchema: { type: 'object', properties: {} }, run: (r) => trace(r) },
  { name: 'bmad_impact', description: 'Everything that depends on a requirement (FR-n, NFR-n), decision (ADR-nnn) or story (En-Sn): decisions, stories and tests affected if it changes.', inputSchema: { type: 'object', properties: { id: str }, required: ['id'] }, run: (r, a) => impact(r, a.id) },
  { name: 'bmad_story_context', description: 'Context pack for a story: the text of its requirements, the decisions addressing them, and the state of its dependencies.', inputSchema: { type: 'object', properties: { story: str }, required: ['story'] }, run: (r, a) => storyContext(r, a.story) },
  { name: 'bmad_metrics', description: 'Delivery metrics: gate attempts and failures by cause, story rework counts, blocked stories.', inputSchema: { type: 'object', properties: {} }, run: (r) => metricsSummary(r) },
];

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
function handle(req) {
  const { id, method, params = {} } = req;
  if (id === undefined) return;                       // notification — no reply
  const ok = (result) => send({ jsonrpc: '2.0', id, result });
  switch (method) {
    case 'initialize': return ok({ protocolVersion: params.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'bmad', version: '0.2.0' } });
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS.map(({ run, ...t }) => t) });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool) return send({ jsonrpc: '2.0', id, error: { code: -32602, message: `unknown tool ${params.name}` } });
      try {
        const root = findRoot(process.env.CLAUDE_PROJECT_DIR || process.cwd());
        if (!root) throw new Error('no bmad/config.yaml found in this project');
        const out = tool.run(root, params.arguments || {});
        return ok({ content: [{ type: 'text', text: typeof out === 'string' ? out : JSON.stringify(out, null, 2) }] });
      } catch (e) { return ok({ content: [{ type: 'text', text: `bmad: ${e.message}` }], isError: true }); }
    }
    default: return send({ jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${method}` } });
  }
}

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  if (!line.trim()) return;
  try { handle(JSON.parse(line)); } catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }); }
});
