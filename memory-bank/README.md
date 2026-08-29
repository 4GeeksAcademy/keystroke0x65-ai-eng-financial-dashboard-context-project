# Memory Bank — Financial Dashboard

> This README is written for **AI agents** (and human contributors) working on this project. Read it before touching anything in `memory-bank/`.

The **memory bank** is the project's persistent, human-readable memory. It records what the project is, how it is structured, the state of the work in progress, and how changes are verified. It is the single source of truth for project context so that any agent — new or returning — can pick up where the last one left off without re-deriving everything from code.

`AGENTS.md` at the repository root directs agents to check `memory-bank/` before taking any action (analyzing code, modifying files, or generating outputs). Treat the memory bank as **authoritative context**: if code and memory disagree, investigate before acting.

---

## What the memory bank is

A small set of Markdown documents that answer these questions:

| Question | File |
|----------|------|
| What does this project do and how do the pieces connect? | `project-summary.md` |
| What files and services exist, and where are they? | `project-structure.md` |
| What currently works, what's broken, and what's next? | `project-status.md` |
| How were past decisions verified (prompts, results, issues)? | `./verification.md` (repo root) |
| How do I use the memory bank itself? | `README.md` (this file) |

> Note: `verification.md` currently lives at the repository root. If you create or move files, update this table so the map stays accurate.

The memory bank is **complementary** to two other agent-facing locations:

- `.agents/rules/` — normative, durable conventions (naming, testing, Docker, API, frontend, project rules).
- `.agents/skills/` — reusable procedures for agents.

Rules say *how the project should behave*; the memory bank says *what the project is and where it is right now*.

---

## File layout

Current files in `memory-bank/`:

```text
memory-bank/
├── README.md              # ← You are here: how to use the memory bank
├── project-summary.md     # Project overview: what it does, how to run it, how parts connect
├── project-structure.md   # Directory tree, services, endpoints, components
├── project-status.md      # What works, known gaps, next priorities, incorrect decisions
```

---

## How to read

1. **Start here.** Read `README.md` first to understand the conventions in this section.
2. **Read `project-summary.md`** for the 30-second overview.
3. **Read `project-structure.md`** when you need to navigate the codebase or find an endpoint/service/component.
4. **Read `project-status.md`** *last*, as the freshest snapshot — it tells you what's broken, what's pending, and what to do next. Always read it before starting new work.
5. If you need to validate a past decision or see how documentation was produced, consult `verification.md` (or `git log` for the authoritative change history).

### Reading rules

- **Assume staleness.** Memory can lag behind code. When a file contradicts the repository, verify against the actual code, `git log`, or tests before relying on it — then update the memory bank (see below).
- **Read dates and branch info.** `project-status.md` starts with a date and branch/commit. Note it, and update it whenever you change the file.
- **Prefer the memory bank over re-discovery.** Before exploring the whole repo, use these files to build a mental model, then confirm with targeted reads.

---

## How to write

### When to write

Create or add to memory files when you complete work that changes the project's context:

- New features, endpoints, components, or services.
- Structure changes (new folders, moved files, new config).
- Decisions, especially ones that override a rule or earlier choice.
- Test coverage changes (added/removed/renamed suites).
- Anything that would help a future agent avoid re-investigating.

### Where to write

| You changed... | Update... |
|----------------|-----------|
| What the project does, how it runs, or how services connect | `project-summary.md` |
| File/service/endpoint layout | `project-structure.md` |
| What works, gaps, priorities, or wrong turns | `project-status.md` |
| The verification trail of a prompt → result → issue | `verification.md` |
| The memory bank's own conventions | `README.md` |

If the change spans areas, update all affected files — the files are cheap to update and expensive to be wrong about.

### Writing rules

- **Be accurate, be honest.** Never invent facts. State only what you can verify from code, tests, `git log`, or the user. If you don't know, say "unknown" rather than guessing.
- **Flag uncertain entries.** Use `>` blockquotes or a "needs verification" marker for anything you couldn't confirm.
- **Keep files scoped.** Each file answers its own question. Do not append unrelated content (e.g., don't add "Data Flows" to `project-summary.md` when that belongs elsewhere or nowhere — see `verification.md` for the history of this exact mistake).
- **Prefer concise, structured Markdown.** Use tables, short bullet lists, and code fences. Long prose is harder to keep correct.
- **Cross-link related files** with relative links (e.g., `[project-status.md](./project-status.md)`) instead of duplicating content.

---

## How to update

1. **Read the existing content first** — never overwrite blindly.
2. **Update in place.** Edit the relevant section rather than appending duplicate entries.
3. **Keep the changelog.** `project-status.md` has a `Commit History Summary` and `project-summary.md` has a `Recent Changes` table — add a row/commit entry for your change using the real commit hash (`git log --oneline -1` or the PR/commit you made).
4. **Mark resolved items.** When a "Known Gap" or "Next Priority" is fixed, move/update it (e.g., strike-through or annotate like the existing `~~🔴 ...~~ ✅ Done` pattern in `project-status.md`) instead of leaving stale rows.
5. **Record wrong turns.** If you took an incorrect step, add it to the `Incorrect Steps & Decisions Taken` table with why it was wrong and whether it was fixed. This is one of the memory bank's most valuable features.
6. **Refresh the header.** Update the date, branch, and commit reference when you change `project-status.md`.
7. **Validate links.** If you added relative links, make sure the targets still exist (this is how `project-structure.md` maintains its hyperlinks to endpoints/services).

### Update example

Instead of:

```diff
+  | Added retry to frontend |
```

Prefer updating the actual source of truth (`project-status.md`): mark the previously-listed gap as done, move it out of "Next Priorities", and add the row/commit to the history table.

---

## How to delete

- **Only delete when something is permanently obsolete** (a file, a service, a section) and no other document references it.
- **Check references first.** Before removing a file or section, `grep` the memory bank and repo for links to it. Update or remove dangling links.
- **Prefer annotating over deleting.** Historical context matters: it's usually better to strike through or move an entry (e.g., a fixed gap, a completed priority, a resolved wrong turn) than to silently remove it. Deletion erases the trail.
- **Keep the layout documented.** If you remove a file, update this `README.md`'s tables so the file map stays accurate.
- If you delete content that records a decision, move a one-line note about it into `verification.md` so the reasoning survives.

---

## Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| Read `project-status.md` before starting work | Skip the memory bank and explore the whole repo cold |
| Verify claims against code/`git log`/tests | Invent facts or pad the docs |
| Update the right file for the right kind of change | Dump everything into one file |
| Use real commit hashes and dates | Reference imaginary commits or versions |
| Annotate resolved items (strike-through / ✅) | Leave tick-boxes and gaps permanently stale |
| Record wrong turns honestly | Hide mistakes from future agents |
| Keep cross-links valid | Leave broken relative links |
| Keep files scoped and concise | Add out-of-scope sections ("Data Flows", "JSON Samples", etc.) |

---

## Quick reference workflow

```text
Start of a task
   │
   ├─ 1. Read memory-bank/README.md        (conventions)
   ├─ 2. Read project-summary.md           (overview)
   ├─ 3. Read project-structure.md         (navigation)
   └─ 4. Read project-status.md            (state, gaps, next steps)
                    │
                    ▼
          Do the work (verify against code)
                    │
                    ▼
          Update the relevant memory file(s)
                    │
                    ▼
          Refresh date/branch, add commit hash,
          annotate resolved items, commit
```

---

*Maintain this README whenever the memory bank's conventions or layout change.*