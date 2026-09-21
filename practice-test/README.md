# Training Engine Runtime

The `practice-test/` directory contains the static browser runtime for the vendor-neutral Training Engine.

## Runtime responsibilities

The engine owns:

- schemaVersion 1 validation
- JavaScript and JSON bank loading
- runtime bank-source identification
- randomized uniform question selection
- displayed-answer randomization
- exam and practice modes
- exam review navigation
- completed-run review including unanswered questions
- per-question AI Explanation handoff to ChatGPT using loaded-bank metadata
- deployed build timestamp display in Customize
- timers
- flags
- confidence ratings
- notes
- resume and quit-run behavior
- mastery and attempt history
- progress export/import
- completed-run JSON and text export

The bank owns:

- `bankId`
- `bankVersion`
- `title`
- question content
- domains
- targets
- question composition

The engine does not implement domain weighting.

## SchemaVersion 1

```javascript
window.ANY_BANK_NAME = {
  schemaVersion: 1,
  bankId: "unique-bank-id",
  bankVersion: "1.0.0",
  title: "Human-readable title",
  questions: [{
    id: "Q001",
    number: 1,
    domain: "domain-string",
    target: "Target text",
    stem: "Question text",
    options: {
      A: "Option A",
      B: "Option B",
      C: "Option C",
      D: "Option D"
    },
    answer: "A"
  }]
};
```

The schema remains unchanged from the original implementation.

## JavaScript bank discovery

JavaScript bank files are evaluated against an isolated window-like object.

The loader inspects properties created by the file and requires exactly one object that satisfies the schemaVersion 1 bank shape.

The global property name becomes runtime display metadata.

Examples:

```javascript
window.SECAI_QUESTION_BANK = { ... };
window.TEST_FIXTURE_BANK = { ... };
window.CYSA_QUESTION_BANK = { ... };
```

No engine change is required for a new global name.

The global property name is not part of durable bank identity and is not added to the bank object.

## JSON banks

JSON banks use the same schema without a JavaScript global assignment.

The engine displays a neutral filename-derived identifier:

```text
JSON: <filename>
```

## State

Progress state is isolated by:

```text
bankId + bankVersion
```

Canonical progress key:

```text
training-engine-v1:<bankId>:<bankVersion>
```

Canonical run-mode key:

```text
training-engine-run-mode:<bankId>:<bankVersion>
```

Compatible legacy SecAI-era records may be read and migrated only when embedded bank identity exactly matches the loaded bank.

## Bundled fixture

`questions.js` is a generic fixture used to verify the runtime without coupling the engine to any vendor or certification.

Historical SecAI banks remain available under `../test-banks/` as compatibility fixtures and prior study artifacts.

## Selection behavior

The engine does not implement domain weighting.

When a run starts, it:

1. determines eligible questions
2. uniformly shuffles the eligible pool
3. selects the configured number of questions

Bank authors are responsible for representing intended topic/domain distribution through bank composition.

## Review behavior

After a run completes, the review queue contains every presented question, including unanswered items. The **Show only answered incorrectly** control narrows that list when desired, and **Show full correct answers and wrong selections** expands answer detail.

In Exam mode, the final-question **Review** action jumps to the first unanswered question, then the first flagged question, then question 1 when neither exists, while keeping the question navigator available.

Each reviewed question includes an **AI Explanation** button. The generated prompt uses the active bank title, domain, target, stem, options, selected answer, correct answer, and confidence. The engine does not hardcode a vendor or certification name.

## Deployment visibility

The Customize dialog displays a build timestamp derived from the deployed application resources. The `app.js` script reference in `index.html` is cache-busted so browser or CDN caching is less likely to hide a newly deployed runtime change.

## Retired legacy storage

The legacy /training/ deployment has been unpublished and its source repository re-archived. This engine uses only Training Engine storage keys and does not read or migrate browser-local progress from the retired application. Previously exported files remain the only archival route for old progress; the archived repository is historical source, not an active application.
