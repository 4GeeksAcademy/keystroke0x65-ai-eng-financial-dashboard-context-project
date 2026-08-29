# Project Verification

## Phase 1

### Prompt 1 — Project Summary

**Prompt:**
> Task: Develop a short summary of the financial dashboard project.
> Constraint: It should only contain what it does, how to run it, and how the frontend, backend, and Docker are connected to each other.
> Location: write this in `memory-bank/project-summary.md`

**Result:** The AI generated a correct summary.

**Issue:** It included an unintended "Data Flows" subsection.

---

### Prompt 2 — Project Structure

**Prompt:**
> Task: Document project structure of the financial dashboard project.
> Constraint: It should only contain a mapping of the structure, the services, and the endpoints.
> Location: write this in `memory-bank/project-structure.md`
> Preferred: Add hyperlinks to each endpoint and service so the reader can go to their respective pages / lines of code.

**Result:** The AI generated a correct project structure.

**Issue:** It included an unintended "JSON Samples for Key Endpoints" section.

---

## Phase 2

### Prompt 1 — Project Research

**Prompt:**
> Task: Research the project and find the following: - Useful conventions, Risky patterns that could affect future contributors or agents. 
> Constraint: Make sure this written in ./agents/agent-research.md 
> Note: These research file will be used to develop rules later

**Result:** The AI generated a good document.

**Issue:** It included an extra section and was too lengthy.

---

### Prompt 2 — Project Research

**Prompt:**
> Now read the research file (i have edited it). Keep only key findings tied to conrete files, folders, or behaviors. Remove vague statements

**Result:** The AI removed "Summary Of Key Recommendations, Proposed Rule Seeds, Explanatory comments, Generic section headers like Architecture, Backend Conventions.

**Issue:** The sections that do remain are lengthy. (I did this last night and Im not able to see what the AI changed).

---

### Prompt 3 — Re-categorization

**Prompt:**
> can you recategorize the surviving findings by architecture, namingg, testing, documentation, DX, etc?

**Result:** The AI regrouped the findings into 7 clean categories.

**Issue:** None.

---

### Prompt 4 — Proposed Rule Set

**Prompt:**
> take the agent-research.md and create a proposed-rule-set.md in ./agents/rules

**Result:** The AI proposed 49 rules.

**Issue:** Too many rules for little things, way too specific.

---

## Phase 3

### Prompt 1 — Draft Rule Files

**Prompt:**
> Task: Using proposed-rule-set.md create rule files in .agents/rules 
> Goal: Develop rules using the proposed-rule-set.md
> Constraint: Each rule must be validated with a small real task in this repo (docs change, commit hygiene, frontend tweak, backend route change or anything else that fits). Make sure any guidance is actually actionable

**Result:** The AI did a lot of work. It created test files, executed them, reviewed them, and it created all the proposed rule files after reading all the components.

**Issue:** Not sure if having so many rules for financial dashboard is a bad thing. 

---