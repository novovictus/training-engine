# Training Engine

Static, browser-only, vendor-neutral practice-test engine.

Live: `https://ninja-neer.net/training-engine/`

## What it does

Training Engine provides randomized question selection and answer order, exam/practice modes, timers, flags, confidence, notes, resume, mastery/history, progress import/export, completed-run exports, review, AI Explanation handoff, and local prompt copying.

Portable banks are strict JSON using schemaVersion 3. The browser never executes a user-selected bank file. The repository-controlled bundled fixture is loaded separately through `practice-test/questions.js`.

The engine does not implement domain weighting. Bank authors control distribution through bank composition.

## Bank contract

`bankId` identifies the mastery lineage. A question's explicit `id` and `revision` determine mastery compatibility.

Each question contains exactly:

```text
id
revision
domain
target
stem
options
answer
```

Options are exactly A-D with one correct answer. `revision` is an integer >= 1. `question.number` and schemaVersion 1/2 banks are not supported.

See `BANK-GENERATION.md` for the complete authoring and validation contract.

## State

```text
training-engine-v2:<bankId>
training-engine-run-mode:<bankId>:<bankVersion>
```

`bankVersion` identifies a published bank revision; changing it alone does not reset mastery. Same ID and revision retain mastery; changed revisions reset only that question. Removed questions leave current totals and eligibility, while completed snapshots remain viewable and exportable. An active run from a different bank version is discarded with a notice. The run-mode preference remains version-scoped; it does not control mastery.

The new namespace and progress format (`version: 3`) isolate v2 state. No automatic v2 bank or progress migration is performed. See [BANK-MIGRATION-V2-TO-V3.md](BANK-MIGRATION-V2-TO-V3.md).

## Assessment scope

This is a client-side study/practice tool, not a proctored or tamper-resistant exam platform. Question banks and answer keys are available to the browser by design. Do not use it where answer secrecy, proctoring, or high-assurance assessment controls are required.

AI Explanation sends the current question context to ChatGPT only when invoked and discloses that handoff on first use per browser profile. Copy Prompt copies the same generated prompt to the local clipboard without sending it externally.

## Development

See:

- `AI-BANK-GENERATION.md` for AI-assisted bank generation workflow.
- `BANK-GENERATION.md` for the normative bank schema and item-quality contract.
- `BANK-MIGRATION-V2-TO-V3.md` for migrating existing banks.
- `LOCAL-TESTING.md` for local development and validation.
- `practice-test/README.md` for runtime notes.
- `test-banks/README.md` for retained banks.

## License

Source code is MIT.

Independently authored content and documentation are CC BY 4.0 unless otherwise noted. Historical vendor-specific banks retain applicable trademark notices; no affiliation is implied.
