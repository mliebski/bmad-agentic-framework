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

## Second run (2026-11-15) — Sonnet 5.5, saved as the baseline

Same project and target, fresh run, started with `--model claude-sonnet-5-5` through
`BMAD_EVAL_CLAUDE_ARGS`. The agents set no model of their own, so they inherit it.

| | First run (Fable 5.2) | Second run (Sonnet 5.5) |
|---|---|---|
| Finished | No — stopped at the usage limit three times | Yes — one session |
| Gates | G1, G2 passed; G3 open | G1, G2, G3 passed |
| Score | 0.80 (interim) | 0.97 |
| Time | more than 90 minutes | 30 minutes |
| Usage (USD-equivalent) | about 38 for three sessions, plus the first | about 6.25 |
| Requirements / stories / ADRs | 24 / 10 / 7 | 22 / 18 / 5 |
| PRD length | about 21,600 words | about 7,500 words |
| Open questions recorded | 56 | 3 |

Read the score with care:

- The second run stayed proportionate to a two-week tool, which is most of why it finished.
- Its adversarial reviewer was milder. The first run rated the hosted-merge conflict problem
  critical and kept G3 shut; the second logged "merge behaviour is still unmeasured",
  downgraded it to minor and marked it resolved although the merge experiment never ran.
- So part of the higher score is an easier review, not better work. **The deterministic
  score rewards passing gates and does not measure reviewer depth.** Until the harness has a
  planted-flaw check, use `--judge` and read the review files when comparing models.
- The second run wrote no `research.md`, left one fixed major finding without a re-review,
  and both runs exceed the expected maximum of 16 requirements.
- One run per model is an indication, not a result.

`baseline.json` holds the second run. Compare against it only for runs on the same model
and without `--judge`.

## Third attempt (2026-11-15) — build phase to G5 did not complete

The Sonnet run above was continued from G3 toward G5 (`--to G5`), after installing Go.
It did not get past the first story. 0 of 18 stories were completed; about 1.50 USD-equivalent
of usage was spent over two attempts. The baseline is unchanged and still planning-only.

What happened, in order:

1. **A human-only step.** The first story required a merge experiment (about 900 throw-away
   git repositories). The agents ran it in Windows Git Bash, where one of nine sets took
   about 25 minutes, so the story was correctly marked blocked and the run stopped.
2. **The experiment was run by people.** It took about four minutes on Linux (WSL), needing
   a one-line stand-in for a missing `git init -b` on git 2.25.1. The operator's run:
   additions in different places never conflicted (300 of 300 clean); additions at random
   places conflicted 6 times in 100; additions at the same place always conflicted; with
   `merge=union` same-place additions merged cleanly. Merges performed by a hosting
   service's button were **not** measured, and that was the risk the first run's reviewer
   had rated critical.
3. **QA could not verify the build.** The headless agents were refused `go build`,
   `go vet` and `go test`, although `go` was on the allowed list and installed. QA's verdict
   was CONCERNS, which only a human can accept. The checks were run by hand afterwards and
   passed. The cause of the refusal is not established.

What it showed:

- The gates and verdict rules held: an unverifiable story was not marked done.
- The build phase is **not yet reliable unattended**. It depends on a language toolchain, on
  the headless permission setup, and on a human for slow or sensitive steps.
- Getting the agents past this would mean running them without permission checks, which is
  a decision for the operator, not a default.
- `evals/run.mjs --score-only <dir> --project <name> --to G5` now scores a run folder against
  a later target gate.

## Fourth attempt (2026-11-16): efficiency changes, run to G5

After the efficiency review (agent model tiers, size budgets, story risk, context bundles by
reference, batched QA, resume digest) the same project ran to G5 and **reached it**: all 15 stories
built and QA-verified in Go, release documents written, G5 passed by a human with the CONCERNS
verdict and the untested macOS platform accepted in writing. `baseline.json` now holds this run
(target G5, score 1.0). It replaces the planning-only baseline; compare only against runs with
the same target gate, and rerun with `--to G5`.

| | Planning-only baseline (Nov 15) | This run to G3 | This run to G5 |
|---|---|---|---|
| Requirements / stories | 22 / 18 | 16 / 15 | 16 / 15 |
| PRD length | about 7,500 words | about 4,600 words | same |
| Usage (USD-equivalent) | 6.25 | about 9.9 | about 27.6 in seven sessions |

Read it with care:

- **Planning cost went up, not down**, probably from Opus on the architect and reviewers, two
  review rounds and three story reviewers. Not isolated; one run.
- **Human input was needed**: Linux evidence (WSL, Go 1.27.4, git 2.25.1, dash), the G5 decision
  and the acceptance of CONCERNS. Agents must not accept CONCERNS; the tool now refuses
  `--accept-concerns` without a human name.
- **Defects only Linux could show**: a bash-only `[[` in a POSIX script and tests using
  `git init -b` (needs git 2.28). A perf failure on `/mnt/c` disappeared on a native filesystem.
- **A bundler bug** (headings inside code fences cut sections short) was found by the stories
  reviewer and fixed; oversize refs now fail `validate`.
- The QA agent was denied Bash in the headless run, so some evidence was second-hand. Give QA a
  shell in `ALLOWED` before the next run. The first headless session stopped after G1 for a
  reason not found; the harness does not keep the final message.
