# Training Engine Security Hardening Findings

## Purpose

This document records security, reliability, and trust-boundary findings identified during review of the Training Engine. Findings remain in this file after remediation so the repository retains an auditable record of what was identified, how it was addressed, and how the fix was verified.

Statuses:

- `OPEN` - confirmed or credible finding not yet remediated
- `IN PROGRESS` - remediation work has started
- `FIXED` - remediation completed and verified
- `DEFERRED` - accepted for later architectural work with rationale documented
- `NOT APPLICABLE` - finding was investigated and determined not to apply

Do not mark a finding `FIXED` until the remediation has been tested or otherwise verified.

---

## Findings

### F-01 - Executable user-loaded JavaScript banks

- **Severity:** High
- **Status:** FIXED
- **Affected area:** `practice-test/index.html`, custom bank loader
- **Finding:** User-selected `.js` bank files are evaluated with `new Function('window', text)(isolatedWindow)`. Shadowing the `window` identifier does not provide a security sandbox. Loaded code can still reach browser globals such as `globalThis`, `document`, `localStorage`, and `fetch` and therefore executes with the page's origin privileges.
- **Impact:** A malicious, compromised, or incorrectly generated bank can read or modify origin-scoped state, alter the application, and potentially exfiltrate data available to the origin.
- **Remediation:** The custom-bank picker and parser now accept only `.json` data files. User-selected `.js` files fail before parsing, and the custom-bank path contains no `new Function`, `eval`, script injection, iframe execution, or equivalent fallback. Repository-controlled bundled JavaScript sources remain separate from the external import boundary.
- **Verification:** Node syntax checks passed for the application and inline scripts; `git diff --check` passed; static searches confirmed no `new Function` or `eval` remains under `practice-test`; an actual-source Node harness verified valid JSON import, malformed JSON rejection, `.js` rejection, and existing validator rejection of unsupported schema, missing metadata, and duplicate IDs. Localhost browser validation after clearing stale Chrome profile state confirmed JSON-bank import, schemaVersion 1 rejection, and malformed-JSON rejection in Edge, Firefox, Chrome Incognito, and cleared Chrome.
- **Fix commit:** b4d54c8 Harden custom bank import boundary

### F-02 - Stored XSS through imported progress data

- **Severity:** Medium
- **Status:** FIXED
- **Affected area:** `practice-test/app.js`, completed-attempt sanitization and progress rendering
- **Finding:** Completed-attempt import currently preserves untrusted fields beyond a narrow subset, while progress rendering interpolates values such as attempt totals and percentages into `innerHTML`.
- **Impact:** A crafted progress file can persist attacker-controlled markup in local storage and execute it when the Progress view is rendered. Invalid or non-object entries can also destabilize rendering.
- **Remediation:** Completed attempts and items are reconstructed from explicit allowlists with numeric coercion/defaults, safe string and option handling, normalized booleans, and sanitized run modes. Invalid attempts or items are dropped. Progress history now uses DOM creation and `textContent` for all attempt values.
- **Verification:** Node syntax checks passed for `app.js` and inline scripts; `git diff --check` passed; an actual-source Node harness verified preservation of a valid existing-style attempt, normalization of hostile HTML/script payloads in `total` and `percent`, omission of arbitrary fields, and deterministic dropping of null, primitive, and malformed item entries. Static inspection confirms `renderProgress()` inserts imported attempt values only through `textContent`.
- **Fix commit:** cfe641d Harden imported progress normalization

### F-03 - Shared-origin exposure with legacy application

- **Severity:** Medium
- **Status:** FIXED
- **Affected area:** Hosting layout, storage namespace, legacy links
- **Finding:** Browser storage is scoped by origin, not path. If a legacy application and this engine are deployed on the same origin, an XSS in either can access origin-scoped storage belonging to the other. A stale current-engine link to `/training/` was also present in the repository.
- **Impact:** An XSS or arbitrary-code issue in any same-origin application can potentially access Training Engine data stored on that origin.
- **Remediation:** The stale link points to `/training-engine/`. The historical `/training/` URL is intentionally retained by a redirect-only `pages-redirect` branch, which GitHub Pages publishes and which redirects to `/training-engine/`. The former application source is preserved under `archive/` on the non-published `main` branch; Pages publishes only the redirect branch, so that archived tree is not web-accessible through GitHub Pages. Current engine code now uses only Training Engine storage namespaces and no longer reads or migrates `secai-plus-*` progress, run-mode, or custom-bank keys. Legacy browser-local progress is intentionally unsupported; previously exported files are the archival route.
- **Verification:** Repository-wide searches confirmed no active `/training/` launch link or retired `secai-plus-*` storage identifier remains under `practice-test`. Actual-source storage fixtures verified canonical current progress reload, fresh-state initialization without fallback, current run-mode reload, and no legacy-key reads or writes. Node syntax checks for `app.js` and inline scripts plus `git diff --check` passed. The maintainer manually verified the redirect-only Pages deployment and that direct archive-path access no longer serves the former application; the legacy repository is being re-archived after this cleanup.
- **Fix commit:** 7e55864 Remove retired engine storage compatibility

