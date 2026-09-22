# Training Engine Runtime

This directory contains the static browser runtime.

The engine handles schema validation, random question/answer order, exam/practice modes, timers, flags, confidence, notes, resume, mastery/history, import/export, review, and AI Explanation.

Portable banks are JSON-only schemaVersion 2. The complete bank contract is in `../BANK-GENERATION.md`.

`questions.js` is the repository-controlled bundled fixture. Its JavaScript loading is internal and is not a portable-bank format.

Progress is keyed by `bankId + bankVersion`:

```text
training-engine-v1:<bankId>:<bankVersion>
training-engine-run-mode:<bankId>:<bankVersion>
```

The engine uniformly samples eligible questions; it does not implement domain weighting.

This is a client-side study/practice tool, not a proctored or tamper-resistant assessment platform. Answer keys are available to the browser by design.
