# Quality gates

A gate passes only when every item is true **and** the human approves. Items marked ⚙ are
checked by `node bmad/tools/bmad.mjs validate --gate <G>`; the tool refuses to record a pass
while any of them fails. The other items need judgement. An item that does not apply is
marked N/A with a reason. A gate may be `waived` only by the human, with the reason written
down (`bmad.mjs gate <G> waive --by <name> --notes <reason>`).

## G1 — Discovery (owner: business-analyst, approver: human)

- [ ] The problem is stated in one paragraph without mentioning a solution
- [ ] Target users and their top jobs/pains are named and backed by evidence or marked as assumptions
- [ ] Success metrics are measurable and have a baseline or a plan to get one
- [ ] Scope: in, out, and "not now" are listed
- [ ] Constraints (budget, time, legal, technical) and key risks are listed
- [ ] ⚙ Brief and requirements exist; requirements are numbered (FR-n, NFR-n)
- [ ] Open questions are listed with an owner

## G2 — Planning (owner: product-manager, approver: human)

- [ ] Every PRD requirement traces to a brief goal; no orphan requirements
- [ ] ⚙ Every FR has requirement text and acceptance criteria that a tester could execute
- [ ] ⚙ NFRs have numbers (latency, availability, load, retention), not adjectives
- [ ] MVP scope is explicit and smaller than the full vision
- [ ] ⚙ UX spec exists and covers every user-facing FR: flow, states (empty, loading, error), accessibility
- [ ] PRD and UX spec do not contradict each other
- [ ] Analytics/telemetry needed to measure the success metrics are specified
- [ ] ⚙ Adversarial review of the PRD exists with no unresolved critical finding
- [ ] Prototype walkthrough findings (if a prototype was built) are addressed or accepted

## G3 — Implementation readiness (owner: solution-architect + product-manager, approver: human)

- [ ] ⚙ Architecture addresses every FR and NFR (traceability table complete)
- [ ] ⚙ Significant decisions have an ADR with alternatives considered
- [ ] Data model, API contracts and integration points are specified
- [ ] Security, privacy, observability and deployment are designed, not deferred
- [ ] ⚙ The test command is defined in `bmad/config.yaml` (build and lint where they apply)
- [ ] ⚙ Every must-have FR is covered by at least one story; every story traces to a PRD requirement
- [ ] ⚙ Each story has concrete acceptance criteria and a `touches` list, and is self-contained
- [ ] ⚙ Story dependencies exist and form no cycles
- [ ] ⚙ Test strategy exists and names test levels, environments and data
- [ ] ⚙ Adversarial review of the architecture exists with no unresolved critical finding
- [ ] Enterprise track: threat model and performance test plan exist

## G4 — Story done (owner: developer, reviewer: qa-tester) — per story

- [ ] ⚙ Acceptance tests were written and locked by QA before development (or the story has a `tests_exempt_reason`)
- [ ] ⚙ Locked acceptance tests are unchanged
- [ ] Locked acceptance tests pass when QA re-runs them
- [ ] All acceptance criteria are met and each is covered by an automated test
- [ ] ⚙ Tests, lint and build pass — the actual command output is recorded in the story
- [ ] No unrelated changes; nothing outside the story's `touches:` without a note explaining why
- [ ] No secrets, debug leftovers or disabled tests
- [ ] ⚙ All tasks ticked; Dev Record lists files changed and deviations from the plan
- [ ] ⚙ QA review verdict is PASS (or CONCERNS accepted by the human)

## G5 — Release readiness (owner: qa-tester, approver: human)

- [ ] ⚙ All in-scope stories are `done`; `deferred` ones are listed in the release notes
- [ ] ⚙ No locked acceptance test has been modified or deleted
- [ ] Regression, integration and end-to-end suites pass on a production-like environment
- [ ] NFRs verified with measurements (performance, security scan, accessibility)
- [ ] ⚙ Release QA report exists with verdict PASS or CONCERNS; no open critical or high defects
- [ ] User documentation, API docs and release notes are complete and match the build
- [ ] ⚙ Deployment runbook has step-by-step deploy, verify and **rollback** procedures
- [ ] Monitoring, alerting and on-call ownership are in place
- [ ] Launch plan is ready and its claims match what actually ships

## G6 — Go-live (owner: solution-architect, approver: human — explicit "go")

- [ ] ⚙ G5 passed for exactly the build being deployed; the checklist records a GO decision
- [ ] Backups taken and restore verified; rollback rehearsed (enterprise) or walked through
- [ ] Stakeholders and support informed; launch communication scheduled
- [ ] Deployment executed per runbook; each step's result recorded
- [ ] Smoke tests pass in production
- [ ] Monitoring is green for the agreed observation window
- [ ] Hypercare owner and duration agreed; feedback channel open
