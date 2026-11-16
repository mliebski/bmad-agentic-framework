---
description: Autopilot — drive the lifecycle to the next gate (or further) with minimal interruptions
argument-hint: [gate | to <G1..G5> | all] [--answers <file>]
---

Drive the project forward without the user typing each command. Target: $ARGUMENTS

**Targets.** `gate` (default) — everything needed to reach the current phase's gate, then
stop for the decision. `to <G>` — continue through gates up to and including `<G>`. `all` —
continue to G5. Autopilot never performs go-live: phase 6 is always `/bmad:golive` with the
human.

**Loop.** Repeat until the target is reached or you must stop:

1. `node bmad/tools/bmad.mjs status` and `validate --gate <current gate>` (phase 4: `wave`).
2. Do the next missing step for the current phase by following the matching command's
   instructions (`.claude/commands/*.md`) exactly as if the user had run it:

   | Phase | Steps, in order |
   |---|---|
   | 1 | discover |
   | 2 | prd → ux (if `gates.ux_required`) → prototype (standard/enterprise, user-facing) → redteam prd |
   | 3 | architect → redteam architecture → stories |
   | 4 | sprint, wave after wave, until every story is `done` or `deferred` |
   | 5 | release |

   Run independent steps in parallel where the command allows it.
3. **Fix what the validator reports** by sending the failure text to the owning agent, then
   validate again. At most three fix rounds per gate; after that, stop and report.
4. **Questions.** Do not interrupt for each question. Collect the agents' open questions,
   record them (`bmad.mjs question "<text>"`), let agents proceed on a clearly labelled
   assumption where one is reasonable, and ask everything in **one batch** when the gate is
   reached. Stop earlier only for a question that blocks all further work or for anything
   irreversible or expensive to undo.
5. **At the gate.** Run the judgement checks from `/bmad:gate`. Then:
   - If the gate is listed in `autopilot.auto_pass` in `bmad/config.yaml`, the validator is
     clean, no judgement item fails and there are no open questions:
     `node bmad/tools/bmad.mjs gate <G> pass --by autopilot --notes "<summary of checks>"`
     and continue if the target allows.
   - Otherwise stop and present: what was produced, the checklist result, the batched
     questions, and the decision needed. Record the user's decision with their name.
   The tool refuses an autopilot pass that the configuration does not allow. Do not retry
   under a different name — ask the human.

**Always stop and ask** when: a gate needs a human decision; a story has bounced more than
`autopilot.max_rework` times; worktree branches are ready to merge; a developer or QA says
the plan is wrong (`/bmad:change`); an agent wants to do something outside the project
folder or touching a real environment.

**Answers file (`--answers <file>`, used by the eval harness and for unattended runs).**
The file holds the idea and prepared answers to likely questions. Use it wherever you would
ask the user; where it has no answer, choose the most conservative assumption, label it in
the artifact and record it as an open question. In this mode, when the environment variable
`BMAD_EVAL` is set, a gate with a clean validator and no failed judgement item is passed
`--by autopilot`; a gate that does not come clean after three fix rounds is recorded as
`fail --by autopilot` and the run stops there. Never merge branches in this mode — run
developers one at a time in the working tree.

**Report** at every stop: phase reached, gates passed and how, artifacts written, stories
done / remaining, what is waiting for the user. State failures as failures.
