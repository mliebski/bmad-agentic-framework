---
description: Phase 6 — go-live — checklist, human go/no-go, guided cut-over and hypercare
argument-hint: [target environment and planned date/time]
---

Guide the production go-live. Input: $ARGUMENTS

**Safety rule: no agent deploys.** The user (or their pipeline) executes every production
step. You guide, record and verify.

1. Gate G5 must be `passed` for the build being released. If not, stop.
2. Delegate to `solution-architect`: write `docs/05-release/go-live-checklist.md` from
   `bmad/templates/go-live-checklist.md`, concrete for this system and the runbook
   (enterprise track: include the rollback rehearsal).
3. Walk the user through the **pre-flight** items one group at a time and record each result
   in the checklist.
4. **Go / no-go.** Summarise: G5 result, open defects, pre-flight results, rollback plan.
   Ask the user for an explicit "go". Anything else is "no-go".
5. On go: step through the runbook with the user. After each step the user runs, record the
   outcome. If a step fails, show the rollback procedure immediately and let the user decide.
6. After deployment: if the user names the environment and permits it, delegate read-only
   smoke checks to `qa-tester`; otherwise have the user run the smoke list. Record results.
7. Record gate G6 with `node bmad/tools/bmad.mjs gate G6 pass|fail --by <the user's name>` per the user's
   decision. The tool refuses G6 from autopilot and without a recorded GO in the checklist. Agree hypercare owner
   and duration; note them in the checklist.
8. Remind: launch communication from `docs/05-release/launch-plan.md` is the user's to send.
   Next: `/bmad-retro` after the hypercare period.
