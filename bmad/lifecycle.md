# Product lifecycle

Six phases, each closed by a gate (`bmad/gates.md`). Artifacts are written from the templates
in `bmad/templates/`. State is owned by the BMAD tool: `node bmad/tools/bmad.mjs help`.

| # | Phase | Command | Agents | Artifacts | Gate |
|---|---|---|---|---|---|
| 0 | Setup | `/bmad-init` | orchestrator | `docs/bmad-status.json`, folders | — |
| 1 | Discovery | `/bmad-discover` | business-analyst (+ marketing-specialist) | `01-discovery/project-brief.md`, `research.md`, `requirements.md` | G1 |
| 2 | Planning | `/bmad-prd`, `/bmad-ux`, `/bmad-prototype`, `/bmad-redteam prd` | product-manager, ux-specialist, synthetic-user, adversarial-reviewer | `02-planning/prd.md`, `ux-spec.md`, `prototype/`, `reviews/prd.review.md` | G2 |
| 3 | Solutioning | `/bmad-architect`, `/bmad-stories`, `/bmad-redteam architecture` | solution-architect, product-manager, qa-tester, adversarial-reviewer | `03-solutioning/architecture.md`, `adr/`, `epics.md`, `test-strategy.md`, `04-implementation/stories/*.md`, `reviews/architecture.review.md` | G3 |
| 4 | Implementation | `/bmad-sprint`, `/bmad-qa` | qa-tester (tests first), developer ×N, qa-tester (review) | locked acceptance tests, code, updated story files | G4 per story |
| 5 | Release | `/bmad-release` | qa-tester, documentation-writer, solution-architect, marketing-specialist | `05-release/qa-report.md`, `release-notes.md`, `deployment-runbook.md`, `launch-plan.md`, `user-guide/` | G5 |
| 6 | Go-live & operate | `/bmad-golive`, `/bmad-retro`, `/bmad-improve` | solution-architect, qa-tester, product-manager, business-analyst | `05-release/go-live-checklist.md`, `06-operate/retro.md`, `feedback-log.md` | G6 |

Any time: `/bmad-help` (what next), `/bmad-auto` (drive a phase to its gate), `/bmad-gate`
(run a gate), `/bmad-change` (course correction), `/bmad-redteam` (adversarial review),
`/bmad-party` (multi-agent roundtable).

After go-live the loop restarts: feedback and retro items become input for the next
`/bmad-discover` or go straight to `/bmad-stories` for small changes.

## Tracks

| Track | Use for | What is skipped or lightened |
|---|---|---|
| `quick` | Bug fix, small feature, 1–5 stories | Phases 1–2 skipped (G1, G2 waived at init); G3 checks stories and the test command only; marketing and UX optional |
| `standard` | A product or a substantial feature | Everything, as described above |
| `enterprise` | Regulated, multi-team, high availability | Standard plus: threat model ADR, performance test plan, rollback rehearsal before G6; add the `security` and `compliance` packs |

## What is enforced mechanically

| Rule | Enforced by |
|---|---|
| A gate cannot pass while its checks fail | `bmad.mjs gate <G> pass` runs the validator and refuses |
| Autopilot cannot pass a gate unless configured, and never G6 | `bmad.mjs gate … --by autopilot` |
| Status, locks and metrics files are not hand-edited | PreToolUse hook |
| No developer before G3 | PreToolUse hook on agent spawn |
| No developer on a story without locked acceptance tests | PreToolUse hook on agent spawn |
| Developers edit only inside the story's `touches` | PreToolUse hook (developer agent) |
| Locked acceptance tests are not edited by anyone but QA | PreToolUse hook + hash check at story done and at G5 |
| A story cannot be `done` with open tasks, no test evidence, or no QA PASS | `bmad.mjs story <id> done` |

Hooks see file-edit tools, not shell commands. A file changed through the shell is caught
later by the hash check, not prevented. These are guardrails against drift, not a sandbox.

## State

`docs/bmad-status.json` — project, track, phase, artifact states, gate decisions, open
questions, change log. Written only by the tool.

Story state is the `status` field in each story file's front matter
(`draft | ready | in-progress | review | done | blocked | deferred`), changed with
`bmad.mjs story <id> <status>`. `bmad.mjs stories` lists them; `bmad.mjs wave` returns the
stories that can start now in parallel (dependencies done, acceptance tests locked,
`touches` not overlapping).

`docs/bmad-metrics.jsonl` — every gate decision, refusal and story transition, appended by
the tool. Input for `/bmad-improve`.

`docs/bmad-graph.json` — derived index of requirements, decisions, stories and tests
(`bmad.mjs graph | trace | impact <id> | context <story>`). The documents stay the source
of truth; the graph is rebuilt from them on every call.
