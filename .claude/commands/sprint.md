---
description: Phase 4 — acceptance tests first, then parallel developers, then QA review per story
argument-hint: [story ids, an epic id, or empty for all ready stories]
---

Run an implementation wave. Scope: $ARGUMENTS

1. Run `node bmad/tools/bmad.mjs wave --json`. It returns `wave` (stories that can start now
   without touching the same files), `needs_tests` (ready, but QA has not locked acceptance
   tests yet) and `waiting` (with the reason). Restrict to the scope given, if any.
   If G3 has not passed the developers will be refused — recommend `/bmad:gate G3`.
2. **Tests first.** For every story in `needs_tests`, spawn a `qa-tester` in
   acceptance-tests-first mode with the story file path — all in one message, in parallel.
   When they return, run `wave --json` again. A story QA could not write tests for goes
   back to the product manager with QA's reason.
3. Show the plan in a few lines: this wave, and what waits and why.
4. **Spawn developers.** One `developer` agent per story in `wave`, all in a single message
   so they run in parallel. Prompt for each: the story id and file path, plus "implement
   this story".
   - In a git repository with at least one commit: spawn each with worktree isolation.
   - Otherwise run the stories one after another, and say so.
5. **Collect.** For each returned developer: `blocked` → show the user the question, record
   it with `node bmad/tools/bmad.mjs question "<story>: <question>"`; if it is a wrong
   acceptance test, send it to `qa-tester` (amend mode); if it is a missing file in
   `touches` or missing context, send the story to `product-manager` to correct.
   `review` → continue.
6. **Integrate** (worktrees only): show the user the branches; merge them into the working
   branch only with the user's go-ahead, one at a time, running the test command after each.
7. **QA review.** Spawn one `qa-tester` (story review mode) per story in `review`, in
   parallel. QA moves the story to `done` or back to `in-progress` itself. On FAIL send the
   story with the QA findings back to a `developer`; after `autopilot.max_rework` bounces
   (`bmad/config.yaml`) stop and involve the user. CONCERNS → ask the user; if accepted,
   `node bmad/tools/bmad.mjs story <id> done --accept-concerns`.
8. Run `node bmad/tools/bmad.mjs stories` and report: done, failed, blocked, remaining. If
   `wave` still returns stories, offer the next wave; if every story is `done` or
   `deferred`, recommend `/bmad:release`.

If a developer or QA reports that the plan itself is wrong (not just the code), stop the
wave and recommend `/bmad:change`.
