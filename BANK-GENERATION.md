# Question Bank Generation Contract

## Contract

Portable banks are strict JSON schemaVersion 3 files:

```json
{
  "schemaVersion": 3,
  "bankId": "unique-bank-id",
  "bankVersion": "1.0.0",
  "title": "Human-readable title",
  "questions": [{
    "id": "EXAMPLE-1.1-001",
    "revision": 1,
    "domain": "domain-string",
    "target": "Target text",
    "stem": "Question text",
    "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
    "answer": "A"
  }]
}
```

Requirements:

- top-level fields: `schemaVersion`, `bankId`, `bankVersion`, `title`, `questions`
- `schemaVersion` is exactly `3`
- each question contains exactly `id`, `revision`, `domain`, `target`, `stem`, `options`, `answer`
- `revision` is an integer >= 1
- IDs are unique, non-empty, and may not be `__proto__`, `constructor`, or `prototype`
- `options` contains exactly non-empty A-D strings
- `answer` is exactly A, B, C, or D
- `question.number` is not part of the contract
- user-imported banks are JSON only

A practical filename pattern is:

```text
test-banks/<subject>-<descriptor>-bank-v<major>.json
```

## Versioning

`bankId` identifies one logical bank lineage.

`bankVersion` identifies each published bank revision and is recorded in state and completed runs. Increment it when publishing changes. Question `id` plus `revision`, not bankVersion, determines mastery compatibility. Keep `bankId` stable across iterations.

Suggested versions: `1.0.0` initial release, `1.0.1` non-semantic corrections, `1.1.0` added/removed/revised questions, `2.0.0` major redesign. The engine compares version strings for active-run safety; it does not interpret semantic versions.

The engine does not infer compatibility from content hashes.

## Authoring rules

- Use authoritative objectives, syllabus, blueprint, or source material for scope.
- Do not overwrite an existing bank when creating an independent bank.
- Do not copy restricted third-party questions into public banks.
- Represent intended weighting through bank composition; the engine does not weight domains.
- IDs are identity, not display order. Explicitly author permanent IDs; never generate them from row position or renumber them after additions, removals, or reordering. New questions get new IDs. Do not reuse retired IDs for unrelated questions. No naming convention is enforced.
- Require an integer `revision >= 1` for every question. Keep it for punctuation, spelling, formatting, and inconsequential wording changes. Increment it for answer-key or ambiguous-distractor corrections, changed technical meaning, scenario logic or assessed concepts, and significant stem/option rewrites that change reasoning.
- Reordering preserves mastery. Removing a question does not affect unrelated mastery. Any revision mismatch resets only that question, including a downgrade. Removed mastery entries are dropped; reintroducing a removed question after reconciliation starts fresh.
- See [BANK-MIGRATION-V2-TO-V3.md](BANK-MIGRATION-V2-TO-V3.md) for porting and compact-row examples.

Each item should:

- test one primary competency or decision
- use a clear, self-contained stem
- have four plausible choices in the same conceptual neighborhood
- have one defensible best answer
- avoid answer-length, grammar, specificity, or absolute-wording giveaways
- avoid unrelated filler distractors
- prefer interpretation, correlation, prioritization, sequencing, and BEST/FIRST/NEXT decisions over definition recall
- use realistic artifacts when they improve the assessment

Avoid weakening distractors with absolute or limiting qualifiers such as `only`, `always`, `never`, `all`, `must`, or `immediately` unless that wording is technically necessary to the concept being tested. If one option uses such a qualifier, verify that it does not become trivially eliminable from wording alone. Distractors should remain technically plausible without artificial disqualifiers.

Randomized displayed answer order does not fix weak item construction.

## Validation before commit

1. Confirm source scope and intended coverage.
2. Confirm the file does not unintentionally replace another bank.
3. Validate schemaVersion 3 and strict JSON parsing.
4. Confirm IDs are unique and valid.
5. Confirm domain, target, stem, options, and answer are populated correctly.
6. Check exact and likely near-duplicates where relevant.
7. Review answer distribution for suspicious imbalance or runs.
8. Review every distractor for plausibility.
9. Search the bank for high-risk qualifier words such as `only`, `always`, `never`, `all`, `must`, and `immediately`, and manually review each occurrence for answer leakage.
10. Review every answer key under a zero-trust standard.
11. Confirm restricted content was not copied into public material.
12. Load the JSON bank in Training Engine.
13. Inspect the final diff and repository status.

Generated banks remain working validation artifacts until independently reviewed or field-tested.
