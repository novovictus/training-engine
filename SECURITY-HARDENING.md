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
- **Verification:** Node syntax checks passed for the application and inline scripts; `git diff --check` passed; static searches confirmed no `new Function` or `eval` remains under `practice-test`; an actual-source Node harness verified valid JSON import, malformed JSON rejection, `.js` rejection, and existing validator rejection of unsupported schema, missing metadata, and duplicate IDs.
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
- **Remediation:** The stale link points to `/training-engine/`. The legacy `/training/` GitHub Pages deployment has been manually unpublished and the archived `novovictus/training` repository re-archived. Current engine code now uses only Training Engine storage namespaces and no longer reads or migrates `secai-plus-*` progress, run-mode, or custom-bank keys. Legacy browser-local progress is intentionally unsupported; previously exported files are the archival route.
- **Verification:** Repository-wide searches confirmed no active `/training/` launch link or retired `secai-plus-*` storage identifier remains under `practice-test`. Actual-source storage fixtures verified canonical current progress reload, fresh-state initialization without fallback, current run-mode reload, and no legacy-key reads or writes. Node syntax checks for `app.js` and inline scripts plus `git diff --check` passed. Deployment unpublish and repository archival were manually confirmed by the maintainer.
- **Fix commit:** 7e55864 Remove retired engine storage compatibility

### F-04 - AI Explanation sends question content to an external service

- **Severity:** Medium
- **Status:** FIXED
- **Affected area:** AI Explanation feature
- **Finding:** The AI Explanation action sends the bank title, question stem, answer options, correct answer, selected answer, and related context to `chatgpt.com` through a query URL. Third-party bank text also becomes part of an LLM prompt.
- **Impact:** Question-bank content leaves the local application when the user invokes the feature. Third-party bank content can also influence the generated AI prompt.
- **Remediation:** First use per browser/profile now presents a cancellation-capable disclosure before any ChatGPT tab opens. Acceptance stores only `training-engine-ai-explanation-ack-v1`. The prompt clearly delimits bank/question text as untrusted source material and instructs ChatGPT not to treat embedded instructions as instructions.
- **Verification:** An actual-source Node harness verified first-use disclosure, Cancel preventing `window.open`, acceptance storing the acknowledgement and opening the encoded ChatGPT URL, subsequent acknowledged use skipping confirmation, expected prompt fields, untrusted-material delimiters/instruction, correct and incorrect answer guidance, and exclusion of notes. Node syntax checks for `app.js` and inline scripts plus `git diff --check` passed.
- **Fix commit:** 2ab18b9 Harden AI explanation data boundary

### F-05 - No strict Content Security Policy

- **Severity:** Medium
- **Status:** OPEN
- **Affected area:** `practice-test/index.html`, script loading model
- **Finding:** The page currently contains inline scripts, `new Function`, and `document.write`, preventing a strong restrictive CSP without unsafe allowances.
- **Impact:** The application lacks an additional browser-enforced mitigation layer against script injection and unexpected resource loading.
- **Planned remediation:** Remove executable custom banks, move inline scripts into external same-origin JavaScript files, eliminate `document.write`, then add a restrictive CSP. Candidate policy after refactor: `default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'`.
- **Verification:** TBD
- **Fix commit:** TBD

### F-06 - Local-storage quota exhaustion can break exam rendering

- **Severity:** Reliability
- **Status:** OPEN
- **Affected area:** `practice-test/app.js`, state persistence
- **Finding:** Completed attempts duplicate substantial question content, and `saveState()` does not handle storage-write failures. Because state is saved during normal question rendering and interaction, a quota error can interrupt application behavior.
- **Impact:** Users with enough stored history can encounter failed saves or broken exam rendering, potentially jeopardizing active progress.
- **Planned remediation:** Catch storage exceptions, preserve the active UI state, and present a visible warning instructing the user to export progress or clear history. Evaluate a later storage redesign that stores question IDs and run-specific answer/order state rather than duplicating full bank content in every attempt.
- **Verification:** TBD
- **Fix commit:** TBD

### F-07 - Corrupt stored progress can be silently replaced

- **Severity:** Reliability
- **Status:** OPEN
- **Affected area:** `practice-test/app.js`, stored-state loading
- **Finding:** Stored-state parsing and normalization failures currently fall back to defaults. A later successful save can overwrite the original invalid state.
- **Impact:** Corrupt or partially incompatible progress may appear as a silent reset and can be permanently replaced before the user has an opportunity to recover or inspect it.
- **Planned remediation:** Preserve the original raw value under a backup/recovery key before falling back. Surface a visible recovery warning. Consider requesting persistent browser storage with `navigator.storage.persist()` where supported.
- **Verification:** TBD
- **Fix commit:** TBD

