---
id: E{x}-S{y}
title: {short title}
status: draft            # draft | ready | in-progress | review | done | blocked
epic: E{x}
requirements: [FR-n]
depends_on: []           # story ids that must be done first
risk: normal             # low | normal | high — low: verified by the tool, no QA agent; high: also a code red-team review
refs: []                 # sources the tool assembles into the developer's context bundle: FR-n, NFR-n, ADR-nnn, arch:<heading or §n>, ux:<heading>, prd:<heading>
touches: []              # files or directories this story changes, including its unit tests — enforced
acceptance_tests: []     # filled by qa-tester before development: files or folders, then locked
tests_exempt_reason: ""  # only for stories that cannot have acceptance tests yet (e.g. project scaffolding)
---

# E{x}-S{y}: {title}

## Story
As a {user}, I want {capability}, so that {outcome}.

## Acceptance criteria
1. Given … when … then …
2.

## Context (only what is specific to this story)
Requirements, ADRs and architecture/UX sections are NOT copied here: list them in `refs` and the
tool assembles them (`bmad.mjs bundle <id>`, done automatically when the story starts). Write
here only what no source document says:
- **Existing code to build on:** file paths and what they do
- **Story-specific decisions or data shapes** not in the architecture:
- **Conventions that differ** from the architecture's code conventions:

## Tasks
- [ ] 1. … (AC 1)
- [ ] 2. …
- [ ] 3. Tests: unit … / integration …

## Test notes
Edge cases and error paths that must be covered; test data.

## Out of scope
What this story deliberately does not do.

---

## Dev Record (filled by developer)
- **Files changed:**
- **Commands run and results:** test / lint / build — paste the actual summary lines
- **Deviations from plan and why:**
- **Notes for QA:**
- **Branch / commit:**

## QA Review (filled by qa-tester)
- **Verdict:** PASS | CONCERNS | FAIL
- **AC → test mapping:**
- **Commands re-run and results:**
- **Findings:** severity · evidence · reproduction
