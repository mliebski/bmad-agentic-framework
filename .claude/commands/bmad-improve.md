---
description: Self-improvement — turn this project's gate failures and rework into proposed changes to the framework
argument-hint: [optional focus, e.g. an agent name]
---

Propose improvements to the framework itself from evidence. Focus: $ARGUMENTS

Nothing in `.claude/agents/`, `.claude/commands/`, `bmad/gates.md` or `bmad/templates/` is
changed by this command. It writes a proposal; the human applies it.

1. Gather evidence:
   - `node bmad/tools/bmad.mjs metrics --json` — gate attempts and failure codes, story
     rework counts, blocked stories.
   - `docs/reviews/*.review.md` — what the adversarial reviewer keeps finding.
   - Story files with rework: the QA Review findings and Dev Record deviations.
   - `docs/06-operate/retro.md` and the change log (`bmad.mjs status --json`).
2. Find **patterns**, not incidents: a failure code or finding type that occurred three or
   more times, or the same root cause across stories. Ignore one-offs. If there is too
   little data for any pattern, say so and stop — do not invent improvements.
3. For each pattern, attribute it to the earliest point where it could have been prevented:
   which agent's instructions, which template section, which gate item, or a missing
   validator check. Example: repeated `story-no-touches` → the product-manager's story
   instructions; developers repeatedly blocked on missing error formats → the story
   template's context section.
4. Write `bmad/improvements/proposal-<date>.md`:
   - per pattern: the evidence (counts, quoted examples), the root cause, and the **exact
     proposed change** as a before/after excerpt of the file to edit
   - the expected effect, stated as a metric that should move
   - what could get worse
5. If `evals/` exists, tell the user how to check the proposal before adopting it: apply the
   change on a branch, run `node evals/run.mjs` and compare against the baseline. A change
   that lowers the eval score is not adopted, however plausible it sounds.
6. Present the proposals ranked by evidence strength. The user decides which to apply.
