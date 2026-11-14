---
description: Initialise a BMAD project — choose the track and create the docs structure
argument-hint: [project name and one-line idea]
---

Initialise the BMAD workspace. Input from the user: $ARGUMENTS

1. If `docs/bmad-status.yaml` already exists, show its summary and ask whether to keep it.
   Never overwrite it without a yes.
2. Ask the user (one question round) for anything not already given:
   - project name and one-line idea
   - greenfield or brownfield (existing code in this folder?)
   - track: `quick`, `standard` or `enterprise` — recommend one using the table in
     `bmad/lifecycle.md`
3. Update `project_name` and `track` in `bmad/config.yaml`.
4. Create the folders listed under `paths` in `bmad/config.yaml` and write
   `docs/bmad-status.yaml` in the format from `bmad/lifecycle.md` with `current_phase: 1`,
   all gates `pending` (quick track: G1 and G2 `waived`, reason "quick track").
5. If the folder is not a git repository, mention that parallel developers need one and
   offer to run `git init` — do it only if the user agrees.
6. Brownfield: recommend running the `documentation-writer` agent to produce
   `docs/03-solutioning/current-state.md` before discovery.
7. Finish with the next command: `/bmad-discover` (or `/bmad-stories` on the quick track).
