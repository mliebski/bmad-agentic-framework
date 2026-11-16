---
description: Adversarial review — an independent agent tries to break an artifact, the owner fixes, repeat
argument-hint: <prd | ux | architecture | stories | code <story id>>
---

Red-team: $ARGUMENTS

1. Map the target to its artifact, lens and owner:

   | Target | Artifact | Owner who fixes |
   |---|---|---|
   | `prd` | `docs/02-planning/prd.md` | `product-manager` |
   | `ux` | `docs/02-planning/ux-spec.md` | `ux-specialist` |
   | `architecture` | `docs/03-solutioning/architecture.md` and `adr/` | `solution-architect` |
   | `stories` | `docs/04-implementation/stories/` | `product-manager` |
   | `code <id>` | the files changed by that story | `developer` |

2. Spawn `adversarial-reviewer` with the lens and the artifact path. Give it nothing else —
   no summary of intent, no reassurance. It writes `docs/reviews/<name>.review.md`.
3. Show the user the findings by severity. For each **critical** finding the user may
   decide to accept the risk instead of fixing it; note who accepted.
4. Send the review file to the owner agent: fix every open critical and major finding in the
   artifact, or state in the report why a finding is wrong.
5. Spawn `adversarial-reviewer` again in re-review mode (same lens, same review file; pass
   on any risks the user accepted). It updates each finding and `unresolved_critical`.
6. At most three rounds. If criticals remain after that, stop and put the disagreement to
   the user — do not let the owner and the reviewer loop.
7. Report: findings found and resolved per severity, what remains open. `prd` and
   `architecture` reviews are required by gates G2 and G3 (`reviews.required` in
   `bmad/config.yaml`).