### F-08 - Bank version changes orphan otherwise valid mastery data

- **Severity:** Reliability / Architecture
- **Status:** OPEN
- **Affected area:** Progress identity and bank-version contract
- **Finding:** Progress compatibility currently depends on both `bankId` and exact `bankVersion`. A patch-level correction to one item therefore invalidates progress for the whole bank even when most questions are unchanged.
- **Impact:** Routine corrections can unnecessarily orphan mastery and block import of prior progress.
- **Planned remediation:** Evaluate tracking per-question content identity, such as a stable question ID plus content hash, so mastery can carry forward for unchanged items while changed items are invalidated. This may be deferred if it materially expands the hardening branch beyond security and reliability fixes.
- **Verification:** TBD
- **Fix commit:** TBD

### F-09 - Unsafe question IDs used as plain-object keys

- **Severity:** Reliability / Security Hardening
- **Status:** OPEN
- **Affected area:** Bank validation and mastery storage
- **Finding:** Question IDs are used as ordinary object keys. Special property names such as `__proto__` or `constructor` can produce unexpected behavior when used with normal JavaScript objects.
- **Impact:** A malicious or malformed bank can corrupt per-question state structures or cause confusing runtime behavior.
- **Planned remediation:** Reject reserved/dangerous IDs during bank validation and/or migrate keyed state containers to `Map` or null-prototype objects.
- **Verification:** TBD
- **Fix commit:** TBD

### F-10 - Local test server binds beyond loopback

- **Severity:** Low
- **Status:** OPEN
- **Affected area:** Local testing documentation
- **Finding:** Documentation using `python -m http.server 8000` binds to all interfaces by default.
- **Impact:** A local test instance may be reachable from other systems on the same network when that exposure was not intended.
- **Planned remediation:** Update documentation to use `python -m http.server 8000 --bind 127.0.0.1` for local-only testing.
- **Verification:** TBD
- **Fix commit:** TBD

### F-11 - Object URL revoked immediately after download click

- **Severity:** Low
- **Status:** OPEN
- **Affected area:** `practice-test/app.js`, download helper
- **Finding:** The application revokes a generated object URL immediately after invoking `click()` on the download link.
- **Impact:** Some browsers may not complete the download reliably before the URL is revoked.
- **Planned remediation:** Defer `URL.revokeObjectURL()` until the browser has had an opportunity to begin the download, for example with `setTimeout(..., 0)` or a small delay.
- **Verification:** TBD
- **Fix commit:** TBD

### F-12 - Assessment-security limitations are not explicit enough

- **Severity:** Low / Documentation
- **Status:** OPEN
- **Affected area:** README and user-facing documentation
- **Finding:** Correct answers are distributed with the bank and exam mode is a client-side study workflow. It is not a proctored or tamper-resistant assessment system.
- **Impact:** The phrase "assessment engine" can be interpreted more strongly than the implementation warrants.
- **Planned remediation:** Clarify that the Training Engine is intended for self-study, diagnostics, and practice, not secure/proctored testing or credentialing.
- **Verification:** TBD
- **Fix commit:** TBD

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
3. F-09 - harden question IDs
4. F-04 - add AI Explanation outbound-data disclosure
5. F-07 - preserve corrupt state and surface recovery
6. F-06 - handle storage quota failures safely
7. F-11 - defer object URL revocation
8. F-10 - restrict documented local-server bind address
9. F-03 - verify and reduce shared-origin legacy exposure
10. F-05 - externalize scripts and add CSP after executable-bank removal
11. F-12 - clarify assessment/security scope in documentation
12. F-08 - implement or explicitly defer mastery migration across bank revisions

---

## Verification checklist

Before marking the hardening effort complete:

- [ ] A custom bank containing JavaScript cannot execute code through the import path.
- [ ] Valid JSON banks continue to load and pass normal schema validation.
- [ ] Malformed custom banks fail closed with a useful user-facing error.
- [ ] Crafted progress fields cannot inject HTML or script into the Progress view.
- [ ] Null, array, primitive, and malformed completed-attempt entries do not crash Progress rendering.
- [ ] Reserved question IDs are rejected or safely stored.
- [ ] AI Explanation shows the outbound-data disclosure before first external handoff.
- [ ] Storage quota failure produces a recoverable warning rather than breaking the run UI.
- [ ] Corrupt stored progress is preserved before fallback state is written.
- [ ] Downloads still complete after deferred object-URL cleanup.
- [ ] Local testing documentation binds the development server to loopback.
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
