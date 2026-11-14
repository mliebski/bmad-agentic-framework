# Quality gates

A gate passes only when every item is true **and** the human approves. Record the result in
`docs/bmad-status.yaml`. An item that does not apply is marked N/A with a reason. A gate may
be `waived` only by the human, with the reason written down.

## G1 — Discovery (owner: business-analyst, approver: human)

- [ ] The problem is stated in one paragraph without mentioning a solution
- [ ] Target users and their top jobs/pains are named and backed by evidence or marked as assumptions
- [ ] Success metrics are measurable and have a baseline or a plan to get one
- [ ] Scope: in, out, and "not now" are listed
- [ ] Constraints (budget, time, legal, technical) and key risks are listed
- [ ] Functional and non-functional requirements are numbered (FR-n, NFR-n)
- [ ] Open questions are listed with an owner

## G2 — Planning (owner: product-manager, approver: human)

- [ ] Every PRD requirement traces to a brief goal; no orphan requirements
- [ ] Every FR has acceptance criteria that a tester could execute
- [ ] NFRs have numbers (latency, availability, load, retention), not adjectives
- [ ] MVP scope is explicit and smaller than the full vision
- [ ] UX spec covers every user-facing FR: flow, states (empty, loading, error), accessibility
- [ ] PRD and UX spec do not contradict each other
- [ ] Analytics/telemetry needed to measure the success metrics are specified

## G3 — Implementation readiness (owner: solution-architect + product-manager, approver: human)

- [ ] Architecture addresses every FR and NFR (traceability table complete)
- [ ] Significant decisions have an ADR with alternatives considered
- [ ] Data model, API contracts and integration points are specified
- [ ] Security, privacy, observability and deployment are designed, not deferred
- [ ] Build, test and lint commands are defined in `bmad/config.yaml`
- [ ] Every FR is covered by at least one story; every story traces to an FR
- [ ] Each story is self-contained: context, acceptance criteria, tasks, files touched, test notes
- [ ] Story dependencies form no cycles; `touches:` is filled in for parallel planning
- [ ] Test strategy exists and names test levels, environments and data
- [ ] Enterprise track: threat model and performance test plan exist

## G4 — Story done (owner: developer, reviewer: qa-tester) — per story

- [ ] All acceptance criteria are met and each is covered by an automated test
- [ ] Tests, lint and build pass — the actual command output is recorded in the story
- [ ] No unrelated changes; nothing outside the story's `touches:` without a note explaining why
- [ ] No secrets, debug leftovers or disabled tests
- [ ] Story file updated: Dev Record, file list, deviations from the plan
- [ ] QA review verdict is PASS (or CONCERNS accepted by the human)

## G5 — Release readiness (owner: qa-tester, approver: human)

- [ ] All in-scope stories are `done`; deferred ones are listed in the release notes
- [ ] Regression, integration and end-to-end suites pass on a production-like environment
- [ ] NFRs verified with measurements (performance, security scan, accessibility)
- [ ] No open critical or high defects; remaining defects are listed and accepted
- [ ] User documentation, API docs and release notes are complete and match the build
- [ ] Deployment runbook has step-by-step deploy, verify and **rollback** procedures
- [ ] Monitoring, alerting and on-call ownership are in place
- [ ] Launch plan is ready and its claims match what actually ships

## G6 — Go-live (owner: solution-architect, approver: human — explicit "go")

- [ ] G5 passed for exactly the build being deployed
- [ ] Backups taken and restore verified; rollback rehearsed (enterprise) or walked through
- [ ] Stakeholders and support informed; launch communication scheduled
- [ ] Deployment executed per runbook; each step's result recorded
- [ ] Smoke tests pass in production
- [ ] Monitoring is green for the agreed observation window
- [ ] Hypercare owner and duration agreed; feedback channel open
