# Training Engine

Static, browser-only, vendor-neutral practice-test engine.

Live: `https://ninja-neer.net/training-engine/`

## What it does

Training Engine provides randomized question selection and answer order, exam/practice modes, timers, flags, confidence, notes, resume, mastery/history, progress import/export, completed-run exports, review, AI Explanation handoff, and local prompt copying.

Portable banks are strict JSON using schemaVersion 2. The browser never executes a user-selected bank file. The repository-controlled bundled fixture is loaded separately through `practice-test/questions.js`.

The engine does not implement domain weighting. Bank authors control distribution through bank composition.

## Bank contract

Durable bank identity is `bankId + bankVersion`.

Each question contains exactly:

```text
id
domain
target
stem
options
answer
```

Options are exactly A-D with one correct answer. `question.number` and schemaVersion 1 are retired.

See `BANK-GENERATION.md` for the complete authoring and validation contract.

## State

```text
training-engine-v1:<bankId>:<bankVersion>
training-engine-run-mode:<bankId>:<bankVersion>
```

`bankVersion` is the author-declared progress-compatibility boundary. Change it when prior progress/history should no longer be shared.

## Assessment scope

This is a client-side study/practice tool, not a proctored or tamper-resistant exam platform. Question banks and answer keys are available to the browser by design. Do not use it where answer secrecy, proctoring, or high-assurance assessment controls are required.

AI Explanation sends the current question context to ChatGPT only when invoked and discloses that handoff on first use per browser profile. Copy Prompt copies the same generated prompt to the local clipboard without sending it externally.

## Development

See:

- `BANK-GENERATION.md` for bank authoring.
- `LOCAL-TESTING.md` for local development and validation.
- `practice-test/README.md` for runtime notes.
- `test-banks/README.md` for retained banks.

## License

Source code is MIT.

Independently authored content and documentation are CC BY 4.0 unless otherwise noted. Historical vendor-specific banks retain applicable trademark notices; no affiliation is implied.
