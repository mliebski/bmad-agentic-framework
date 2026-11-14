# Product lifecycle

Six phases, each closed by a gate (`bmad/gates.md`). Artifacts are written from the templates
in `bmad/templates/`.

| # | Phase | Command | Agents | Artifacts | Gate |
|---|---|---|---|---|---|
| 0 | Setup | `/bmad-init` | orchestrator | `docs/bmad-status.yaml`, folders | — |
| 1 | Discovery | `/bmad-discover` | business-analyst (+ marketing-specialist for market input) | `01-discovery/project-brief.md`, `research.md`, `requirements.md` | G1 Discovery |
| 2 | Planning | `/bmad-prd`, `/bmad-ux` | product-manager, ux-specialist | `02-planning/prd.md`, `ux-spec.md` | G2 Planning |
| 3 | Solutioning | `/bmad-architect`, `/bmad-stories` | solution-architect, product-manager, qa-tester | `03-solutioning/architecture.md`, `adr/`, `epics.md`, `test-strategy.md`, `04-implementation/stories/*.md` | G3 Implementation readiness |
| 4 | Implementation | `/bmad-sprint`, `/bmad-qa` | developer ×N, qa-tester | code, tests, updated story files, `sprint-status.yaml` | G4 Story done (per story) |
| 5 | Release | `/bmad-release` | qa-tester, documentation-writer, solution-architect, marketing-specialist | `05-release/qa-report.md`, `release-notes.md`, `deployment-runbook.md`, `launch-plan.md`, `user-guide/` | G5 Release readiness |
| 6 | Go-live & operate | `/bmad-golive`, `/bmad-retro` | solution-architect, qa-tester, product-manager, business-analyst | `05-release/go-live-checklist.md`, `06-operate/retro.md`, `feedback-log.md` | G6 Go-live |

Any time: `/bmad-help` (what next), `/bmad-gate` (run a gate), `/bmad-change` (course
correction), `/bmad-party` (multi-agent roundtable on a question).

After go-live the loop restarts: feedback and retro items become input for the next
`/bmad-discover` or go straight to `/bmad-stories` for small changes.

## Tracks

| Track | Use for | What is skipped or lightened |
|---|---|---|
| `quick` | Bug fix, small feature, 1–5 stories | Phases 1–3 collapse into a short tech-spec inside the stories; gates G1–G2 skipped; G3 lightweight; marketing and UX optional |
| `standard` | A product or a substantial feature | Everything, as described above |
| `enterprise` | Regulated, multi-team, high availability | Standard plus: security and compliance sections mandatory in the architecture, threat model ADR, performance test plan, rollback rehearsal before G6 |

## Status file

`docs/bmad-status.yaml` is the single source of truth:

```yaml
project_name: Example
track: standard
current_phase: 2            # 1..6
artifacts:                  # path: draft | review | approved
  docs/01-discovery/project-brief.md: approved
gates:                      # pending | passed | failed | waived
  G1: {status: passed, date: 2026-01-10, approved_by: user, notes: ""}
  G2: {status: pending}
open_questions: []          # things only the human can answer
change_log: []              # one line per /bmad-change
```

Stories are tracked separately in `docs/04-implementation/sprint-status.yaml`:

```yaml
stories:
  E1-S1: {title: "...", status: ready, depends_on: [], touches: [src/auth/]}
# status: draft | ready | in-progress | review | done | blocked
```
