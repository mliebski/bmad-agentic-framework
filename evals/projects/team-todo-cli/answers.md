# Prepared answers

- **Project name:** chore. **Track:** standard. Greenfield. **No graphical user interface** —
  it is a command-line tool, so set `gates.ux_required: false`; the UX work is the
  command design, output format and error messages.
- **Users:** six engineers, all comfortable in a terminal, on macOS, Linux and Windows.
- **Problem cost:** chores are forgotten; twice last quarter a certificate expired.
- **Success:** the whole team uses it weekly after one month; no forgotten recurring chore
  in a quarter.
- **Must have:** add, list, complete and remove tasks; due dates; assignee; recurring tasks;
  a `due` command that exits non-zero when something is overdue (for CI); tasks stored in
  one human-readable file that merges cleanly in git.
- **Later, not now:** a web view, notifications to chat, sync with an issue tracker, priorities.
- **Merge conflicts:** two people adding tasks on different branches must not produce a
  conflict in the normal case.
- **Performance:** every command under 200 ms with 5,000 tasks.
- **Distribution:** a single binary or a single-file script, no runtime service, no network access.
- **Constraints:** one engineer, two weeks, part-time.
- **Stack preference:** Go or Python; the team reads both.
- **Anything unanswered:** choose the conservative option and record it as an open question.
- **Experiments:** do not plan or run long-running experiments (for example generating hundreds of
  git repositories). Where a decision depends on one, choose the conservative option
  (for instance a `merge=union` attribute) and record the unverified assumption as an open question.
- **Fallback stack:** if the Go toolchain cannot be used in this environment, switch to a Python
  3 single-file script (standard library only, tests with `unittest` or `pytest`) and record the
  switch as an ADR.