### F-04 - AI Explanation sends question content to an external service

- **Severity:** Medium
- **Status:** FIXED
- **Affected area:** AI Explanation feature
- **Finding:** The AI Explanation action sends the bank title, question stem, answer options, correct answer, selected answer, and related context to `chatgpt.com` through a query URL. Third-party bank text also becomes part of an LLM prompt.
- **Impact:** Question-bank content leaves the local application when the user invokes the feature. Third-party bank content can also influence the generated AI prompt.
- **Remediation:** First use per browser/profile now presents a cancellation-capable disclosure before any ChatGPT tab opens. Acceptance stores only `training-engine-ai-explanation-ack-v1`. The prompt clearly delimits bank/question text as untrusted source material and instructs ChatGPT not to treat embedded instructions as instructions.
- **Verification:** An actual-source Node harness verified first-use disclosure, Cancel preventing `window.open`, acceptance storing the acknowledgement and opening the encoded ChatGPT URL, subsequent acknowledged use skipping confirmation, expected prompt fields, untrusted-material delimiters/instruction, correct and incorrect answer guidance, and exclusion of notes. Localhost browser validation confirmed the AI Explanation flow after clearing stale Chrome profile state. Node syntax checks for `app.js` and inline scripts plus `git diff --check` passed.
- **Fix commit:** 2ab18b9 Harden AI explanation data boundary

### F-05 - No strict Content Security Policy

- **Severity:** Medium
- **Status:** FIXED
- **Affected area:** `practice-test/index.html`, script loading model
- **Finding:** The page previously contained inline scripts and `document.write` bundled-bank loading, preventing a strong restrictive CSP without unsafe allowances.
- **Impact:** The application lacks an additional browser-enforced mitigation layer against script injection and unexpected resource loading.
- **Remediation:** Runtime logic is externalized into same-origin `bootstrap.js` and `page.js`; the repository-controlled bundled bank loads with a normal static `questions.js` script tag. The page uses a meta-delivered CSP: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'`. It contains no `unsafe-inline` or `unsafe-eval`. Meta CSP cannot enforce `frame-ancestors`; header-level protections require hosting configuration.
- **Verification:** Node syntax checks passed for `bootstrap.js`, `app.js`, `page.js`, and `questions.js`; static searches confirmed no inline executable scripts, `document.write`, `new Function`, or `eval` remains in active practice-test code; the CSP lists only same-origin script/style/connect sources and no unsafe directives; script order preserves bundled bank, bootstrap, engine, then page behavior. Localhost browser validation confirmed the bundled schemaVersion 2 bank starts normally and CSP blocks both `eval()` (no `unsafe-eval`) and external script injection under `script-src 'self'`. `git diff --check` passed.
- **Fix commit:** 6981ad4 Harden Training Engine with CSP

### F-06 - Local-storage quota exhaustion can break exam rendering

- **Severity:** Reliability
- **Status:** FIXED
- **Affected area:** `practice-test/app.js`, `practice-test/bootstrap.js`, state persistence
- **Finding:** Browser storage writes and removal can throw (including quota exhaustion under unusually large histories or other storage exceptions). Previously, state persistence occurred during normal rendering and interaction without failure handling, allowing an exception to interrupt the run.
- **Measured footprint:** Representative completed attempts serialize to approximately 1.9 KB (4 questions), 25.9 KB (60 questions), and 43.0 KB (100 questions). Ten 100-question runs serialize to approximately 0.41 MB. About 27 KB of a 100-question run is duplicated historical question snapshot data.
- **Remediation:** Retained completed-attempt snapshots because the measured near-term footprint does not justify weakening historical review fidelity. Guarded current-engine state, run-mode, custom-bank-selection, bundled-bank-selection, and reset storage operations. Failed writes leave the session in memory, show one non-modal persistence warning, and retry on later saves; identical state is skipped only after a prior successful write. The warning remains visible until a successful state save recovers persistence.
- **Verification:** A local Node harness simulated `localStorage.setItem()` failures and confirmed no thrown interaction failure, one visible warning across repeated failures, in-memory state retention, later successful save/recovery, successful serialized-state reload, and no duplicate write for unchanged successfully persisted state. It also confirmed custom-bank and bundled-bank selection failures do not reload the page. Node syntax checks passed for `app.js`, `bootstrap.js`, and `page.js`; `git diff --check` passed. No browser UI session was run.
- **Fix commit:** 2f6057c Harden persistence failure handling

