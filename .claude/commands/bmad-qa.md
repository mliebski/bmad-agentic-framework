---
description: QA — review one story (gate G4) or run full release QA
argument-hint: <story id | release>
---

Run QA for: $ARGUMENTS

- **A story id** (e.g. `E1-S2`): delegate to `qa-tester` in story review mode with the story
  file path. Record the verdict in `docs/04-implementation/sprint-status.yaml`
  (PASS → `done`, FAIL → `in-progress`) and show the findings.
- **`release`**: delegate to `qa-tester` in release QA mode →
  `docs/05-release/qa-report.md`. Show verdict, failing checks and open defects.
- **Empty**: review every story currently in `review`, in parallel.

Report results exactly as the QA agent observed them, including failures.
