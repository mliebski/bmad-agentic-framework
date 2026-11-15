---
id: E{x}-S{y}
title: {short title}
status: draft            # draft | ready | in-progress | review | done | blocked
epic: E{x}
requirements: [FR-n]
depends_on: []           # story ids that must be done first
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

## Context (everything the developer needs — self-contained)
- **Architecture decisions that apply** (copied, with source section):
- **Data shapes / schemas:**
- **API contracts:**
- **UX:** screen, states and copy (copied from the UX spec):
- **Existing code to build on:** file paths and what they do
- **Conventions:** naming, error handling, test location

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
