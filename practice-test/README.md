# Training Engine Runtime

This directory contains the static browser runtime.

The engine handles schema validation, random question/answer order, exam/practice modes, timers, flags, confidence, notes, resume, mastery/history, import/export, review, AI Explanation, and Copy Prompt.

Portable banks are JSON-only schemaVersion 3. The complete bank contract is in `../BANK-GENERATION.md`.

`questions.js` is the repository-controlled bundled fixture. Its JavaScript loading is internal and is not a portable-bank format.

Progress is keyed by `bankId`; mastery is reconciled using each question's `id` and `revision`:

```text
training-engine-v2:<bankId>
training-engine-run-mode:<bankId>:<bankVersion>
```

The engine uniformly samples eligible questions; it does not implement domain weighting.

AI Explanation opens ChatGPT with the generated review prompt after first-use disclosure. Copy Prompt copies that same prompt locally without an external handoff.

This is a client-side study/practice tool, not a proctored or tamper-resistant assessment platform. Answer keys are available to the browser by design.

## Iterative state

Progress format `version: 3` stores the loaded bankVersion and a safe mastery map keyed by question ID. Each entry records `revision`, `attempts`, `correct`, `mastered`, and `lastAttempt`. Three correct completions still establish mastery. On load and progress import, only matching IDs and revisions retain their counts; removed entries are dropped and new/revised questions start fresh. Revision downgrades reset as well. Reconciled state is saved through the guarded storage writer. Failed writes retain the in-memory session and display the existing persistence warning.

Completed attempts store original bank metadata and complete question snapshots including revision, independent of the current lookup. **History > View run** opens those snapshots. JSON run exports use record schemaVersion 2 (separate from bank schemaVersion 3); JSON and text exports retain the historical bank version and question revisions.

Active attempts record bankVersion and each item's revision. A different bankVersion, mismatched item revision, removed item, duplicate item, or invalid item discards the whole unfinished attempt; it is never silently shortened. Completed history and compatible mastery survive, with a notice. Authors must increment revisions for material changes and bankVersion for publications; the engine does not hash content to detect unreported edits.

Malformed root progress is backed up under `training-engine-corrupt-progress-v2:<bankId>:<bankVersion>` before fallback, without overwriting an existing backup. A legitimate bank update is not corrupt progress. Existing v2 namespaces are not read, changed, or automatically migrated. See [migration instructions](../BANK-MIGRATION-V2-TO-V3.md).
