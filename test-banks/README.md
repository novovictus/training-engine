# Question banks

Portable banks in this directory are JSON schemaVersion 3 and are loaded through **Customize > Open JSON bank**.

See `../BANK-GENERATION.md` for the complete schema and authoring contract.

## Retained banks

- `cysa-plus-cs0-003-focused-bank-v4.1.json` - 100 questions
- `secai-plus-cy0-001-comprehensive-bank-v1.json` - 168 questions
- `secai-plus-cy0-001-terminology-drill-bank-v1.json` - 195 questions
- `secai-plus-minimal-independent-bank-v1.json` - 60 questions
- `test-fixture-bank.json` - 4-question fixture

The bundled default is `../practice-test/questions.js`; it is repository-controlled and separate from portable JSON import.

Historical and retired banks remain available through Git history.

All five retained banks and the bundled fixture were migrated to schema v3 with their existing explicit IDs frozen and `revision: 1` added. No bank was removed. Question content, answer keys, source bank version labels, and order were preserved. Numeric-looking IDs are permanent identifiers, not row numbers. Future publications should increment bankVersion and revise only affected questions.

Run `node scripts/validate-banks.js` from the repository root. Its pre-migration content digests exclude only the new revision field, protecting the original IDs and content. It also checks strict schema, reserved/duplicate IDs, revisions, options and answers, and reports canonical-answer distribution and high-risk wording for human review. Existing wording and imbalance findings are retained, not silently rewritten.

`scripts/validate-iterative-banks.js` creates small in-memory Q-A/Q-B/Q-C fixtures, then updates to Q-A r1, Q-B r2, and Q-D r1. It checks mastery, history, exports, active-run safety, progress imports, schema failures, and safe object keys. These synthetic fixtures are engine tests, not publishable study material.
