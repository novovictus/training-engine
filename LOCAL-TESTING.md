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

User-selected banks are JSON-only schemaVersion 2 files.

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
- progress export/import for the same `bankId + bankVersion`
- schemaVersion 1 rejection
- AI Explanation first-use disclosure
- CSP behavior

The CSP is meta-delivered and restricts scripts/resources to the intended same-origin model. Meta CSP cannot enforce `frame-ancestors`; that requires an HTTP response header.

## Legacy path

`/training/` is retained only as a redirect to `/training-engine/`. The retired application is not served there. Current Training Engine code does not read or migrate retired `secai-plus-*` browser-local storage.
