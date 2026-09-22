# Training Engine Next Steps

State captured: 2026-09-22

## Current status

Training Engine is a vendor-neutral, certification-neutral static browser application on `main`.

The completed hardening pass is merged. The application is deployed through GitHub Pages at:

```text
https://ninja-neer.net/training-engine/
```

The project root redirects to:

```text
https://ninja-neer.net/training-engine/practice-test/
```

The historical `/training/` path is retained only as a redirect to the current engine.

## Current bank contract

Portable banks are strict JSON using schemaVersion 2.

Durable bank identity is:

```text
bankId + bankVersion
```

Each question contains exactly:

```text
id
domain
target
stem
options
answer
```

`question.number` is not part of the contract. Options are exactly A-D with one correct answer. User-selected JavaScript banks and schemaVersion 1 are retired.

The repository-controlled bundled fixture remains loaded through `practice-test/questions.js`; that JavaScript loading path is internal and is not part of the portable-bank format.

## Engine behavior

Current behavior includes:

- uniform randomized question selection
- randomized displayed answer order
- exam and practice modes
- mastery, history, notes, confidence, flags, resume, and quit-run behavior
- progress import/export
- completed-run JSON and text export
- review of every presented question, including unanswered items
- Exam-mode review navigation
- AI Explanation handoff with first-use disclosure
- restrictive same-origin CSP
- guarded local-storage persistence and corrupt-state preservation
- JSON-only custom-bank import
- cache-busted static runtime assets
- deployed build visibility in Customize

The engine does not implement domain weighting. Bank authors represent intended topic/domain distribution through bank composition.

## Storage

Progress state uses:

```text
training-engine-v1:<bankId>:<bankVersion>
```

Run-mode preference uses:

```text
training-engine-run-mode:<bankId>:<bankVersion>
```

The engine does not read or migrate retired `secai-plus-*` browser-local storage. Previously exported files are the archival route for old progress.

`bankVersion` is the bank author's explicit progress-compatibility boundary. Change it when prior progress/history should no longer be shared.

## Validation baseline

Current validation includes:

- schemaVersion 2 bank validator coverage
- reserved-ID rejection
- corrupt-progress recovery harness
- download-helper ordering harness
- Node syntax checks
- CSP browser checks
- manual localhost smoke testing
- manual browser testing in Edge, Firefox, and Chrome
- live verification of the historical `/training/` redirect

Failures found during field use should still be fixed narrowly rather than triggering broad refactors.

## Current content

Retained portable banks under `test-banks/` are JSON schemaVersion 2:

- `cysa-plus-cs0-003-focused-bank-v4.json`
- `secai-plus-cy0-001-comprehensive-bank-v1.json`
- `secai-plus-cy0-001-terminology-drill-bank-v1.json`
- `secai-plus-minimal-independent-bank-v1.json`
- `test-fixture-bank.json`

Earlier failed or obsolete bank experiments remain recoverable through Git history rather than as active files.

## Scope control

Do not change the engine merely because a bank represents a new certification or subject.

Future engine changes should be driven by:

- concrete defects
- reusable requirements observed across multiple banks
- clear portability or usability needs

Avoid vendor-specific branching in active engine logic.

## Historical material

The original training repository remains the historical SecAI+ project and redirect host:

```text
https://github.com/novovictus/training
```

Its `pages-redirect` branch serves the historical `/training/` redirect, while the former application source is preserved outside the published redirect branch.
