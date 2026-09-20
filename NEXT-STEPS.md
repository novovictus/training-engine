# Training Engine Next Steps

State captured: 2026-09-20

## Current status

The Training Engine is now a vendor-neutral, certification-neutral static browser application derived from the original SecAI+ training project.

The generalized implementation is on `main` in commit:

```text
a4046be Generalize engine for vendor-neutral assessment banks
```

The application is deployed through GitHub Pages and is accessible at:

```text
https://ninja-neer.net/training-engine/
```

The root redirects to:

```text
https://ninja-neer.net/training-engine/practice-test/
```

## Completed: engine generalization

The active engine no longer depends on CompTIA, SecAI+, CY0-001, or any other vendor/test identity.

Completed behavior includes:

- schemaVersion 1 preserved unchanged
- JavaScript bank discovery from any compatible global property name
- dynamic display of the discovered JavaScript global name
- JSON bank loading with neutral filename-derived runtime identity
- generic bundled fixture instead of SecAI-specific default content
- neutral storage namespaces
- backward-compatible reads for matching legacy SecAI-era state
- bank/version state isolation
- uniform randomized question selection
- randomized displayed answer order
- exam and practice modes
- mastery, history, notes, confidence, flags, resume, and quit-run behavior
- progress export/import
- completed-run JSON and text export

## Current bank contract

Durable bank identity is:

```text
bankId + bankVersion
```

The JavaScript global property name is runtime display metadata only.

The bank author owns:

- title
- identity
- version
- questions
- domains
- targets
- topic/domain distribution

The engine does not implement exam weighting. It uniformly samples from the eligible bank. Bank authors express intended distribution through bank composition.

## Storage

New progress state uses:

```text
training-engine-v1:<bankId>:<bankVersion>
```

Run-mode preference uses:

```text
training-engine-run-mode:<bankId>:<bankVersion>
```

Compatible legacy SecAI-era state is read only when embedded bank identity exactly matches the loaded bank. New writes use the generalized namespace.

## Validation baseline

The generalized engine has been smoke-tested by:

- completing the bundled fixture
- loading an unchanged historical SecAI bank
- confirming the discovered global name is displayed
- importing historical compatible progress
- exercising the deployed GitHub Pages application

Failures found during field use should be fixed narrowly rather than triggering broad refactors.

## Next content milestone

The next likely content task is a CySA+ CS0-003 bank.

That bank should:

- use schemaVersion 1 unchanged
- load without application-code changes
- define its own JavaScript global name
- define a unique bank ID and version
- map questions to CySA+ domains/targets
- represent intended exam-domain distribution through bank composition
- remain separate from the bundled generic fixture

If creating the CySA+ bank exposes an actual engine limitation, treat that as a separate engine defect or feature request rather than embedding CySA-specific logic into the runtime.

## Scope control

Do not change the engine merely because a bank represents a new certification or subject.

Future engine changes should be driven by:

- concrete defects
- reusable requirements observed across multiple banks
- clear portability or usability needs

Avoid vendor-specific branching in active engine logic.

## Historical material

Historical SecAI banks remain in `test-banks/` as compatibility fixtures and prior study artifacts.

The archived original repository remains the historical SecAI+ project:

```text
https://github.com/novovictus/training
```

It should remain archived and unchanged.
