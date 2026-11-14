---
description: Phase 4 — spawn developer agents (in parallel where safe) and QA-review each story
argument-hint: [story ids, an epic id, or empty for all ready stories]
---

Run an implementation wave. Scope: $ARGUMENTS

1. Gate G3 must be `passed` or `waived` in `docs/bmad-status.yaml`; otherwise recommend
   `/bmad-gate G3`.
2. Read `docs/04-implementation/sprint-status.yaml` and `bmad/config.yaml`. Select stories
   in scope with status `ready` whose `depends_on` are all `done`.
3. **Plan the wave.** Group selected stories so that no two stories in the wave share an
   entry in `touches`. Wave size ≤ `developer.max_parallel`. Show the plan (this wave, and
   what waits) in a few lines.
4. **Spawn developers.** One `developer` agent per story, all in a single message so they
   run in parallel. Prompt for each: the story file path only, plus "implement this story".
   - In a git repository: spawn each with worktree isolation.
   - Not a git repository, or `require_worktree_for_parallel` is true and worktrees are
     unavailable: run the stories one after another instead, and say so.
5. **Collect.** For each returned developer: `blocked` → record the question in the story
   and in `open_questions`, ask the user. `review` → continue.
6. **Integrate** (worktrees only): show the user the branches; merge them into the working
   branch only with the user's go-ahead, one at a time, running the test command after each.
7. **QA review.** Spawn one `qa-tester` (story review mode) per story in `review`, in
   parallel. PASS → `done`. FAIL → send the story with the QA findings back to a `developer`
   once; if it fails again, stop and involve the user.
8. Update `sprint-status.yaml` yourself (the single writer of that file) and report: done,
   failed, blocked, remaining. If `ready` stories remain, offer the next wave; if all stories
   are `done`, recommend `/bmad-release`.

If a developer or QA reports that the plan itself is wrong (not just the code), stop the
wave and recommend `/bmad-change`.
