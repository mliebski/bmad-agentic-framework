---
description: Run a quality gate (G1–G6) and record the human decision
argument-hint: <G1|G2|G3|G5|G6>  (default — the current phase's gate)
---

Run gate: $ARGUMENTS (if empty, the gate of `current_phase` in `docs/bmad-status.yaml`).
G4 is per story and is run by `/bmad-qa <story>`.

1. Read the gate's checklist in `bmad/gates.md` and the artifacts it concerns.
2. Evaluate each item yourself against the files — quote the evidence (file and section) or
   state what is missing. For items needing specialist judgement delegate a review to the
   agent that does **not** own the artifact:
   - G1 → `product-manager` reviews the discovery docs
   - G2 → `solution-architect` reviews the PRD and UX spec for feasibility
   - G3 → `qa-tester` reviews stories for testability; `developer` (read-only review) for
     whether one story can be implemented from its file alone
   - G5 → `qa-tester` release QA; `product-manager` checks scope against the PRD
   - G6 → `solution-architect` and `qa-tester`
3. Present the checklist with ✔ / ✘ / N/A per item and a proposed verdict.
4. Ask the user explicitly: approve, reject, or waive (with reason). Do not infer approval.
5. Record in `docs/bmad-status.yaml`: status, date, approver, notes. On `passed` or `waived`
   advance `current_phase` and mark the phase's artifacts `approved`. On `failed` list the
   fixes and which command addresses each.
