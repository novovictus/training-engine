# Training Engine

A static, browser-only, vendor-neutral practice-test and assessment engine. Any course, certification, subject, or private assessment can be supplied as a JSON schemaVersion 2 bank without application-code changes.

Live application:

`https://ninja-neer.net/training-engine/`

## Architecture

The engine owns loading, schema validation, uniform randomized selection, displayed-answer randomization, exam and practice modes, review, progress, exports, and reports. A bank owns its content, title, identity, version, domains, targets, and question composition.

The engine does not implement domain weighting. Authors express intended distribution through the composition of the bank.

Portable/importable banks are JSON only. The browser never executes a user-selected bank file. The bundled generic fixture remains repository-controlled and is loaded through the static `practice-test/questions.js` script; that internal loading mechanism is distinct from portable-bank import.

## Assessment scope

Training Engine is a client-side study and practice tool, not a proctored or tamper-resistant exam platform. Question banks and answer keys are intentionally available to the browser/user so the application can provide local scoring, review, mastery tracking, and offline-friendly operation. Exam mode and practice mode are workflow/UI modes only, not security boundaries. Do not use the engine where answer secrecy, proctoring, or high-assurance assessment controls are required.

## SchemaVersion 2

A portable bank is strict JSON with these top-level fields:

```json
{
  "schemaVersion": 2,
  "bankId": "unique-bank-id",
  "bankVersion": "1.0.0",
  "title": "Descriptive bank title",
  "questions": [
    {
      "id": "Q001",
      "domain": "domain-string",
      "target": "Target text",
      "stem": "Question text",
      "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
      "answer": "A"
    }
  ]
}
```

`schemaVersion` must be exactly `2`. Required top-level fields are `schemaVersion`, `bankId`, `bankVersion`, `title`, and `questions`. Each question contains exactly `id`, `domain`, `target`, `stem`, `options`, and `answer`; `question.number` is not part of the contract. IDs are unique and non-empty and cannot be `__proto__`, `constructor`, or `prototype`; domain and target are strings; stems and choices are non-empty. Options are exactly A, B, C, and D, and `answer` is one of those keys. The model intentionally supports one correct answer.

SchemaVersion 1 is retired. There is no v1 loading or migration path.

Imported JSON banks display a neutral `JSON: <filename>` identifier. Durable progress identity is always `bankId + bankVersion`.

## State

Current state uses:

```text
training-engine-v1:<bankId>:<bankVersion>
training-engine-run-mode:<bankId>:<bankVersion>
```

The engine uses only these current Training Engine storage namespaces. Previously exported progress files are the archival route for retired legacy application data. Progress compatibility is intentionally author-declared: `bankId` remains stable for one logical bank lineage, while `bankVersion` must change whenever prior progress/history should no longer be shared. The engine does not compute content hashes or infer content compatibility.

## Documentation

- `BANK-GENERATION.md`: bank-authoring and validation contract.
- `LOCAL-TESTING.md`: local development and browser-origin guidance.
- `test-banks/README.md`: retained-bank inventory and fixture workflow.

## License

Source code is MIT.

Independently authored content and documentation are CC BY 4.0 unless otherwise noted.

Historical vendor-specific banks retain their applicable trademark notices; no affiliation is implied.

## Runtime notes

- Completed-run review shows every presented question, including unanswered items.
- The review controls can narrow the queue to answered-incorrect items or reveal full answer text.
- Each reviewed item includes an **AI Explanation** button that opens ChatGPT with a bank-aware, question-specific study prompt. The bank title comes from loaded bank metadata; no certification name is hardcoded. Before first use in a browser profile, the engine discloses that it sends the current question context (bank title, domain/target, stem, choices, selected/correct answers, and confidence) to ChatGPT. Do not use this action with private or proprietary bank content you are not permitted to send externally. Third-party bank text is delimited as untrusted source material in the prompt; this reduces instruction-following risk but is not a hard security boundary.
- The final-question **Review** action in Exam mode returns the learner to the first unanswered question, then the first flagged question, then question 1 when neither exists.
- **Customize** displays a deployed build timestamp for quick live-version verification.

## Content Security Policy

The application uses a meta-delivered restrictive CSP: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'`. Runtime code is loaded only from same-origin external scripts; user-selected banks remain JSON-only. A meta CSP cannot enforce `frame-ancestors`; header-level protections require hosting configuration.
