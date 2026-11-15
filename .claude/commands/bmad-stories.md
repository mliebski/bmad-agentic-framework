---
description: Phase 3 — the Product Manager breaks the PRD into epics and self-contained stories
argument-hint: [optional — epic to detail, or a small change on the quick track]
---

Create epics and stories. Input: $ARGUMENTS

**Standard / enterprise track**
1. `docs/02-planning/prd.md` and `docs/03-solutioning/architecture.md` must exist.
2. Delegate to `product-manager`: write `docs/03-solutioning/epics.md`, one story file per
   story in `docs/04-implementation/stories/` (template `bmad/templates/story.md`). Stories
   must embed the architecture and UX context they need; `node bmad/tools/bmad.mjs context <story>`
   prints the requirement and decision texts to copy in.
3. Delegate to `solution-architect` for a quick technical review of the stories: correct
   `touches`, missing technical tasks, dependency order. Apply its corrections through the
   product manager.

**Quick track**
1. Delegate to `solution-architect` to inspect the code and write a short tech-spec for the
   change described in the input, then to `product-manager` to turn it into 1–5 stories with
   that tech-spec embedded.

**Both**
4. Show the user the epic list and story count, and the proposed build order.
5. Run `node bmad/tools/bmad.mjs validate --gate G3` and `node bmad/tools/bmad.mjs trace`; have the product manager fix
   what they report (uncovered requirements, stories without criteria or `touches`, cycles).
   Next: `/bmad-gate G3`.
