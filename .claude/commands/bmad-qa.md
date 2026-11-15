---
description: QA — write acceptance tests for a story, review a story (gate G4), or run release QA
argument-hint: <story id | tests <story id> | release>
---

Run QA for: $ARGUMENTS

- **`tests <story id>`**: delegate to `qa-tester` in acceptance-tests-first mode with the
  story file path. Confirm with `node bmad/tools/bmad.mjs stories` that the story now shows
  locked tests.
- **A story id** (e.g. `E1-S2`): delegate to `qa-tester` in story review mode with the story
  file path. QA records the verdict in the story and moves it to `done` or back to
  `in-progress` through the tool. Show the findings. On CONCERNS, ask the user; if accepted,
  `node bmad/tools/bmad.mjs story <id> done --accept-concerns`.
- **`release`**: delegate to `qa-tester` in release QA mode →
  `docs/05-release/qa-report.md`. Show verdict, failing checks and open defects.
- **Empty**: review every story currently in `review`, in parallel.

Report results exactly as the QA agent observed them, including failures.
