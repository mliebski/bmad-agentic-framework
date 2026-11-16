---
description: Phase 6 — retrospective and feedback loop into the next iteration
argument-hint: [feedback, metrics, incidents — text or file paths]
---

Close the loop after go-live. Input: $ARGUMENTS

1. Ask the user for what is available: product metrics versus the PRD's success metrics,
   user feedback, support tickets, incidents, campaign results. Work with what they give;
   do not invent numbers.
2. Delegate in parallel:
   - `business-analyst` → `docs/06-operate/feedback-log.md`: cluster the feedback, link it to
     FRs, propose backlog items.
   - `marketing-specialist` → adoption and launch results summary (only if numbers exist).
3. Write `docs/06-operate/retro.md` from `bmad/templates/retro.md` yourself, from the agent
   outputs, the gate history and change log (`node bmad/tools/bmad.mjs status --json`), the delivery metrics
   (`node bmad/tools/bmad.mjs metrics`), and the user's own
   observations: what went well, what did not, metrics versus targets, process changes.
4. Delegate to `product-manager`: prioritise the proposed backlog items and recommend the
   next iteration's scope.
5. Present the recommendation. Next iteration: `/bmad:discover` for new problems,
   `/bmad:prd` for extending the product, or `/bmad:stories` on the quick track for small
   improvements. Once the user chooses, set the phase with `node bmad/tools/bmad.mjs phase <n>`.
6. If the metrics show repeated gate failures or story rework, recommend `/bmad:improve`.
