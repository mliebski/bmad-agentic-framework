---
description: Phase 3 — the Solution Architect designs the architecture and writes ADRs
argument-hint: [optional constraints, e.g. preferred stack or hosting]
---

Run the architecture step of phase 3. Input: $ARGUMENTS

1. Run `node bmad/tools/bmad.mjs status`. Gate G2 must be `passed` or `waived`; otherwise recommend
   `/bmad-gate G2`.
2. Ask the user for hard technical constraints not already documented (existing stack,
   hosting, compliance, team skills, budget) — one round, skip what is known.
3. Delegate in parallel:
   - `solution-architect` → `docs/03-solutioning/architecture.md` and ADRs; fill the build,
     test and lint commands, `acceptance_tests_dir` and `shared_files` in `bmad/config.yaml`. Inputs: PRD, UX spec, discovery docs,
     existing code.
   - `qa-tester` (test strategy mode) → `docs/03-solutioning/test-strategy.md`. If it needs
     the architecture, run it after the architect instead.
4. Present the key decisions and trade-offs to the user as a short list; get agreement on
   anything expensive to reverse (data store, hosting, auth, build-vs-buy).
5. Record each artifact with `node bmad/tools/bmad.mjs artifact <path> review`. Next: `/bmad-redteam architecture`,
   then `/bmad-stories`.
