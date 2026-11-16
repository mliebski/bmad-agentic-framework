# BMAD Agentic Product Framework

Ten specialist AI agents — business analyst, product manager, UX specialist, solution
architect, developer (spawnable in parallel), QA tester, documentation writer, marketing
specialist, adversarial reviewer and synthetic user — that run the full product lifecycle
from requirements to production go-live inside Claude Code (CLI, desktop app, or the VS
Code extension).

- **Enforced gates** — a tool and hooks, not just prompts, decide whether a phase can close
- **Tests before code** — QA locks failing acceptance tests; developers make them pass
- **Adversarial review** — every PRD and architecture is attacked before approval
- **Autopilot** — `/bmad-auto` drives a phase to its gate and stops for your decision
- **Measured** — an eval harness scores the framework on reference projects

## Install

Into an existing project (needs Node.js 18+):

```bash
node bmad/tools/install.mjs /path/to/your/project
```

Or as a Claude Code plugin:

```bash
claude plugin marketplace add mliebski/bmad-agentic-framework
```

```bash
claude plugin install bmad@bmad-agentic-framework
```

Plugin commands are namespaced: `/bmad:init`, `/bmad:auto`, `/bmad:gate`. A copied install
(above) uses `/bmad-init` and so on, which is what the rest of this README shows.

## Start

```
/bmad-init My Product — one-line idea
/bmad-auto
```

Full guide: [bmad/GUIDE.md](bmad/GUIDE.md) · Evals: [evals/README.md](evals/README.md)

> When the documentation-writer agent later writes your product's own README, it replaces
> this file; the framework guide stays in `bmad/GUIDE.md`.

## Licence

MIT — see [LICENSE](LICENSE).
