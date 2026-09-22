# Question Bank Generation Contract

## Contract

Portable banks are strict JSON schemaVersion 2 files:

```json
{
  "schemaVersion": 2,
  "bankId": "unique-bank-id",
  "bankVersion": "1.0.0",
  "title": "Human-readable title",
  "questions": [{
    "id": "Q001",
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
- `schemaVersion` is exactly `2`
- each question contains exactly `id`, `domain`, `target`, `stem`, `options`, `answer`
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

`bankVersion` is the persisted-progress compatibility boundary. Increment it whenever prior progress/history should no longer be shared. Cosmetic or intentionally compatible edits may retain the existing version.

The engine does not infer compatibility from content hashes.

## Authoring rules

- Use authoritative objectives, syllabus, blueprint, or source material for scope.
- Do not overwrite an existing bank when creating an independent bank.
- Do not copy restricted third-party questions into public banks.
- Represent intended weighting through bank composition; the engine does not weight domains.
- Keep question IDs stable when revising a compatible bank.

Each item should:

- test one primary competency or decision
- use a clear, self-contained stem
- have four plausible choices in the same conceptual neighborhood
- have one defensible best answer
- avoid answer-length, grammar, specificity, or absolute-wording giveaways
- avoid unrelated filler distractors
- prefer interpretation, correlation, prioritization, sequencing, and BEST/FIRST/NEXT decisions over definition recall
- use realistic artifacts when they improve the assessment

Randomized displayed answer order does not fix weak item construction.

## Validation before commit

1. Confirm source scope and intended coverage.
2. Confirm the file does not unintentionally replace another bank.
3. Validate schemaVersion 2 and strict JSON parsing.
4. Confirm IDs are unique and valid.
5. Confirm domain, target, stem, options, and answer are populated correctly.
6. Check exact and likely near-duplicates where relevant.
7. Review answer distribution for suspicious imbalance or runs.
8. Review every distractor for plausibility.
9. Review every answer key under a zero-trust standard.
10. Confirm restricted content was not copied into public material.
11. Load the JSON bank in Training Engine.
12. Inspect the final diff and repository status.

Generated banks remain working validation artifacts until independently reviewed or field-tested.
