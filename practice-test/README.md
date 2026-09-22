# Training Engine Runtime

The `practice-test/` directory contains the static browser runtime.

## Runtime responsibilities

The engine validates schemaVersion 2 banks; performs uniform randomized question selection and displayed-answer randomization; supports exam/practice modes, review, timers, flags, confidence ratings, notes, resume/quit, mastery, history, progress import/export, completed-run exports, and AI Explanation handoff.

The bank owns `bankId`, `bankVersion`, `title`, question content, domains, targets, and composition. The engine does not implement domain weighting; authors set intended distribution through bank composition.

## Portable bank contract

User-imported banks are JSON only and must use schemaVersion 2. The required top-level fields are `schemaVersion`, `bankId`, `bankVersion`, `title`, and `questions`. Each question contains exactly `id`, `domain`, `target`, `stem`, `options`, and `answer`. IDs must be unique and non-empty; `__proto__`, `constructor`, and `prototype` are reserved and invalid.

`options` must contain exactly non-empty A, B, C, and D values. `answer` must be one of those four keys; the engine intentionally models one correct answer. `question.number` is retired: the engine derives displayed numbering from run position. SchemaVersion 1 is retired and is not loaded or migrated.

Imported JSON banks display `JSON: <filename>`. Their durable state identity is `bankId + bankVersion`.

## Bundled fixture

`questions.js` is a repository-controlled generic schemaVersion 2 fixture loaded by a static same-origin script. Its JavaScript assignment is an internal bundled-loading detail, not part of the portable-bank contract. The browser never executes a user-selected bank file.

## State

Progress is isolated by `bankId + bankVersion` with canonical keys:

```text
training-engine-v1:<bankId>:<bankVersion>
training-engine-run-mode:<bankId>:<bankVersion>
```

`bankId` is stable for one logical bank lineage. `bankVersion` is the author-declared compatibility boundary for stored progress and history; increment it when a change should not share earlier progress. The engine intentionally does not use content hashes or infer that decision.

## Selection behavior

When a run starts, the engine determines eligible questions, uniformly shuffles that pool, and selects the configured count. It contains no weighted-selection or vendor-specific distribution rules.

## Review and AI Explanation

Completed review includes every presented question. The **Show only answered incorrectly** control narrows that queue, and **Show full correct answers and wrong selections** expands answer detail. AI Explanation uses the loaded bank title, current question context, selected/correct answers, and confidence. It discloses the outbound ChatGPT handoff before first use per browser profile.
