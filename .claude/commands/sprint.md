---
description: Phase 4 — acceptance tests first, then parallel developers, then QA review per story
argument-hint: [story ids, an epic id, or empty for all ready stories]
---

Run an implementation wave. Scope: $ARGUMENTS

1. Run `node bmad/tools/bmad.mjs wave --json`. It returns `wave` (stories that can start now
   without touching the same files), `needs_tests` (ready, but QA has not locked acceptance
   tests yet) and `waiting` (with the reason). Restrict to the scope given, if any.
   If G3 has not passed the developers will be refused — recommend `/bmad:gate G3`.
2. **Tests first.** Group the stories in `needs_tests` by epic and spawn one `qa-tester` per
   group (acceptance-tests-first mode, the story file paths) — all in one message, in
   parallel. One agent per epic loads the conventions once instead of once per story.
   When they return, run `wave --json` again. A story QA could not write tests for goes
   back to the product manager with QA's reason.
3. Show the plan in a few lines: this wave, and what waits and why.
4. **Spawn developers.** One `developer` agent per story in `wave`, all in a single message
   so they run in parallel. Prompt for each: the story id and file path, plus "implement
   this story". Starting a story writes its context bundle; the developer reads it.
   - In a git repository with at least one commit: spawn each with worktree isolation.
   - Otherwise run the stories one after another, and say so.
5. **Collect.** For each returned developer: `blocked` → show the user the question, record
   it with `node bmad/tools/bmad.mjs question "<story>: <question>"`; if it is a wrong
   acceptance test, send it to `qa-tester` (amend mode); if it is a missing file in
   `touches` or missing context, send the story to `product-manager` to correct.
   `review` → continue.
6. **Integrate** (worktrees only): show the user the branches; merge them into the working
   branch only with the user's go-ahead, one at a time, running the test command after each.
7. **Review, by risk.**
   - `risk: low`: run `node bmad/tools/bmad.mjs story <id> verify`. The tool re-runs the
     locks, scoped tests, lint and build and records a mechanical PASS. No agent. If it
     refuses, treat the story as `normal`.
   - `risk: normal`: spawn one `qa-tester` (story review mode) per epic in this wave with all
     its `review` stories, not one per story.
   - `risk: high`: as normal, plus `/bmad:redteam code <id>` before QA moves it to `done`.
   Run the full test suite once after the wave, not once per story. QA moves a story to
   `done` or back to `in-progress` itself. On FAIL send the
   story with the QA findings back to a `developer`; after `autopilot.max_rework` bounces
   (`bmad/config.yaml`) stop and involve the user. CONCERNS → ask the user; if accepted,
   `node bmad/tools/bmad.mjs story <id> done --accept-concerns --by "<user name>"`.
8. Run `node bmad/tools/bmad.mjs stories` and report: done, failed, blocked, remaining. If
   `wave` still returns stories, offer the next wave; if every story is `done` or
   `deferred`, recommend `/bmad:release`.

If a developer or QA reports that the plan itself is wrong (not just the code), stop the
wave and recommend `/bmad:change`.
