---
description: Phase 2 — the Product Manager writes or revises the PRD
argument-hint: [optional focus or change request]
---

Run the PRD step of phase 2. Input: $ARGUMENTS

1. Run `node bmad/tools/bmad.mjs status`. Gate G1 must be `passed` or `waived`; if not, say so and
   recommend `/bmad:gate G1` — continue only if the user insists.
2. Delegate to `product-manager`: write (or revise) `docs/02-planning/prd.md` from
   `bmad/templates/prd.md`, inputs `docs/01-discovery/*`. Pass on any focus from the input.
3. Relay open questions to the user and have the product manager incorporate the answers.
4. Present to the user: goals, MVP scope, what is explicitly out, and the three riskiest
   assumptions. Ask for corrections before moving on.
5. Record the PRD with `node bmad/tools/bmad.mjs artifact docs/02-planning/prd.md review`. Next: `/bmad:ux`
   (user-facing products), `/bmad:prototype` (optional), `/bmad:redteam prd`, then `/bmad:gate G2`.
