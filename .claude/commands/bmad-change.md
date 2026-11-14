---
description: Course correction — analyse a change and update PRD, architecture and stories together
argument-hint: <what changed or what was discovered>
---

Handle a change in requirements, a technical discovery, or a failed assumption: $ARGUMENTS

1. Restate the change in one sentence and confirm it with the user.
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
5. Add a line to `change_log` in `docs/bmad-status.yaml`. If an approved artifact changed
   materially, set its gate back to `pending` and say which gate to re-run.
