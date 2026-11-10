# Migrating banks from v2 to v3

Training Engine now accepts only schemaVersion 3 portable JSON banks. This is a breaking change: v2 banks are rejected, never silently upgraded. Historical v2 engines and banks remain available through Git history/releases.

## Why v3 exists

V2 authoring commonly derived question IDs from row position. Inserting, deleting, or reordering rows could change later IDs, while changing bankVersion isolated all mastery and history. V3 makes question identity explicit and permanent and adds a revision for the assessment meaning of each question.

IDs are identity, not display order. Reordering questions must not change their IDs or mastery. Removing one question must not affect unrelated mastery. New questions receive new IDs; never reuse an old ID for an unrelated question.

## Porting steps

1. Change `schemaVersion` from 2 to 3.
2. Assign explicit permanent IDs. Existing unique IDs can be frozen as literal strings; they do not need a new naming convention. Do not derive them during rendering or mapping.
3. Add `revision: 1` to every question.
4. Stop generating IDs from row position.
5. Keep `bankId` stable across future iterations of the same bank lineage.
6. Increment `bankVersion` when publishing bank revisions.
7. Increment only an affected question's `revision` when its assessment semantics change.
8. Do not renumber existing questions when adding, removing, or reordering content.
9. Existing v2 progress is not automatically migrated. Export/archive it using the historical v2 runtime if needed. V3 uses a separate storage namespace and rejects v2 progress imports.
10. Historical v2 runtime/banks remain available through Git history/releases. Run the current validator and browser smoke checks before using a migrated bank.

## Portable JSON example

```json
{
  "schemaVersion": 3,
  "bankId": "example-bank",
  "bankVersion": "1.0.0",
  "title": "Example Bank",
  "questions": [{
    "id": "EXAMPLE-1.1-001",
    "revision": 1,
    "domain": "1",
    "target": "1.1 Example target",
    "stem": "Which value is greatest?",
    "options": {"A": "12", "B": "21", "C": "18", "D": "9"},
    "answer": "B"
  }]
}
```

The bank must have exactly the five top-level fields shown. Each question must have exactly `id`, `revision`, `domain`, `target`, `stem`, `options`, and `answer`. IDs are non-empty, unique strings, excluding `__proto__`, `constructor`, and `prototype`; no naming convention is enforced. Revision must be an integer at least 1. Domain and target are strings, stem is non-empty, options are exactly four non-empty strings A–D, and answer is one canonical A–D key. Additional question metadata is not accepted.

## Compact authoring

Portable imports remain JSON-only. If you use compact rows in an authoring script, explicitly include the permanent ID and revision, then serialize the resulting bank as JSON:

```js
const rows = [
  ["EXAMPLE-1.1-001", 1, "1", "1.1 Example target",
   "Which value is greatest?", "12", "21", "18", "9", "B"]
];
const questions = rows.map(([id, revision, domain, target, stem, A, B, C, D, answer]) => ({
  id, revision, domain, target, stem, options: {A, B, C, D}, answer
}));
```

Do not use array indexes or row numbers to generate IDs. Once assigned, the string stays with the question permanently, regardless of where the row moves.

## Revision decisions

Keep the revision for punctuation, spelling, formatting, or inconsequential wording cleanup. Increment it for answer-key corrections, ambiguous distractor corrections, changed technical meaning, scenario logic or assessed concept, significant stem rewrites, and option rewrites that change the required reasoning. For example, `EXAMPLE-1.1-001` revision 1 becomes the same ID at revision 2 after an answer-key correction. Only its mastery resets.

The author declares assessment compatibility. The engine does not hash question content or infer compatibility. Any unequal revision resets mastery, including loading an older revision. Do not decrement revisions as a way to recover older mastery.

`bankVersion` remains the publication/source identifier used in state and completed attempts. Suggested conventions are `1.0.0` for the initial release, `1.0.1` for non-semantic corrections, `1.1.0` for added/removed/revised questions, and `2.0.0` for major redesign. There is no automatic semantic-version behavior. Changing bankVersion alone does not erase compatible mastery.

## State and history

V3 banks use `training-engine-v2:<bankId>` for progress, with progress format `version: 3`. These version numbers describe different contracts. The old `training-engine-v1:<bankId>:<bankVersion>` records remain untouched and unread.

On load or v3 progress import within the same bankId:

| Change | Result |
| --- | --- |
| Same ID and revision | Preserve mastery counts and three-correct-completions rule |
| Same ID, different revision | Reset only that question |
| New ID | Start fresh |
| Removed ID | Drop from current mastery and future run eligibility |
| Reorder | Preserve mastery |
| Only bankVersion changes | Preserve compatible mastery |
| Active attempt from another bankVersion | Discard only the unfinished attempt and show a notice |

Removed mastery entries are dropped on reconciliation; reintroducing a previously removed question after that state is saved starts fresh. Completed attempts are retained regardless of removed or revised questions. They contain the original bank metadata, question IDs/revisions, stems, options, answers, and learner responses. Open **History > View run** to review/export them. Run JSON exports use record schemaVersion 2 and include `revision` for every question; text exports include “Question revision”.

An active attempt also records each question revision. A missing/revised/duplicate/invalid item discards the whole unfinished run, even if the bankVersion was not incremented. Never change assessment content without updating its revision; unreported content edits cannot be detected by this contract.

## Validation

See [BANK-GENERATION.md](BANK-GENERATION.md) for quality requirements and [LOCAL-TESTING.md](LOCAL-TESTING.md) for executable checks and browser smoke steps. `node scripts/validate-banks.js` validates the repository banks, and `node scripts/validate-iterative-banks.js` exercises revision reconciliation and schema rejection. Neither checks whether an author's chosen ID is semantically stable; authors must preserve that invariant.

All retained repository banks were migrated, preserving existing explicit IDs and assessment content and adding revision 1. No private pilot bank content is part of this migration.
