# Question banks and fixtures

Files in this directory are portable JSON schemaVersion 2 banks. They are not discovered automatically; load one through **Customize > Open JSON bank**.

Portable banks have no JavaScript-global-name semantics. Each bank contains `schemaVersion`, `bankId`, `bankVersion`, `title`, and `questions`; every question contains exactly `id`, `domain`, `target`, `stem`, `options`, and `answer`. Options are exactly A-D and each item has one correct answer. `question.number` is not supported.

## Retained banks

- `cysa-plus-cs0-003-focused-bank-v4.json`: 100 questions.
- `secai-plus-cy0-001-comprehensive-bank-v1.json`: 168 questions.
- `secai-plus-cy0-001-terminology-drill-bank-v1.json`: 195 questions.
- `secai-plus-minimal-independent-bank-v1.json`: 60 questions.
- `test-fixture-bank.json`: four-question deterministic fixture.

The former JS source banks and obsolete validation/sample banks were intentionally retired as part of the schemaVersion 2 migration. Historical vendor-specific content remains subject to its applicable trademark notices; no affiliation is implied.

## Bundled default

`../practice-test/questions.js` is the repository-controlled generic schemaVersion 2 fixture bundled with the application. Its static JavaScript loading is separate from portable JSON import.

## Distribution and weighting

The engine uniformly shuffles eligible questions and selects the requested count. It does not implement domain weighting; bank authors represent intended domain or topic distribution through bank composition.

## Validation workflow

Validate JSON syntax and the schemaVersion 2 contract before committing. From the running application, open **Customize > Open JSON bank** to test a bank, then use **Use bundled bank** to return to the generic fixture.
