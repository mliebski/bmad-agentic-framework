---
description: Phase 5 — release preparation — QA report, docs, runbook and launch plan
argument-hint: [version, e.g. 1.0.0, and target date]
---

Prepare the release. Input: $ARGUMENTS

1. Read `docs/bmad-status.yaml` and `sprint-status.yaml`. List stories not `done`; ask the
   user whether to defer them (they go into the release notes as deferred) or stop.
2. Delegate in parallel:
   - `qa-tester` (release QA) → `docs/05-release/qa-report.md`
   - `documentation-writer` → `README.md`, `docs/user-guide/`, `docs/05-release/release-notes.md`
   - `solution-architect` → `docs/05-release/deployment-runbook.md` (deploy, verify, rollback)
3. Then, because launch claims must match what ships: `marketing-specialist` →
   `docs/05-release/launch-plan.md`, with the release notes and QA report as inputs.
   (Quick track: skip unless the user asks.)
4. If QA's verdict is FAIL, stop: list the defects and recommend creating fix stories with
   `/bmad-stories` and running `/bmad-sprint`.
5. Update `docs/bmad-status.yaml`. Next: `/bmad-gate G5`.
