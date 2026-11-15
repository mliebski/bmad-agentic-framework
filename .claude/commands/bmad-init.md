---
description: Initialise a BMAD project — choose the track and create the docs structure
argument-hint: [project name and one-line idea]
---

Initialise the BMAD workspace. Input from the user: $ARGUMENTS

1. If this project has no `bmad/` folder (the framework was installed as a plugin), copy the
   framework assets in first with the installer command named in the session-start context
   (`node "<plugin root>/bmad/tools/install.mjs" . --assets-only`).
2. Run `node bmad/tools/bmad.mjs status`. If the project is already initialised, show the
   summary and ask whether to keep it. Never re-initialise without a yes.
3. Ask the user (one question round) for anything not already given:
   - project name and one-line idea
   - greenfield or brownfield (existing code in this folder?)
   - track: `quick`, `standard` or `enterprise` — recommend one using the table in
     `bmad/lifecycle.md`
   - does the product have a user interface? If not, set `gates.ux_required: false` in
     `bmad/config.yaml`.
4. Run `node bmad/tools/bmad.mjs init --name "<name>" --track <track>`. It creates the
   folders and the status file (quick track: G1 and G2 are waived, phase starts at 3).
5. If the folder is not a git repository, mention that parallel developers need one with at
   least one commit and offer to run `git init` — do it only if the user agrees.
6. Enterprise track: offer `node bmad/tools/bmad.mjs pack add security` and
   `pack add compliance`.
7. Brownfield: recommend running the `documentation-writer` agent to produce
   `docs/03-solutioning/current-state.md` before discovery.
8. Finish with the next command: `/bmad-discover` (or `/bmad-stories` on the quick track),
   or `/bmad-auto` to let the framework drive to the first gate.
