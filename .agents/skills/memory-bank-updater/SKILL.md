---
name: memory-bank-updater
description: Automatically update the project memory bank (project-status.md, project-structure.md, project-summary.md) when the user commits changes to GitHub or explicitly asks for a memory bank update. Keeps agents' context fresh without manual effort.
---

# Memory Bank Updater

Keeps the project's memory bank in sync with reality by analyzing git changes and updating the relevant documentation files. This skill is designed for the Financial Dashboard project but works with any project that follows the memory bank pattern (`memory-bank/project-status.md`, `memory-bank/project-structure.md`, `memory-bank/project-summary.md`).

## When to Activate

Activate this skill when:

- **User makes a commit** (`git commit`, `git push`, or commits via VS Code UI) — update the memory bank as a follow-up.
- **User runs git operations** (`git add`, `git commit`, `git push`, `git merge`) — check if memory bank needs updating afterward.
- **User explicitly asks**: "update the memory bank", "sync the memory bank", "refresh project status", "update project status", "update project structure", "update project summary", "what's the current status", "document recent changes".
- **User asks about project progress**: "what's done", "what's left to do", "what changed recently" — first update the memory bank, then answer from it.
- **When opening the workspace**: Check if HEAD has moved since last recorded commit in `project-status.md` and offer to sync.

Do NOT activate for:

- Simple file reads that don't change the project state.
- Running tests or linters without related code changes.
- Read-only exploration of the codebase.

## Core Principle

Only update files that have materially changed. Do not rewrite the entire memory bank on every commit. Each update should be:

- **Accurate** — reflect the true current state of the codebase.
- **Minimal** — change only the lines/sections that need updating.
- **Conservative** — when in doubt, preserve existing content and add to it rather than replacing.

---

## Workflow

### Step 1: Determine What Triggered the Skill

Run `git log --oneline -5` to see recent commits and `git status --short` to see the current working tree state.

If the user just committed, the working tree should be clean. If the user explicitly asked for an update, there may be uncommitted changes — include those in the analysis.

### Step 2: Analyze What Changed

Use these commands to understand the scope of changes:

```bash
# For a fresh commit: show what changed in the latest commit
git show --stat HEAD

# For uncommitted changes (when user explicitly asks)
git diff --stat HEAD

# For full diff of latest commit
git show HEAD --stat --name-status

# List new files in the latest commit
git diff --diff-filter=A --name-only HEAD~1 HEAD

# List modified files
git diff --diff-filter=M --name-only HEAD~1 HEAD

# List deleted files
git diff --diff-filter=D --name-only HEAD~1 HEAD
```

Read the current memory bank files to understand their baseline state:

```bash
cat memory-bank/project-status.md
cat memory-bank/project-structure.md
cat memory-bank/project-summary.md
```

### Step 3: Categorize the Changes

Group the changed files into categories:

| Category | Example Files | Which Memory File to Update |
|----------|--------------|----------------------------|
| **Backend code** | `backend/app/routes.py`, `backend/app/main.py`, `backend/tests/` | `project-status.md` (What Works, Testing), possibly `project-summary.md` |
| **Frontend code** | `frontend/src/App.tsx`, `frontend/src/components/`, `frontend/src/lib/` | `project-status.md` (What Works, Testing), possibly `project-structure.md` |
| **Tests added/changed** | `*.test.tsx`, `*.test.ts`, `test_*.py` | `project-status.md` (Testing section, test counts) |
| **Config/infrastructure** | `Dockerfile`, `docker-compose.yml`, `package.json`, `vite.config.ts`, `tsconfig*.json` | `project-status.md` (if significant), possibly `project-structure.md` |
| **Skills/skill files** | `skills-lock.json`, `skills-recommendations.md`, `.agents/skills/*` | `project-status.md` (Skill-Applied Improvements, Skills loaded) |
| **Memory bank files** | `memory-bank/*` | No changes needed (self-referential) |
| **Documentation** | `README.md`, `AGENTS.md`, `specs/*` | `project-status.md` (Documentation section) |
| **New files/folders** | New directories or files | `project-structure.md` (directory tree), `project-summary.md` if significant |
| **Deleted files** | Removed files | `project-structure.md` (directory tree) |
| **Dependency changes** | `requirements.txt`, `package.json` | `project-status.md` if notable |
| **Container changes** | `Dockerfile`, `docker-compose.yml` | `project-structure.md` (services section), `project-status.md` (Docker section) |

### Step 4: Update `project-status.md`

This is the primary file to update on every activation.

**Update the header:**
- Set the date to today (use `date +%Y-%m-%d` if uncertain).
- Update the branch name: run `git branch --show-current`.
- Update the latest commit hash: run `git rev-parse --short HEAD`.

