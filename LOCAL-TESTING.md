# Local testing

Local execution is intended for development, modification, testing, and validation. Normal use should use the live GitHub Pages deployment.

## Normal use

Use the deployed GitHub Pages application:

```text
https://ninja-neer.net/training/
```

That entry point redirects to:

```text
https://ninja-neer.net/training/practice-test/
```

The hosted HTTPS application is the supported persistent-use environment and is intended to serve the live online audience.

No download, installation, account, backend, package manager, or local web server is required for normal use.

## Get a local copy

For development or validation, clone the repository:

```powershell
git clone https://github.com/novovictus/training.git
cd training
```

Alternatively, download the repository ZIP from GitHub and extract it.

After extracting the ZIP, open PowerShell or a terminal in the repository root.

No build process, backend, package manager, or application installation is required.

## Start the local application

From the repository root, start an ordinary static HTTP server.

For example, using Python:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

The root `index.html` redirects to:

```text
http://localhost:8000/practice-test/
```

You can also open the application path directly:

```text
http://localhost:8000/practice-test/
```

The local HTTP-hosted copy is the supported development and validation environment. It allows local code changes to be tested under an HTTP origin similar to the live GitHub Pages deployment without publishing those changes.

## Application files

The application files remain ordinary static files:

- `practice-test/index.html`
- `practice-test/styles.css`
- `practice-test/questions.js`
- `practice-test/app.js`

Bank loading is handled by `practice-test/index.html`; JavaScript files are inspected for exactly one compatible schemaVersion 1 bank global, while JSON files use a neutral filename-derived display identifier.

## Direct file launch

Opening `practice-test/index.html` directly from the repository or an extracted ZIP with a `file://` URL may still run the application, but it is not the supported persistent-use or development path.

Direct-file browser behavior can differ from HTTP/HTTPS behavior, particularly for:

- local-storage origin handling
- programmatic downloads
- persistence when files or directories move
- behavior across browsers and browser profiles

Use localhost when developing or validating local code changes.

Use the GitHub Pages deployment for normal persistent use.

## Progress and browser origins

Browser local storage belongs to the origin from which the application is opened.

These are separate storage environments:

```text
file://...
http://localhost:8000
https://ninja-neer.net
```

Progress does not automatically move between them.

Local storage is automatic working state, not a durable backup.

Use `Export progress` to create the portable recovery record and `Import progress` to restore it into another browser origin, browser profile, or environment.

For example, moving from a local development copy to the live hosted application requires exporting progress from the local environment and importing it into the hosted environment if that state needs to be preserved.

## Validated migration

The GitHub Pages migration was validated by:

1. Loading the hosted application over HTTPS.
2. Loading the terminology bank.
3. Importing progress created under the prior local environment.
4. Confirming the imported progress and mastery state.
5. Closing the hosted application.
6. Reopening it and confirming that the state remained preserved.
7. Performing an additional deployment smoke test in Firefox.

This establishes the hosted HTTPS deployment as the current normal-use baseline.
