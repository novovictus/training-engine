# Training Engine

A static, browser-only practice-test and assessment engine. It is vendor-neutral and certification-neutral: any course, certification, subject, or private assessment can be supplied as a schemaVersion 1 bank without application-code changes.

Live application:

```text
https://ninja-neer.net/training-engine/
```

## Architecture

The engine owns loading, validation, randomized uniform question selection, answer-order randomization, exam and practice modes, progress, exports, and reports.

A bank owns its content, title, identity, version, domains, targets, and question composition.

The engine does not implement domain weighting. Authors express intended distribution by composing the bank accordingly.

The bundled default is a small generic fixture. Historical SecAI banks in `test-banks/` remain unchanged compatibility fixtures.

## SchemaVersion 1

```js
window.ANY_BANK_NAME = {
  schemaVersion: 1,
  bankId: 'unique-bank-id',
  bankVersion: '1.0.0',
  title: 'Descriptive bank title',
  questions: [{
    id: 'Q001',
    number: 1,
    domain: 'string',
    target: 'string',
    stem: 'Question text',
    options: {A: '...', B: '...', C: '...', D: '...'},
    answer: 'A'
  }]
};
```

Required bank fields are exactly `schemaVersion`, `bankId`, `bankVersion`, `title`, and `questions`.

The engine requires schema version 1, non-empty identifiers/title/questions, unique question IDs, positive integer numbers, string domains/targets, non-empty stems/options, exactly options A-D, and an answer A-D. No additional fields are required.

For JavaScript files, the loader evaluates the file against an isolated window-like object and validates every created property. Exactly one compatible bank is required; its property name is runtime display metadata and appears in the primary eyebrow.

For example:

```javascript
window.SECAI_QUESTION_BANK = { ... };
window.CYSA_QUESTION_BANK = { ... };
window.INTERNAL_TRAINING_BANK = { ... };
```

The property name is not injected into or persisted with the bank schema.

JSON banks are validated identically and display a neutral `JSON: <filename>` identifier.

## State and migration

New state uses:

```text
training-engine-v1:<bankId>:<bankVersion>
```

New run-mode preference uses:

```text
training-engine-run-mode:<bankId>:<bankVersion>
```

Durable identity is always `bankId + bankVersion`, never a JavaScript global name.

The engine reads compatible SecAI-era state and run-mode keys only when stored bank ID and version exactly match. New writes use the generalized namespaces.

## Documentation

- `BANK-GENERATION.md`: generic question-bank authoring and validation contract.
- `LOCAL-TESTING.md`: local development and browser-origin guidance.
- `NEXT-STEPS.md`: current project status and next milestones.
- `test-banks/README.md`: fixture and historical-bank inventory.

## License

Source code is MIT.

Independently authored content and documentation are CC BY 4.0 unless otherwise noted.

Historical vendor-specific banks retain their applicable trademark notices; no affiliation is implied.
