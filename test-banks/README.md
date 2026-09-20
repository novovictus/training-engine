# Question banks and fixtures

## Real SecAI+ banks

- `../practice-test/questions.js` is the shipped default bank payload and currently mirrors the canonical comprehensive bank.
- `secai-plus-cy0-001-comprehensive-bank-v1.js` is the canonical named comprehensive bank, 168 questions.
- `secai-plus-cy0-001-terminology-drill-bank-v1.js` is the terminology-focused drill bank, 195 questions.
- `secai-plus-cy0-001-diagnostic-v2.js` preserves the prior Diagnostic v2 bank, 60 questions.
- `secai-plus-minimal-independent-bank-v1.js` is the independent validation bank, 60 questions.

All real banks use the compact row authoring format documented in `../practice-test/README.md`. The row mapper produces the runtime object schema consumed by `app.js`.

Bank loading is wired in `../practice-test/index.html`; the engine discovers exactly one compatible schemaVersion 1 object from any JavaScript global name. The shipped bundled source is `../practice-test/questions.js`, a generic fixture.

A valid outside or named `.js` or `.json` bank can be opened at runtime through Customize > Open bank file. The application stores the selected custom bank in browser local storage until `Use bundled bank` is selected. Bank files under this directory are not discovered automatically.

A bank mismatch warning is expected when stored progress belongs to a different bank identity or version.

## Public deterministic fixtures

These files are safe application fixtures, not certification practice content:

- `test-bank-42.js`: 42 questions, Q001-Q042, rotating canonical answers A-D. Validates behavior below the normal 60-question run size.`r`n- `test-fixture-bank.js`: a four-question `window.TEST_FIXTURE_BANK` fixture used to verify global-name discovery.
- `sample-bank-100.js`: 100 questions, Q001-Q100, rotating canonical answers A-D. Validates 60-question selection from a larger bank.

Both exercise schema validation, randomized question and displayed-answer order, exam mode, immediate-feedback practice mode, answer locking, scoring, flags, confidence, per-question notes, resume, quit-run abandonment, review, mastery, dual-format completed-run export, progress export/import, mismatch detection, and reset behavior.

For practice-mode validation, confirm that submitting an answer locks it, shows immediate correctness feedback, persists through navigation and reload, and records `practice` in the completed run export. Existing saved attempts without mode metadata should continue as exam-mode attempts.

For quit-run validation, confirm that abandoning an active run requires confirmation, removes the active attempt and resume state, and preserves completed history, mastery, settings, selected bank, and selected run mode.

## Restricted private content

`private/comptia-sample-20.js` contains supplied third-party assessment content retained only for private reference and validation.

Do not include `test-banks/private/` in any external package, release, shared archive, or published repository export.

## Fixture validation workflow

From the running application, open Customize > Open bank file and select the desired fixture or bank. Use `Use bundled bank` to return to `practice-test/questions.js`.

For direct compatibility testing of the bundled `questions.js` path itself, a fixture may still be copied over the bundled file temporarily:

```powershell
Copy-Item .\practice-test\questions.js .\practice-test\questions.active.js -Force
Copy-Item .\test-banks\test-bank-42.js .\practice-test\questions.js -Force
```

Install the 100-question fixture on the bundled path:

```powershell
Copy-Item .\test-banks\sample-bank-100.js .\practice-test\questions.js -Force
```

Restore the shipped default:

```powershell
Copy-Item .\practice-test\questions.active.js .\practice-test\questions.js -Force
Remove-Item .\practice-test\questions.active.js
```

Reload `practice-test/index.html` after a direct file swap. Before committing, restore `questions.js`, remove temporary files, and inspect `git status`.
