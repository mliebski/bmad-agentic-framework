---
description: Show where the project is in the BMAD lifecycle and what to do next
---

Read `docs/bmad-status.yaml`, `bmad/lifecycle.md` and, if it exists,
`docs/04-implementation/sprint-status.yaml`.

If the status file is missing, say the project is not initialised and recommend `/bmad-init`.

Otherwise report, briefly:
1. Project, track, current phase.
2. Artifacts of the current phase: which exist, which are missing or still `draft`.
3. Gate status for the current phase and any `failed` gate with its reasons.
4. Story counts by status (phase 4 onward).
5. Open questions waiting for the user.
6. **The single recommended next command**, plus at most two alternatives.

Do not delegate to any agent and do not change any file. $ARGUMENTS
