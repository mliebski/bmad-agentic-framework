---
description: Phase 2 — clickable prototype of the key flows, walked by synthetic users before anything is built
argument-hint: [optional — flows or personas to focus on]
---

Prototype and test the design. Focus: $ARGUMENTS

1. `docs/02-planning/ux-spec.md` must exist (`/bmad:ux`).
2. Delegate to `ux-specialist` in prototype mode →
   `docs/02-planning/prototype/index.html` and `docs/02-planning/prototype/tasks.md`.
3. Read `tasks.md`. Spawn one `synthetic-user` per persona, in parallel (three to five;
   if the UX spec has fewer personas, add contrasting ones: a first-time user in a hurry,
   a keyboard-and-screen-reader user, a sceptical expert). Give each only: its persona
   text, the task list, and the prototype path. Do not give them the PRD or the spec.
4. Write `docs/02-planning/usability-findings.md` yourself from their reports: a table of
   findings (screen, element, persona, task, severity, what was expected), merged where
   several personas hit the same thing, plus task completion per persona. Head the file
   with: "Synthetic walkthrough by language-model personas — a first filter, not user
   research."
5. Delegate to `ux-specialist` in apply-findings mode: fix blockers and majors in the spec
   and prototype. If a finding comes from the requirements rather than the design, send it
   to `product-manager` instead and tell the user.
6. One re-walk with the personas that hit blockers. Stop after that round.
7. Tell the user where the prototype is so they can open it in a browser themselves —
   their own five minutes with it, or one real user's, outweighs the synthetic walk.
   Record artifacts with `node bmad/tools/bmad.mjs artifact <path> review`.
   Next: `/bmad:redteam prd`, then `/bmad:gate G2`.
