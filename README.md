# Training Engine

A static, browser-only practice-test and assessment engine. It is vendor-neutral and certification-neutral: any course, certification, subject, or private assessment can be supplied as a schemaVersion 1 bank without application-code changes.

Live application:

```text
https://ninja-neer.net/training-engine/
```

## Architecture

The engine owns loading, validation, randomized uniform question selection, answer-order randomization, exam and practice modes, review navigation, completed-run review, AI-assisted explanations, progress, exports, and reports.

A bank owns its content, title, identity, version, domains, targets, and question composition.

The engine does not implement domain weighting. Authors express intended distribution by composing the bank accordingly.

The bundled default is a small generic fixture. Repository-controlled banks under `test-banks/` may use JavaScript as an internal authoring/source format. External banks opened through **Customize > Open JSON bank** must be JSON.

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

The bundled application may load repository-controlled JavaScript source files. The browser never executes a user-selected bank file. External/importable banks are JSON-only and must contain the schemaVersion 1 object directly.

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

## Runtime notes

- Completed-run review shows every presented question, including unanswered items.
- The review controls can narrow the queue to answered-incorrect items or reveal full answer text.
- Each reviewed item includes an **AI Explanation** button that opens ChatGPT with a bank-aware, question-specific study prompt. The bank title is taken from the loaded bank metadata; no certification name is hardcoded into the engine. Before first use in a browser profile, the engine discloses that it sends the current question context (bank title, domain/target, stem, choices, selected/correct answers, and confidence) to ChatGPT. Do not use this action with private or proprietary bank content you are not permitted to send externally. Third-party bank text is delimited as untrusted source material in the prompt; this reduces instruction-following risk but is not a hard security boundary.
- The final-question **Review** action in Exam mode returns the learner to the first unanswered question, then the first flagged question, then question 1 when neither exists.
- **Customize** displays a deployed build timestamp for quick live-version verification.
- `app.js` is cache-busted from `practice-test/index.html` so deployed engine changes are less likely to be masked by a stale browser or CDN copy.

## Retired legacy storage

The legacy /training/ deployment has been unpublished and its source repository re-archived. This engine uses only Training Engine storage keys and does not read or migrate browser-local progress from the retired application. Previously exported files remain the only archival route for old progress; the archived repository is historical source, not an active application.

## Content Security Policy

The application uses a meta-delivered restrictive CSP: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'. Runtime code is loaded only from same-origin external scripts; bundled repository banks use a normal static script tag and user-selected banks remain JSON-only. A meta CSP cannot enforce rame-ancestors; header-level protections require hosting configuration.
