---
description: Show where the project is in the BMAD lifecycle and what to do next
---

Run `node bmad/tools/bmad.mjs resume`: it is one compact digest. If it says the project is not
initialised, recommend `/bmad:init`.

Otherwise report, briefly, what the digest says:

1. Project, track, current phase, gates.
2. What blocks the current gate (the digest lists the first six; run
   `validate --gate <G>` only if the user wants all of them).
3. Any `failed` gate with its reasons (`status` has them).
4. Phase 4 onward: story counts and the next wave.
5. Open questions waiting for the user.
6. **The single recommended next command**, plus at most two alternatives. Mention `/bmad:auto`
   when several agent steps remain before the gate.

Do not delegate to any agent and do not change any file. $ARGUMENTS