### F-07 - Corrupt stored progress can be silently replaced

- **Severity:** Reliability
- **Status:** FIXED
- **Affected area:** `practice-test/app.js`, per-bank progress-state loading
- **Finding:** A raw main progress value that could not be parsed, normalized, or matched to the loaded bank identity previously fell back silently to defaults. A later successful save could overwrite that raw value.
- **Impact:** Corrupt or structurally unsafe progress could appear as a reset and lose the only local recovery/diagnostic evidence.
- **Remediation:** Before a safe default state is used, the engine preserves the exact raw progress value under `training-engine-corrupt-progress-v1:<bankId>:<bankVersion>`. It never overwrites an existing backup. The active state can later be saved normally without removing that recovery copy. A one-time non-modal warning reports the safe fallback and whether the raw copy was preserved. Absent keys are not treated as corruption. This applies only to the main progress record: run mode and AI acknowledgement are scalars, and an invalid stored custom-bank record falls back to bundled without automatic replacement.
- **Normalization boundary:** Root records that parse but fail the required state structure or bank identity checks are preserved as corrupt. Structurally valid root records continue through existing safe reconstruction; for example, malformed nested completed attempts are dropped by F-02 normalization rather than treated as root corruption.
- **Persistent storage decision:** `navigator.storage.persist()` was intentionally not added. Persistent storage can protect a browser storage bucket from user-agent eviction after permission, but it does not preserve, parse, or repair a malformed raw value; it does not address this F-07 failure mode. F-06 continues to contain quota/write exceptions.
- **Verification:** `scripts/validate-corrupt-progress-recovery.js` exercises no stored state, valid stored state, malformed JSON, parseable root-structural invalidity, safe nested-attempt normalization, pre-existing backup retention, backup-write failure containment, one-warning behavior, later active-state overwrite without backup deletion, and the existing F-06 guarded-write helper. It passed alongside `scripts/validate-banks-v2.js`, Node syntax checks, and `git diff --check`.
- **Fix commit:** 031cc8b Preserve corrupt persisted state

### F-08 - Bank version changes orphan otherwise valid mastery data

- **Severity:** Reliability / Architecture
- **Status:** FIXED
- **Affected area:** Progress identity and bank-version contract
- **Finding:** Progress identity uses the exact `bankId + bankVersion` pair. The engine cannot infer whether a changed bank should share prior progress or history.
- **Disposition:** No engine code change is required. `bankId` remains stable for one logical bank lineage; `bankVersion` is the bank developer's explicit compatibility boundary. Developers must increment `bankVersion` whenever a change should no longer share prior progress/history, while intentionally compatible cosmetic or non-semantic changes may retain it. Changing persistence-relevant semantics without an appropriate `bankVersion` change is a bank-development/versioning defect.
- **Content-hash decision:** Runtime content hashing was considered and rejected as over-prescriptive. A hash can detect changed bytes but cannot determine author intent or whether earlier progress remains meaningful, so it cannot define the needed compatibility boundary. The engine intentionally trusts the declared `bankId + bankVersion` contract and does not add migration or compatibility heuristics.
- **Verification:** Confirmed the persistence key and import validation use `bankId + bankVersion`; updated the bank-development and user documentation to state the author-declared compatibility rule; searched active documentation for content-hash requirements and automatic compatibility claims.
- **Fix commit:** 4a3ed71 Define bank versioning contract

### F-09 - Unsafe question IDs used as plain-object keys

- **Severity:** Reliability / Security Hardening
- **Status:** FIXED
- **Affected area:** Bank validation and mastery storage
- **Finding:** Question IDs are used as ordinary object keys. The exact prototype-related IDs `__proto__`, `constructor`, and `prototype` must not enter runtime bank data.
- **Remediation:** Both the bootstrap validator and the application bank normalizer reject those three reserved IDs at the bank-validation boundary; duplicate-ID validation remains unchanged. Imported JSON is normalized by the application validator before selection, repository-controlled bundled banks pass bootstrap and application validation, and the discovery fallback also uses the application validator. No state-container redesign was needed.
- **Verification:** Extended `scripts/validate-banks-v2.js` to verify `Q001` acceptance and rejection of all three reserved IDs plus duplicate IDs through both actual validators. The harness also validated the bundled schemaVersion 2 fixture and all five retained JSON banks. Node syntax checks passed for modified JavaScript, and `git diff --check` passed.
- **Fix commit:** 1124670 Reject reserved question IDs

### F-10 - Local test server binds beyond loopback

- **Severity:** Low
- **Status:** FIXED
- **Affected area:** Local testing documentation
- **Finding:** An unbound Python simple HTTP server can listen on network interfaces beyond the local machine.
- **Remediation:** `LOCAL-TESTING.md` now uses `python -m http.server 8000 --bind 127.0.0.1` and states that the loopback-only server is for local development and testing only. Runtime code was not changed.
- **Verification:** Searched active Markdown documentation and confirmed no unbound `python -m http.server 8000` example remains; confirmed the loopback command and local-only clarification are present. `git diff --check` passed.
- **Fix commit:** b702053 Bind local test server to loopback

