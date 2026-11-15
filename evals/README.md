# Evals

Measures the framework instead of trusting it. Each reference project is an idea plus
prepared answers; the harness runs the framework on it unattended and scores what comes out.
Change a prompt, a template or a gate → run the evals → keep the change only if the score
does not drop.

## Run

```bash
node evals/run.mjs                    # all projects, to gate G3
node evals/run.mjs url-shortener      # one project
node evals/run.mjs --judge            # add the LLM-judged quality score
node evals/run.mjs --to G5            # include implementation and release (much longer, much dearer)
node evals/run.mjs --save-baseline    # record this run as the baseline to compare against
```

A run starts real Claude Code sessions (`claude -p`) with `BMAD_EVAL=1`, which lets
`/bmad-auto` pass gates itself when the validator is clean. It costs real tokens — expect a
planning-only run (to G3) of one project to take tens of minutes. Each run works in a fresh
copy under `evals/runs/<timestamp>/<project>/`, which you can open afterwards to read what
was produced. Results go to `evals/results/<timestamp>.json`; the exit code is 1 when any
project falls more than 0.05 below the baseline.

Permissions for the headless session are set in `run.mjs` (`ALLOWED`); override the whole
flag string with the `BMAD_EVAL_CLAUDE_ARGS` environment variable if your setup differs.

## Score

| Part | Weight (with judge) | What it measures | How |
|---|---|---|---|
| structure | 50 % (35 %) | Did each gate up to the target pass, and does the validator agree? | `bmad.mjs validate` per gate — deterministic |
| coverage | 35 % (25 %) | Did the documents address what this product must address? | keyword groups in `expectations.json` — deterministic |
| discipline | 15 % (10 %) | No scope creep into the MVP; sensible number of requirements and stories | `expectations.json` — deterministic |
| judge | — (30 %) | Quality a checklist cannot see | `rubric.md`, graded by a separate model session |

The deterministic parts are crude on purpose: they cannot be talked round. The judge score
varies between runs; compare it across several runs, not one.

## Reference projects

| Project | Track | Why it is in the set |
|---|---|---|
| `url-shortener` | standard | Small, well-understood product; tests MVP discipline and measurable NFRs |
| `clinic-booking` | enterprise | Personal health data, availability and audit needs; tests whether security and compliance are designed, not deferred |
| `team-todo-cli` | standard, no UI | Command-line tool; tests that the framework adapts when there are no screens |

Add a project: a folder under `projects/` with `idea.md`, `answers.md` and
`expectations.json` (`name`, `track`, `target`, `must_cover`, `must_not_be_in_mvp`,
`min_frs`, `max_frs`, `min_stories`, `max_stories`). The framework under test never sees
`expectations.json`.

## Limits

- Three small projects are a smoke test, not a benchmark. Add projects that look like your
  real work.
- Keyword coverage can be satisfied by mentioning a topic without handling it well. That is
  what the judge and reading the run folder are for.
- Runs are not deterministic. A difference smaller than the run-to-run spread means nothing.

## First run (2026-11-15)

`team-todo-cli`, target G3, no judge. The run did **not** reach G3: it was stopped by the
account usage limit three times and resumed by hand in the same run folder.

| Item | Result |
|---|---|
| G1, G2 | passed by autopilot with a clean validator |
| G3 | pending — one unresolved critical finding in the architecture review, must-have requirements not yet covered by a story |
| Produced | brief, requirements, PRD, architecture, 7 ADRs, test strategy, 10 stories |
| Interim score | 0.80 (structure 0.67, coverage 1.0, discipline 0.8) |
| Usage | about 38 USD-equivalent over the three resumed sessions, more than 90 minutes |

What it showed, and what to fix next:

- Enforcement held with real agents: gates passed only through the validator, and the
  autopilot did not wave G3 through while a critical finding was open.
- The adversarial reviewer found a real design flaw (merge conflicts on hosted merges) that
  needs a human answer the prepared answers do not contain.
- **Cost:** far too high for a two-week command-line tool. Planning depth needs to scale
  with the size of the product.
- **Over-production:** 56 open questions and 24 requirements, against an expected maximum
  of 16.
- **A headless session can return while its agents are still working**, leaving the run
  short of its target.
- **The harness cannot resume** a stopped run; `--score-only` scores a folder that was
  continued by hand.
