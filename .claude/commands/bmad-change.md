---
description: Course correction — analyse a change and update PRD, architecture and stories together
argument-hint: <what changed or what was discovered>
---

Handle a change in requirements, a technical discovery, or a failed assumption: $ARGUMENTS

1. Restate the change in one sentence and confirm it with the user. Run
   `node bmad/tools/bmad.mjs impact <id>` for each requirement, decision or story the change names, so the
   analysis starts from the computed list of affected stories, decisions and tests.
2. Impact analysis, in parallel:
   - `product-manager` → which goals, FRs, epics and stories are affected; scope options
   - `solution-architect` → technical impact, affected ADRs, effort and risk
   - `ux-specialist` → only if user-facing behaviour changes
   Ask each for analysis only — no file edits yet.
3. Present options to the user (typically: adjust within scope, re-scope the MVP, roll back
   an approach, or reject the change) with consequences for timeline and done work.
4. After the user decides, have each owner update its artifact: PRD → UX spec →
   architecture/ADRs → epics and stories (new, changed, or cancelled; `done` stories are
   never edited — add a follow-up story instead).
5. Log it with `node bmad/tools/bmad.mjs change "<one line>"`. If an approved artifact changed materially,
   re-run its gate (`/bmad-gate`) and its adversarial review. If acceptance criteria of a
   story changed, QA amends and re-locks that story's acceptance tests.
