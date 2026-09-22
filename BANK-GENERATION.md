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

Bank size is determined by the creator and the intended assessment purpose.

The engine imposes no recommended bank size. It can run any configured subset up to the number of eligible questions in the bank.

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

SchemaVersion 2 contains no explanation or rationale field.

If explanations are needed, keep them structurally separate unless the engine schema is deliberately extended in a future version.

## Schema contract

Banks intended for the browser engine are strict JSON schemaVersion 2 files:

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

Required top-level fields are `schemaVersion`, `bankId`, `bankVersion`, `title`, and `questions`. Every question must contain exactly `id`, `domain`, `target`, `stem`, `options`, and `answer`. `question.number` is not part of schemaVersion 2.

Validation requirements:

- `schemaVersion` is exactly `2`.
- `bankId`, `bankVersion`, and `title` are non-empty strings.
- `questions` is a non-empty array with unique, non-empty IDs. The IDs `__proto__`, `constructor`, and `prototype` are reserved and invalid.
- `domain` and `target` are strings; `stem` is non-empty.
- `options` contains exactly non-empty A, B, C, and D strings.
- `answer` is exactly A, B, C, or D, supporting the intentional single-correct-answer model.

Portable/importable banks are JSON only. SchemaVersion 1 and JavaScript-global-name discovery are retired; the browser never executes a user-selected bank file. Repository-controlled bundled scripts are an internal loading detail, not a portable-bank format.

## Naming conventions

Use descriptive filenames and stable bank IDs. A practical pattern is:

```text
test-banks/<subject>-<descriptor>-bank-v<major>.json
```

and:

```text
<subject>-<descriptor>-v<major>
```

Question IDs must remain stable if a bank is revised. They must also be unique and non-empty; `__proto__`, `constructor`, and `prototype` are reserved invalid IDs.

## Progress compatibility and versioning

`bankId` identifies one logical bank lineage and must remain stable while that lineage continues. `bankVersion` is the bank developer's explicit persisted-progress compatibility boundary: increment it whenever a change should no longer share prior progress or history.

The bank developer decides whether a change is progress-compatible. Cosmetic or non-semantic changes, such as a typo correction or wording cleanup, may retain the current `bankVersion` when the developer intentionally considers existing progress compatible. An answer-key change, material semantic revision, or other persistence-relevant change should use a new `bankVersion` (or a new `bankId` for a new logical lineage).

The engine intentionally trusts the declared `bankId + bankVersion` contract. It does not compute content hashes or infer compatibility from changed bytes because a hash can detect a change but cannot determine whether prior progress remains meaningful. Changing persistence-relevant semantics without an appropriate `bankVersion` change is a bank-development/versioning defect.

Recommended release labels may use patch, minor, or major conventions, but the deciding rule is progress compatibility rather than the label alone.

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
9. Confirm strict JSON parsing succeeds.
10. Check exact duplicate stems when related banks exist.
11. Review likely near-duplicates when appropriate.
12. Review answer distribution and repeated-letter runs.
13. Review distractors for plausibility.
14. Review each answer key under a zero-trust standard.
15. Confirm restricted supplied content was not copied into public material.
16. Confirm the JSON bank imports in the Training Engine without application-code changes.
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
- Use the schemaVersion 2 JSON contract.
- Choose a stable unique bank ID.
- Represent intended topic/domain distribution through bank composition.
- Do not modify engine code.
- Validate the bank in the running engine before committing.


## Item-quality lessons from CySA+ focused-bank experiments

The CySA+ CS0-003 focused-bank experiments exposed an important distinction between **objective coverage** and **assessment quality**. A bank can cover the correct domains, terminology, tools, acronyms, and weighting while still be a poor diagnostic instrument.

### Failed experiments

**Focused v2: failed.** The bank overcorrected toward objective terminology and became a flash-card bank disguised as multiple choice. Too many items tested direct definitions, acronym expansion, or simple recognition. Distractors frequently came from unrelated conceptual categories, allowing the answer to be found through basic reading comprehension or elimination rather than subject-matter knowledge.

**Focused v3: failed.** Scenario framing improved, but the items still leaked their answers through construction. Correct choices were frequently longer, more qualified, and more technically complete than distractors. Distractors often contained giveaway qualifiers such as "only," "always," "never," "all," or similarly absolute wording. Other distractors were technically irrelevant to the scenario, creating category leakage. The result was still solvable through test-taking heuristics instead of analyst reasoning.

Both failed banks should remain recoverable through Git history as development evidence, but should not be treated as usable study banks.

### Required quality standard for future banks

Objective lists define **coverage**, not question form. Terms, acronyms, tools, frameworks, and other objective language should normally be embedded in realistic decisions or artifacts rather than converted directly into definition questions.

Every authored item should survive an adversarial item-writing review before inclusion:

- All answer choices should be comparable in length, specificity, grammatical structure, and level of technical detail. The correct answer must not consistently be the longest or most carefully qualified choice.
- Avoid giveaway absolutes and artificial disqualifiers such as "only," "always," "never," "all," or "immediately" unless the distinction genuinely depends on that wording and competing choices are equally plausible.
- Every distractor must be technically plausible for the scenario and represent a realistic misconception, adjacent concept, wrong sequencing decision, incomplete interpretation, or otherwise credible analyst error.
- Keep distractors within the same conceptual neighborhood. Do not contrast a valid incident-response action with unrelated technologies merely to fill answer slots.
- Do not repeat distinctive wording from the stem exclusively in the correct answer.
- Do not make the correct choice uniquely precise while leaving distractors vague.
- Prefer interpretation, correlation, prioritization, sequencing, scope, and BEST/FIRST/NEXT decisions over pure recall.
- Use realistic artifacts where useful: log fragments, event sequences, HTTP requests, email headers, process trees, packet summaries, vulnerability findings, scan results, timelines, and competing remediation constraints.
- When testing tools or similar concepts, require discrimination among credible alternatives. For example, distinguish Pacu, Prowler, and Scout Suite by task rather than asking what Pacu is.
- Direct acronym-expansion and definition questions should be exceptional, not the normal way to ensure terminology coverage.
- A knowledgeable test taker should not be able to answer reliably from answer length, grammar, absolutes, or generic exam-taking heuristics.
- Randomizing displayed answer order does not correct semantic answer leakage. Item quality must stand independently of option order.

### Development strategy

Bank creators should validate not only whether answers are correct, but **how** answers are reached. A high score is not itself evidence of a bad bank, but a high score obtained through wording cues, implausible distractors, or generic reading comprehension is a failure.

A useful miss should expose a real knowledge distinction. During the v3 test, an unfamiliar SSRF scenario produced such a signal; that is the kind of diagnostic value future questions should seek. The goal is not artificial difficulty or obscurity. The goal is to make subject-matter understanding, rather than item-writing artifacts, determine the answer.

Creators may use pilots, staged expansion, full-bank generation, or another workflow appropriate to the assessment. The contract does not prescribe a bank size or development sequence.
