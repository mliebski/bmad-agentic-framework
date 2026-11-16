---
description: Run a quality gate (G1–G6) and record the human decision
argument-hint: <G1|G2|G3|G5|G6>  (default — the current phase's gate)
---

Run gate: $ARGUMENTS (if empty, the gate of the current phase from
`node bmad/tools/bmad.mjs status`). G4 is per story and is run by `/bmad:qa <story>`.

1. **Machine checks.** Run `node bmad/tools/bmad.mjs validate --gate <G>`. If it fails, stop
   here: show the failures, name the command that fixes each, and do not ask for approval —
   the tool would refuse the pass anyway.
2. **Judgement checks.** Read the gate's checklist in `bmad/gates.md`. For the items not
   marked ⚙, evaluate each against the artifacts and quote the evidence (file and section)
   or state what is missing. Delegation scales with the track in `bmad/config.yaml`:
   **quick** — none, you check the items yourself; **standard** — delegate only where the
   list below says *(standard)*; **enterprise** — delegate every review in the list. When
   delegating, use an agent that does **not** own the artifact:
   - G1 → `product-manager` reviews the discovery docs
   - G2 → `solution-architect` reviews the PRD and UX spec for feasibility (standard)
   - G3 → `adversarial-reviewer` (lens `stories`) on the three riskiest stories only,
     whether each can be built from its file and bundle alone (standard; enterprise: all
     stories); `qa-tester` reviews stories for testability
   - G5 → `product-manager` checks scope against the PRD
   - G6 → `solution-architect` and `qa-tester`
3. Present the checklist with ✔ / ✘ / N/A per item and a proposed verdict.
4. Ask the user explicitly: approve, reject, or waive (with reason). Do not infer approval.
5. Record the decision exactly as given:
   `node bmad/tools/bmad.mjs gate <G> pass|fail|waive --by "<user's name>" --notes "<notes>"`.
   The tool advances the phase on pass or waive. On fail, list the fixes and which command
   addresses each.
