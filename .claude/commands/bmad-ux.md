---
description: Phase 2 — the UX Specialist creates the UX specification from the PRD
argument-hint: [optional focus, brand or design-system notes]
---

Run the UX step of phase 2. Input: $ARGUMENTS

1. `docs/02-planning/prd.md` must exist.
2. Delegate to `ux-specialist`: write `docs/02-planning/ux-spec.md` from
   `bmad/templates/ux-spec.md`. Pass on design-system or brand notes from the input.
3. If the UX specialist reports conflicts with the PRD, show them to the user, get a
   decision, then send the affected document back to its owner (`product-manager` or
   `ux-specialist`) to update. The PRD and UX spec must not contradict each other.
4. Record the spec with `node bmad/tools/bmad.mjs artifact docs/02-planning/ux-spec.md review`. Next:
   `/bmad-prototype` to test the design with synthetic users, `/bmad-redteam prd`, then `/bmad-gate G2`.