### F-11 - Object URL revoked immediately after download click

- **Severity:** Low
- **Status:** FIXED
- **Affected area:** `practice-test/app.js`, download helper
- **Finding:** Synchronously revoking a generated object URL immediately after the download-link click can race browser download handling.
- **Remediation:** `downloadFile()` preserves existing blob, MIME type, filename, and anchor-click behavior, then defers its single `URL.revokeObjectURL(url)` call with `setTimeout(..., 0)`.
- **Verification:** `scripts/validate-download-helper.js` executes the actual helper in a deterministic VM and confirms blob/MIME and filename preservation plus the order `createObjectURL -> click -> deferred single revokeObjectURL`. Existing completed-run JSON/text and progress exports still call the shared helper. Node syntax checks and `git diff --check` passed.
- **Fix commit:** c0092f8 Defer download URL revocation

### F-12 - Assessment-security limitations are not explicit enough

- **Severity:** Low / Documentation
- **Status:** FIXED
- **Affected area:** README and user-facing documentation
- **Finding:** The client-side engine distributes question banks and answer keys to the browser and provides exam/practice workflows; it is not a proctored or tamper-resistant assessment system.
- **Remediation:** The main and runtime READMEs now state that Training Engine is a client-side study and practice tool; answer keys are intentionally available locally for scoring, review, mastery tracking, and offline-friendly operation; and exam/practice modes are workflow/UI modes rather than security boundaries. They also state that the engine must not be used where answer secrecy, proctoring, or high-assurance controls are required. No runtime code or UI warnings were added.
- **Verification:** Reviewed active user-facing Markdown for claims of secure, proctored, or tamper-resistant assessment and found none. Confirmed both READMEs contain the explicit scope clarification. `git diff --check` passed.
- **Fix commit:** 3c5a63d Clarify Training Engine assessment scope

---

## Positive review observations

The review also identified areas that were already sound or substantially safer than the findings above. Preserve these properties during hardening:

- Most render paths already escape untrusted text or use `textContent`.
- Answer-option order is validated before use.
- Imported progress is checked against the loaded bank identity.
- Download filenames are sanitized.
- The bundled banks examined during the review did not show malicious executable behavior; flagged tokens were question content rather than active code.

---

## Remediation order

Recommended implementation order:

1. F-01 - remove executable custom-bank loading
2. F-02 - fix progress-import stored XSS and invalid-attempt handling
3. F-09 - closed by reserved question-ID validation
4. F-04 - add AI Explanation outbound-data disclosure
5. F-07 - preserve corrupt state and surface recovery
6. F-06 - handle storage quota failures safely
7. F-11 - closed by deferred object-URL revocation
8. F-10 - closed by loopback-only local-server documentation
9. F-03 - verify and reduce shared-origin legacy exposure
10. F-05 - externalize scripts and add CSP after executable-bank removal
11. F-12 - closed by assessment-scope documentation
12. F-08 - closed through the author-declared bank versioning contract

---

## Verification checklist

Before marking the hardening effort complete:

- [ ] A custom bank containing JavaScript cannot execute code through the import path.
- [ ] Valid JSON banks continue to load and pass normal schema validation.
- [ ] Malformed custom banks fail closed with a useful user-facing error.
- [ ] Crafted progress fields cannot inject HTML or script into the Progress view.
- [ ] Null, array, primitive, and malformed completed-attempt entries do not crash Progress rendering.
- [x] Reserved question IDs are rejected at bank validation.
- [ ] AI Explanation shows the outbound-data disclosure before first external handoff.
- [x] Storage quota failure produces a recoverable warning rather than breaking the run UI.
- [x] Corrupt stored progress is preserved before fallback state is written.
- [x] Download helper defers its single object-URL cleanup after click.
- [x] Local testing documentation binds the development server to loopback.
- [ ] Legacy hosted routes and stale links have been verified and documented.
- [ ] A strict CSP is enabled after inline/eval-dependent code is removed, or the remaining blocker is explicitly documented.
- [ ] Existing exam mode, practice mode, resume, mastery, notes, import/export, randomized answers, and AI Explanation behavior have regression coverage or manual test evidence.
- [ ] Every `FIXED` finding above includes verification notes and the fixing commit.

---

## Hardening log

Use this section for chronological notes during remediation.

### YYYY-MM-DD

- Branch created: `hardening/import-boundary`
- Baseline findings recorded before code changes.
- Changes:
  - TBD
- Verification:
  - TBD
- Commits:
  - TBD
