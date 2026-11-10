# AI-assisted bank generation

Use [BANK-GENERATION.md](BANK-GENERATION.md) as the complete schema and quality contract. AI-generated content needs independent subject-matter and answer-key review before publication.

## Generation instructions

Provide the generator with the authorized scope and sources, then require:

- Strict portable JSON with exactly `schemaVersion: 3`, `bankId`, `bankVersion`, `title`, and `questions`.
- Each question has exactly `id`, `revision`, `domain`, `target`, `stem`, `options`, and `answer`.
- Explicit, unique, permanent non-empty IDs; never derive IDs from row position. Reserved IDs `__proto__`, `constructor`, and `prototype` are forbidden. No particular naming format is required.
- New questions start at integer revision 1 and receive new IDs. Existing IDs are never renumbered, reused for unrelated content, or changed merely because content is inserted, removed, or reordered.
- Exactly four non-empty canonical choices A–D and one defensible answer key A–D.
- Clear stems, plausible distractors, and no answer-length or grammatical giveaways. Review absolute/limiting words such as only, always, never, all, must, and immediately for unintended answer leakage.
- No restricted third-party questions or private source material in public repository output.

## Updating an existing bank

Supply the existing JSON and explicitly require preservation of every unchanged ID and revision. Keep the same revision for punctuation, spelling, formatting, and inconsequential wording cleanup. Increment only affected revisions for answer-key corrections, ambiguous distractor corrections, changed technical meaning, changed scenario logic or assessed concept, and significant stem/option rewrites that alter reasoning. Ask the generator for a separate change explanation; do not add unsupported fields to the bank JSON.

Keep bankId stable and increment bankVersion for publication. The engine reconciles mastery by question ID and revision; bankVersion alone does not reset it. Completed history stays historical. Different bank versions invalidate unfinished runs. These are author-declared rules, not content-hash or automatic semantic-version heuristics.

Review the diff for accidental renumbering or omitted revision increments. Validate schema, uniqueness, answer keys, content quality, wording, and answer distribution, then use the browser smoke steps in [LOCAL-TESTING.md](LOCAL-TESTING.md). Existing v2 banks require the explicit porting steps in [BANK-MIGRATION-V2-TO-V3.md](BANK-MIGRATION-V2-TO-V3.md); the runtime will not upgrade them.
