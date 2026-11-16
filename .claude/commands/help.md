---
description: Show where the project is in the BMAD lifecycle and what to do next
---

Run `node bmad/tools/bmad.mjs status`. If it reports no status file, say the project is not
initialised and recommend `/bmad:init`.

Otherwise also run `node bmad/tools/bmad.mjs validate --gate <gate of the current phase>`
(phase 4: `node bmad/tools/bmad.mjs wave` instead) and report, briefly:

1. Project, track, current phase.
2. What the validator says is still missing for the current gate.
3. Any `failed` gate with its reasons.
4. Phase 4 onward: story counts by status, and what the next wave would be.
5. Open questions waiting for the user.
6. **The single recommended next command** (see `bmad/lifecycle.md`), plus at most two
   alternatives. Mention `/bmad:auto` when several agent steps remain before the gate.

Do not delegate to any agent and do not change any file. $ARGUMENTS