**Update "What Works" → "Core Functionality":**
- If new endpoints were added, add them to the list.
- If new features were implemented (e.g., new charts, filters, components), add them.
- Remove items only if they were deliberately removed from the project.

**Update "What Works" → "Testing":**
- Update test counts. Use these commands:
  ```bash
  # Frontend test count
  cd frontend && npx vitest run 2>&1 | grep -E "Tests|Files" | tail -1

  # Backend test count
  cd backend && python -m pytest --collect-only 2>&1 | grep "collected"
  ```
- If component tests were added, note the new test files and coverage.
- If new test infrastructure was added (libraries, config changes), mention it.

**Update "What Works" → "Documentation & Agent Infrastructure":**
- If skills were added or updated, update the "Skills loaded" list and "Skill-Applied Improvements" sections.
- If new documentation files were created, list them.
- If rule files were added/changed, mention it.

**Update "Known Gaps & Issues":**
- If a previously documented gap was resolved, **strike through it** with `~~` or move it to a "Resolved" sub-section. Example:
  ```markdown
  - ~~**Zero React component tests** — no render verification~~ ✅ **Resolved** — 33 tests now exist.
  ```
- If the commit introduced new gaps or tech debt, document them here.

**Update "Next Priorities":**
- Mark completed items with `✅ Done` and the commit hash or branch.
- Add new priorities if the commit introduced new follow-up work.
- Keep the priority order (🔴 Critical, 🟢 High, 🟡 Medium).

**Update "Skill-Applied Improvements" (if applicable):**
- If a new skill was applied, add a new subsection describing what it did, which files were affected, and link to the skill source.

### Step 5: Optionally Update `project-structure.md`

Only update this file if **at least one** of these conditions is true:

- A new top-level directory was added or removed.
- A new service or entry point was created (new Dockerfile, new app module, new main entry).
- A new component directory or lib file was added that changes the architecture.
- The directory tree no longer accurately reflects the codebase.

**Directory tree**: Update the ASCII tree in the "Directory Tree" section. Add new files/directories, remove deleted ones.

**Services section**: If a new service was added, add a new service subsection. If endpoints changed, update the endpoint list in the backend section.

### Step 6: Optionally Update `project-summary.md`

Only update this file if **at least one** of these conditions is true:

- The overall purpose of the project has changed (rare).
- A new service, technology, or architectural pattern was introduced.
- Docker Compose or networking configuration changed.
- Significant new features were added that change what the project "does".
- The "Recent Changes" table needs a new entry.

**"What it does"**: Update only if the project's core functionality changed meaningfully.

**"How to run it"**: Update only if the Docker Compose command or ports changed.

**"Frontend ↔ Backend ↔ Docker connection"**: Update only if the architecture, proxy config, or networking changed.

**"Recent Changes"**: Append a new row to the table for significant changes:

```markdown
## Recent Changes (YYYY-MM-DD)

| Change | File(s) | Reason |
|--------|---------|--------|
| Brief description of what changed | Paths to affected files | Why it was done |
```

### Step 7: Verify the Update

After making changes, do a quick sanity check:

1. Run `git diff memory-bank/` to review all changes.
2. Verify the date, branch, and commit hash are correct.
3. Verify test counts match actual test output (if tests were run).
4. Ensure no existing content was accidentally removed — only targeted additions and edits.
5. Read the final `memory-bank/README.md` to ensure the file table (if any) is still accurate.

---

## Decision Reference

### When to update each file

| File | Update on every activation? | Update only if... |
|------|---------------------------|-------------------|
| `project-status.md` | **Yes** — always update date, branch, commit, and relevant sections | — |
| `project-structure.md` | No | Files/dirs added/removed; architecture changes |
| `project-summary.md` | No | Core functionality, architecture, or recent changes table needs updating |

### What NOT to do

- **Do not** rewrite the entire memory bank from scratch. Make targeted, minimal edits.
- **Do not** remove resolved issues from "Known Gaps" — strike them through so the history is preserved.
- **Do not** invent test counts or commit hashes — always use actual command output.
- **Do not** update `project-structure.md` for trivial changes (e.g., renaming a variable, adding a comment).
- **Do not** update `project-summary.md` unless the project's purpose, architecture, or connectivity changed.
- **Do not** change other people's commit messages or descriptions.

### How to detect the trigger

| Trigger | Detection Method |
|---------|-----------------|
| **Git commit** | User says "committed", "pushed", or runs git commit/push; or `git status --short` shows clean after a change |
| **Explicit request** | User says "update memory bank", "sync project status", "refresh docs" |
| **Branch switch** | `git branch --show-current` differs from what's recorded in `project-status.md` |
| **New commit on same branch** | `git rev-parse --short HEAD` differs from recorded commit hash |