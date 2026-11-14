---
description: Phase 1 — discovery with the Business Analyst (brief, research, requirements)
argument-hint: [idea, notes, or paths to source material]
---

Run phase 1 (Discovery). Input: $ARGUMENTS

1. Read `docs/bmad-status.yaml`. If missing, stop and point to `/bmad-init`.
2. **Elicit first.** Before delegating, ask the user up to five focused questions about the
   problem, the users, success metrics, constraints and deadline — skip any already answered
   in the input or in existing discovery files.
3. Delegate in parallel:
   - `business-analyst` → project brief, research and requirements in `docs/01-discovery/`,
     using the user's answers and any source paths.
   - `marketing-specialist` (standard and enterprise tracks) → market input,
     `docs/01-discovery/market-positioning.md`.
4. When both return, if the marketing input changes the picture, send the
   `business-analyst` back once to reconcile the brief with it.
5. Relay the agents' open questions to the user; write the answers into the brief
   (via the business analyst if substantial).
6. Update artifact states in `docs/bmad-status.yaml`, summarise the brief in five lines and
   recommend `/bmad-gate G1`.
