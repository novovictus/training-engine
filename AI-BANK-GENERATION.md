# AI Question Bank Generation Guide

This document is the starting point for an AI system asked to create, expand, revise, or validate a question bank for Training Engine.

The normative bank schema and item-quality requirements are defined in `BANK-GENERATION.md`. Read that document before generating or modifying a bank. Only schemaVersion 3 is supported. V2 banks must be explicitly migrated using `BANK-MIGRATION-V2-TO-V3.md`; neither banks nor v2 progress are upgraded automatically.

## 1. Identify the target assessment

Determine the exact assessment being requested, including the vendor, certification or course name, and exam/version identifier when applicable.

Examples:

- CompTIA CySA+ CS0-003
- CompTIA A+ Core 2 220-1202
- an internal Linux administration assessment
- a vendor-neutral custom course

Do not assume that objectives from another exam version are interchangeable.

## 2. Locate the authoritative objectives

Before generating questions for a published certification or examination, locate the current authoritative exam objectives, blueprint, syllabus, or equivalent source published by the assessment owner.

Prefer first-party sources.

Use the authoritative material to determine:

- domains
- sub-objectives
- terminology
- technologies and tools
- expected tasks and competencies
- published domain weighting, when provided
- exclusions or scope boundaries

Record which objective version the bank targets.

If authoritative objectives cannot be located or their version cannot be established, do not silently substitute remembered or third-party objectives. State the limitation before generating the bank.

## 3. Determine bank composition

Training Engine does not impose a bank size and does not perform domain weighting.

The bank creator determines:

- total question count
- breadth and depth of coverage
- whether every objective must appear
- how many questions represent each domain or target
- whether published exam weighting should be reflected

When a published examination provides domain percentages and the creator wants the bank to model that distribution, translate those percentages into question counts across the chosen bank size.

Do not invent weighting when the authoritative source does not provide it.

## 4. Build a coverage plan before writing questions

Create an internal coverage map from the authoritative objectives before composing items.

For each planned question, identify:

- domain
- target or sub-objective
- competency being tested
- intended reasoning task
- concepts, tools, terminology, or artifacts involved

Avoid satisfying coverage merely by converting objective bullets into definition questions.

Objective coverage defines what should be tested. It does not determine the form of the question.

## 5. Generate assessment items

Follow `BANK-GENERATION.md`.

Every question must contain exactly `id`, `revision`, `domain`, `target`, `stem`, `options`, and `answer`. Author an explicit, permanent, non-empty, unique `id` and an integer `revision >= 1`. IDs must never be generated from row position or renumbered when questions are added, removed, or reordered. New questions receive new IDs and start at revision 1. Do not reuse retired IDs for unrelated questions. The reserved IDs `__proto__`, `constructor`, and `prototype` are forbidden; no other naming convention is enforced.

Options must contain exactly four non-empty strings A-D, with one canonical answer key A-D.

Questions should normally require subject-matter reasoning through realistic scenarios, evidence, tool selection, interpretation, prioritization, sequencing, or remediation decisions.

Use terminology from the objectives in context.

Distractors should be plausible alternatives from the same conceptual neighborhood. They should represent realistic mistakes, incomplete interpretations, incorrect sequencing, or adjacent technologies.

Do not make the correct answer identifiable through:

- greater length
- greater precision
- better grammar
- copied wording from the stem
- artificial qualifiers
- obviously unrelated distractors

Random answer-order display in the engine does not correct weak item construction.

## 6. Validate the answer key independently

Treat every generated answer key as untrusted until reviewed.

For every item:

1. Solve the question from the subject matter without relying on the proposed key.
2. Verify that the keyed answer is correct.
3. Verify that no other option is equally defensible under the facts given.
4. Verify that the correct answer is actually present among the choices.
5. Verify that each distractor is incorrect for a specific technical reason.
6. Identify ambiguous assumptions or missing facts.
7. Revise or remove defective items.

Pay particular attention to tool-selection questions. Similar tools often overlap in capability, so the stem must contain enough context to establish one best answer.

A bank must not assume that the originally generated key is correct merely because it was generated with the question.

## 7. Validate the bank as a whole

Before finalizing:

- validate strict schemaVersion 3 JSON
- confirm explicit, unique, stable, valid IDs and integer revisions >= 1
- compare unchanged questions against the previous bank to ensure their IDs/revisions were preserved
- confirm domain and target mappings
- check objective coverage
- check intended domain distribution
- check duplicate and near-duplicate questions
- inspect answer-letter distribution for suspicious patterns
- inspect answer length and specificity for leakage
- review high-risk qualifiers
- verify all answer keys
- confirm the bank loads successfully in Training Engine

Use repository validation tooling when available. Before finalizing or returning a generated bank, run:

```text
node scripts/validate-banks.js <path-to-bank.json>
```

Correct every reported error before returning the bank. If execution tools are unavailable, apply the same schema checks manually and do not claim the script was run.

## 8. Output

Portable banks must conform exactly to the schema in `BANK-GENERATION.md`.

Use JSON only.

Do not add commentary, explanations, citations, rationale fields, source fields, question numbers, or other properties to the bank unless the schema is deliberately changed.

Supporting research, coverage analysis, and validation notes should remain outside the portable bank file.

## 9. Revision of an existing bank

When revising an existing bank:

- preserve `bankId` when it remains the same logical bank lineage
- preserve unchanged question IDs and revisions; IDs express identity, not display order
- keep the revision for spelling, punctuation, formatting, and inconsequential wording cleanup
- increment the affected question's revision for material changes: answer-key corrections, ambiguous distractor corrections, changed technical meaning, scenario logic or assessed concept, and significant stem/option rewrites that alter reasoning
- increment `bankVersion` for a publication revision; it identifies the published bank but does not reset compatible mastery
- determine mastery compatibility by question ID plus revision; same ID/revision retains mastery, changed revision resets only that question, and removed questions leave current eligibility/totals without deleting historical attempts
- preserve completed history as snapshots; a bankVersion change safely discards an unfinished run with a notice
- migrate unsupported v2 banks explicitly using `BANK-MIGRATION-V2-TO-V3.md`; do not create a runtime compatibility shim
- do not silently overwrite a historical bank unless replacement is explicitly intended
- validate the revised bank from scratch rather than trusting prior answer keys

## 10. Relationship to repository documentation

Read these files as applicable:

- `README.md` - engine overview
- `BANK-GENERATION.md` - normative schema and item-quality contract
- `BANK-MIGRATION-V2-TO-V3.md` - stable identity, revisions, and v2 porting
- `test-banks/README.md` - current retained banks
- `LOCAL-TESTING.md` - local loading and validation
- `practice-test/README.md` - runtime behavior

When repository documentation and assumptions conflict, use the current repository documentation.
