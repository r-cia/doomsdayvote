# AGENTS.md — SYSTEM DIRECTIVES

<system_instructions>
CRITICAL: READ AND OBEY ALL DIRECTIVES BELOW BEFORE EXECUTING ANY TASK.
ZERO TOLERANCE FOR RULE VIOLATIONS.
</system_instructions>

## 0. INITIALIZATION
- **Mandatory First Step:** ALWAYS initialize the environment by executing the required skills: `/honey ultra` at the start of any task.

---

## 1. COMMUNICATION & OUTPUT FORMAT
- **No Conversational Fluff:** NEVER use greetings, introductions, transitional setups, or post-execution explanations.
- **Return Final Result Only:** Deliver exclusively the requested final artifact or code result.
- **Thinking Process Isolation:** All reasoning must occur strictly within hidden reasoning tags. NEVER narrate steps, reasoning, or actions in code output or prose.
- **Handling Ambiguity:** NEVER complete, infer, assume, or reinterpret ambiguous business rules or gaps. If anything is unclear, ASK THE USER before implementing.

---

## 2. WORKFLOW & PROCESS CONTROL
- **Plan Mode Required:** Present a detailed plan and obtain explicit user approval before writing or modifying code. **Claude agent MUST USE Opus** to do ANY planning. Plan should be stored on docs/current-plan.md.
- **Strict Scope Boundaries:** Edit ONLY files within the repository root and its subfolders. 
- **Tool Limits:** Maintain a maximum of **30 tool calls per task**. If additional calls are needed, explain the explicit reason before exceeding the threshold.
- **Zero Disposable Code:** NEVER write scratch scripts, throwaway test files in `test/`, or ad-hoc verification harnesses (even if deleted afterward). Validate changes solely using the official project test suite or manual reasoning.
- **Zero Redundancy:** DO NOT REPEAT file searches (`grep`, `find`) or re-read files if the required context is already present in recent chat history.
- **Commit Rule:** Commit the code to GIT at the end of each task. Push when all tasks are done.

---

## 3. FILE MODIFICATION & SHELL RESTRICTIONS

<critical_file_rules>
1. **Mandatory Tool Usage:**
   - ALWAYS use `edit` / `edit_file` to modify existing files.
   - ALWAYS use `write` / `write_file` to create or overwrite complete files.
   - ALWAYS use `read` / `read_file` to inspect file content.

2. **Prohibited Modification Workarounds (STRICTLY FORBIDDEN):**
   - NEVER use `sed`, `awk`, `perl`, `cat <<EOF`, or `echo` within the `shell` tool to modify or create files.
   - NEVER execute inline Python code (`python -c "..."`) or generate temporary Python scripts to edit, refactor, or append text to local files.

3. **Restricted Shell Usage:**
   - The `shell` tool must be used EXCLUSIVELY for:
     - Running build commands, compilers, or linters.
     - Executing test suites (e.g., `pytest`, `npm test`).
     - Managing packages or environment dependencies.
     - Version control (`git` commands).
   - If a shell command's primary purpose is altering file content on disk, it is STRICTLY FORBIDDEN.

4. **Editing Standards:**
   - **Batch Edits:** Apply all changes to a single file at once. Prefer rewriting complete functions or blocks rather than applying multiple fragmented patches.
   - **Pre-Save Validation:** Validate current file state before saving, confirming the edit does not undo, overwrite, or remove existing valid logic.
   - **File Edit:** **Claude Agent MUST DELEGATE TO Sonnet** ANY code implementation.
</critical_file_rules>

---

## 4. CODE STYLE & COMMENTING RULES
- **Self-Explanatory Code:** Write clean, production-ready code. Do NOT add inline comments, docstrings, or markdown code explanations unless explicitly requested.
- **Workaround Exception Only:** Comment ONLY non-obvious workarounds or critical technical constraints (explain **WHY**, never **WHAT**).
- **Environment File Standard:** `.env.example` is the only file that requires documentation comments. Separate sections using `# ── `.

---

## 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION
> **Rule:** Code is NOT documentation. Every system logic change MUST be documented in WORKFLOW tool.

| File | Exclusive Scope |
| :--- | :--- |
| `README.md` | Repository overview (the ONLY `.md` file allowed on the repository). |
| `docs/architecture.md` | Live system architecture and component structure. |
| `docs/blueprint.md` | Business rules and domain specifications. |
| `docs/design-system/*.md` | Design system guidelines (one file per module/screen). |
| `docs/API.md` | API endpoints and request/response contracts. |

- Any modification to business logic, API, architecture, or design system MUST be updated in the corresponding file above.
- All Tasks, Technical debts and documentation MUST be on Workflow tool. The tool MUST be called by the workflow skill.

---

## 6. FRONTEND DEVELOPMENT
- **Required Skill Interfacing:** ALWAYS invoke frontend skills in the following strict priority order:
  1. `ui-ux-pro-max`
  2. `impeccable`
  3. `frontend-design`

---

## 7. DATABASE INTEGRITY & SAFETY

<database_rules>
- **NO DIRECT DATABASE WRITES:**
  - **STRICTLY PROHIBITED:** Running ad-hoc commands (`node -e`, scripts, REPL) connected to `DATABASE_URL` / `DATABASE_URL_TEST` executing `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, or DDL operations for debugging, quick fixes, or manual seeding.
  - **PERMITTED:** Direct read-only queries (`SELECT`) via REPL/scripts for data analysis and inspection.
- **Official Write Path Only:**
  - Write operations must occur strictly via `npm run migrate` (migrations located in `src/migrations/`) or through official application execution (`npm start` / `npm run dev`).
  - Database logic validation must occur via unit tests using mock/fake databases (`npm run test`), never by writing directly to a real/emulated database.
  - Any manual data modification requires explicit user approval prior to execution.
</database_rules>

---

## 8. GRAPHIFY KNOWLEDGE GRAPH
When a knowledge graph exists in `graphify-out/` or the `/graphify` command is issued:

- **Querying:** Execute `graphify query "<question>"` for codebase architecture questions. Use `graphify path "<A>" "<B>"` for component relationships and `graphify explain "<concept>"` for isolated concepts.
- **Navigation:** Use `graphify-out/wiki/index.md` for high-level repository navigation instead of browsing raw source files.
- **Architecture Review:** Read `graphify-out/GRAPH_REPORT.md` only for broad architectural analysis.
- **Graph Maintenance:** ALWAYS execute `graphify update .` after modifying code files to keep AST references in sync.