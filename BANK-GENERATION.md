# Question Bank Generation Contract

## Purpose

This document defines generation, validation, and preservation requirements for question banks used by the Training Engine.

It applies to humans and AI systems creating or reviewing banks. The engine is vendor-neutral and certification-neutral; bank-specific scope comes from the source material chosen for that bank.

## Source hierarchy

Before generating a bank:

1. Identify the authoritative objectives, syllabus, blueprint, or source material for the target assessment.
2. Review `README.md`.
3. Review `practice-test/README.md`.
4. Review this contract.
5. Review relevant existing banks under `test-banks/` when duplication analysis is required.
6. Use restricted or third-party material only when explicitly authorized.

Authoritative target material defines scope. Existing banks define prior coverage. The engine schema is defined below.

## Preservation rules

- Never overwrite, rename, delete, or revise an existing bank when asked to create an independent bank.
- Add a new bank as a separate file unless the request explicitly identifies an existing bank for revision.
- Do not modify engine files merely to add a new bank.
- Do not copy restricted third-party questions into public banks, fixtures, releases, or published sites.
- Keep generated assessment content separate from deterministic application fixtures.
- Preserve repository history as the engineering record.

## Bank size

Bank size is assessment-specific. Unless a task defines a target, choose a size that provides useful coverage without unnecessary duplication.

The engine can run any configured subset up to the number of eligible questions in the bank.

## Independence and duplication

An independent bank should contain meaningfully distinct assessment items.

- Do not repeat stems from existing banks when originality is required.
- Do not create cosmetic rewrites that preserve the same scenario, facts, option structure, and answer logic.
- Repeated objectives are acceptable when tested through a materially different scenario or cognitive task.
- Check exact duplicate stems and review likely near-duplicates when building related banks.

## Objective and domain coverage

- Map every question to an appropriate `domain` and `target`.
- Use the authoritative source for the target assessment to determine intended coverage.
- The engine does not implement domain weighting.
- Bank authors are responsible for representing intended weighting or coverage through the composition of the bank itself.
- Larger banks should broaden sub-objective coverage rather than simply repeat the same high-level concepts.

## Item-writing standard

Each item should:

- Test one primary decision, distinction, fact pattern, or competency.
- Use a clear, self-contained stem.
- Include exactly four non-empty options labeled A through D.
- Have one defensible best answer.
- Use qualifiers such as `best`, `first`, `most appropriate`, or `most likely` only when the scenario supports prioritization.
- Avoid unsupported assumptions, trick wording, double negatives, and irrelevant detail.
- Avoid distractors that are obviously unserious or unrelated.
- Avoid making the correct option conspicuously longer or better written than every distractor.
- Avoid `all of the above` and `none of the above` unless explicitly required.

## Distractor standard

Good distractors are plausible to a partially prepared candidate but incorrect for a specific reason. Examples include:

- a valid control at the wrong lifecycle phase
- a technically true statement that does not answer the question
- a related but incorrect framework or concept
- a less appropriate sequence or priority
- a control addressing a secondary rather than primary issue

## Answer-key distribution

- Do not force a perfectly even canonical answer distribution.
- Inspect for severe imbalance or suspicious runs.
- Correct content-quality problems rather than rotating answer letters cosmetically.
- The application randomizes displayed answer order during each run.

## Explanations

SchemaVersion 1 contains no explanation or rationale field.

If explanations are needed, keep them structurally separate unless the engine schema is deliberately extended in a future version.

## Schema contract

Banks intended for the browser engine must use schemaVersion 1:

```javascript
window.ANY_BANK_NAME = {
  schemaVersion: 1,
  bankId: "unique-bank-id",
  bankVersion: "1.0.0",
  title: "Human-readable title",
  questions: [
    {
      id: "Q001",
      number: 1,
      domain: "domain-string",
      target: "Target text",
      stem: "Question text",
      options: {
        A: "Option A",
        B: "Option B",
        C: "Option C",
        D: "Option D"
      },
      answer: "A"
    }
  ]
};
```

Required bank fields are exactly:

- `schemaVersion`
- `bankId`
- `bankVersion`
- `title`
- `questions`

Required question fields are:

- `id`
- `number`
- `domain`
- `target`
- `stem`
- `options`
- `answer`

Validation requirements:

- `schemaVersion` must be `1`.
- `bankId`, `bankVersion`, and `title` must be non-empty strings.
- `questions` must be a non-empty array.
- Question IDs must be unique.
- `number` must be a positive integer.
- `domain` and `target` must be strings.
- `stem` must be non-empty.
- `options` must contain exactly A, B, C, and D, all non-empty.
- `answer` must be A, B, C, or D.

The JavaScript global property name is not part of the schema. The engine discovers it dynamically and uses it as runtime display metadata.

Examples:

```javascript
window.SECAI_QUESTION_BANK = { ... };
window.CYSA_QUESTION_BANK = { ... };
window.LINUX_NETWORKING_BANK = { ... };
```

All can use the same schemaVersion 1 structure.

## Naming conventions

Use descriptive filenames and stable bank IDs. A practical pattern is:

```text
test-banks/<subject>-<descriptor>-bank-v<major>.js
```

and:

```text
<subject>-<descriptor>-v<major>
```

Question IDs must remain stable if a bank is revised.

Recommended versioning:

- Patch: corrections that do not materially change item identity.
- Minor: additions or meaningful item revisions.
- Major: replacement bank or incompatible redesign.

## Validation before commit

Complete applicable checks before pushing:

1. Confirm the intended target/source material.
2. Confirm the new file does not unintentionally replace another bank.
3. Confirm all IDs are unique.
4. Confirm question numbers are valid and intentional.
5. Confirm every domain and target is populated as intended.
6. Confirm every stem is non-empty.
7. Confirm every item has exactly four non-empty options.
8. Confirm every answer is A, B, C, or D.
9. Confirm JavaScript syntax and object closure are valid.
10. Check exact duplicate stems when related banks exist.
11. Review likely near-duplicates when appropriate.
12. Review answer distribution and repeated-letter runs.
13. Review distractors for plausibility.
14. Review each answer key under a zero-trust standard.
15. Confirm restricted supplied content was not copied into public material.
16. Confirm the bank loads in the Training Engine without application-code changes.
17. Inspect the final diff and repository status.

## Quality status

Generated banks are working self-validation artifacts unless an authoritative review process says otherwise.

During use, record:

- disputed answers
- ambiguous stems
- weak distractors
- incorrect target mappings
- duplicate concepts
- missing coverage
- claims requiring source verification

Corrections should be evidence-based and versioned rather than silently edited.

## Default generation instruction

When asked to create a new independent bank without additional details:

- Read the authoritative target material and relevant existing banks.
- Create a new file under `test-banks/`.
- Use schemaVersion 1 unchanged.
- Choose a unique JavaScript global name.
- Represent intended topic/domain distribution through bank composition.
- Do not modify engine code.
- Validate the bank in the running engine before committing.
