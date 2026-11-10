# Local testing

Normal use: `https://ninja-neer.net/training-engine/`

For development or validation:

```powershell
git clone https://github.com/novovictus/training-engine.git
cd training-engine
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://localhost:8000/
```

The root redirects to `/practice-test/`.

## Runtime files

```text
practice-test/index.html
practice-test/styles.css
practice-test/questions.js
practice-test/bootstrap.js
practice-test/app.js
practice-test/page.js
```

User-selected banks are JSON-only schemaVersion 3 files.

## Browser origins

Progress is origin-scoped. These are separate storage environments:

```text
file://...
http://localhost:8000
https://ninja-neer.net
```

Use progress export/import to move state between origins or browser profiles. Direct `file://` launch may work but is not the supported development or persistent-use path.

## Validation baseline

Check:

- bundled fixture completes normally
- retained JSON bank imports through **Customize > Open JSON bank**
- exam and practice modes
- answer randomization
- progress export/import for the same `bankId`, including different bank versions
- schemaVersion 1 and 2 rejection, with v2 migration guidance
- AI Explanation first-use disclosure
- Copy Prompt copies the same review prompt without external handoff
- CSP behavior

The CSP is meta-delivered and restricts scripts/resources to the intended same-origin model. Meta CSP cannot enforce `frame-ancestors`; that requires an HTTP response header.

## Legacy path

`/training/` is retained only as a redirect to `/training-engine/`. The retired application is not served there. Current Training Engine code does not read or migrate retired `secai-plus-*` browser-local storage.

## Deterministic validation

Run from the repository root with Node.js (no dependencies):

```powershell
Get-ChildItem practice-test,scripts -Filter *.js | ForEach-Object { node --check $_.FullName; if ($LASTEXITCODE) { throw "Syntax check failed" } }
node scripts/validate-banks.js
node scripts/validate-iterative-banks.js
node scripts/validate-corrupt-progress-recovery.js
node scripts/validate-download-helper.js
git diff --check
```

The schema-neutral bank validator replaces the former v2 validator. Content digests, exact four-option/answer validation, reserved and duplicate IDs remain checked. Wording and answer-distribution findings require human review; they do not prove or disprove question quality. The iterative harness executes runtime functions in Node's VM with minimal DOM/storage stubs; it is not a browser test.

## Iterative bank browser smoke test

1. Serve on loopback as above and load a schema v3 bank. Complete three correct runs for selected questions; confirm mastery and exclusion from new runs. Exercise both Exam and Practice modes, randomization, and resume.
2. Export progress and a completed run (JSON/text), then leave a run unfinished.
3. Open an updated JSON bank with the same bankId, a new bankVersion, one unchanged question, one incremented revision, one removed ID, and one new ID. Confirm the unfinished-run notice, retained compatible mastery, reset revised question, and current-bank totals/eligibility.
4. Reload. Verify the active run remains discarded. Open **History > View run** and export the old run; check original stems, options, answers, bank version, and question revisions.
5. Repeat with only reordering or only bankVersion changed. Mastery must remain; a bankVersion change discards an unfinished run. Import the saved v3 progress into the updated bank and check the same reconciliation.
6. Try v2 JSON, duplicate IDs, and missing/zero/fractional revisions. Confirm clear rejection. Test malformed stored progress and unavailable/full localStorage in a disposable browser profile; verify recovery/persistence notices.
7. Check review filtering, full answers, Copy Prompt, and AI Explanation disclosure. Avoid sending private material externally during testing.
