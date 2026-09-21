# Question banks and fixtures

The engine accepts any compatible schemaVersion 1 JavaScript or JSON question bank. Files under this directory are not discovered automatically; load them through **Customize > Open bank file**.

## Historical SecAI+ banks

These banks are preserved as compatibility and study artifacts from the original SecAI+ project:

- `secai-plus-cy0-001-comprehensive-bank-v1.js`: 168 questions.
- `secai-plus-cy0-001-terminology-drill-bank-v1.js`: 195 questions.
- `secai-plus-minimal-independent-bank-v1.js`: 60 questions.

They are no longer the bundled default. Their continued ability to load without modification is a backward-compatibility requirement for the generalized engine.

## CySA+ CS0-003 banks

- `cysa-plus-cs0-003-validation-bank-v1.js`: small validation bank used to exercise the generalized engine against CySA+ content.
- `cysa-plus-cs0-003-focused-bank-v4.js`: current focused scenario bank. It contains 100 questions with the intended 33/30/20/17 domain composition and incorporates the item-quality lessons documented in `../BANK-GENERATION.md`.

Focused-bank v2 and v3 were rejected as assessment-quality experiments and are intentionally absent from the active directory; Git history preserves them.

## Bundled default

`../practice-test/questions.js` is the shipped generic fixture used to validate the engine without coupling the runtime to a vendor, certification, or exam.

The engine discovers exactly one compatible schemaVersion 1 object from any JavaScript global name. The global property name becomes runtime display metadata, while durable bank identity remains `bankId + bankVersion`.

## Public deterministic fixtures

These files are application fixtures, not certification practice content:

- `test-bank-42.js`: 42 questions, Q001-Q042, rotating canonical answers A-D.
- `test-fixture-bank.js`: four-question `window.TEST_FIXTURE_BANK` fixture used to verify global-name discovery.
- `sample-bank-100.js`: 100 questions, Q001-Q100, rotating canonical answers A-D.

The fixtures exercise schema validation, randomized question selection, displayed-answer randomization, exam mode, practice mode, answer locking, scoring, flags, confidence, notes, resume, quit-run behavior, review, mastery, completed-run export, progress export/import, mismatch detection, and reset behavior.

## Bank loading

A compatible outside or named `.js` or `.json` bank can be opened at runtime through **Customize > Open bank file**. The selected custom bank is retained in browser local storage until **Use bundled bank** is selected.

For JavaScript banks, the engine executes the file against an isolated window-like object and requires exactly one compatible schemaVersion 1 bank object. The global property name can be arbitrary, for example:

```javascript
window.SECAI_QUESTION_BANK = { ... };
window.CYSA_QUESTION_BANK = { ... };
window.INTERNAL_TRAINING_BANK = { ... };
```

The object schema remains unchanged.

## Distribution and weighting

The engine does not implement domain weighting. It uniformly shuffles the eligible question pool and selects the configured number of questions.

Bank authors are responsible for expressing intended domain or topic distribution through bank composition.

## Restricted private content

Any restricted or third-party content retained for private validation must remain excluded from public releases and published repository exports.

## Fixture validation workflow

From the running application, open **Customize > Open bank file** and select a fixture or bank. Use **Use bundled bank** to return to `practice-test/questions.js`.

Before committing fixture experiments, restore the bundled fixture, remove temporary files, and inspect `git status`.
