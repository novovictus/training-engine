# Local testing

Local execution is intended for development, modification, testing, and validation. Normal use should use the live GitHub Pages deployment.

## Normal use

Use the deployed application:

```text
https://ninja-neer.net/training-engine/
```

The project root redirects to:

```text
https://ninja-neer.net/training-engine/practice-test/
```

The hosted HTTPS application is the supported persistent-use environment. No download, installation, account, backend, package manager, or local web server is required for normal use.

## Get a local copy

For development or validation:

```powershell
git clone https://github.com/novovictus/training-engine.git
cd training-engine
```

Alternatively, download the repository ZIP from GitHub and extract it.

No build process, backend, package manager, or application installation is required.

## Start the local application

From the repository root:

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

The localhost copy is the supported development and validation environment.

## Application files

The browser application remains ordinary static files:

- `practice-test/index.html`
- `practice-test/styles.css`
- `practice-test/questions.js`
- `practice-test/app.js`

Bank loading is handled by `practice-test/index.html`. Repository-controlled bundled banks may use JavaScript source files. User-selected custom banks are JSON-only, use the same schemaVersion 1 object directly, and receive a neutral filename-derived runtime display identifier.

## Direct file launch

Opening `practice-test/index.html` directly with a `file://` URL may still run the application, but it is not the supported persistent-use or development path.

Direct-file browser behavior can differ from HTTP/HTTPS behavior, particularly for:

- local-storage origin handling
- programmatic downloads
- persistence when files or directories move
- behavior across browsers and browser profiles

Use localhost for development and validation. Use the deployed HTTPS application for normal persistent use.

## Progress and browser origins

Browser local storage belongs to the origin from which the application is opened. These are separate storage environments:

```text
file://...
http://localhost:8000
https://ninja-neer.net
```

Progress does not automatically move between origins.

Use `Export progress` to create a portable recovery record and `Import progress` to restore it into another browser origin, browser profile, or environment.

## Current validation baseline

The generalized engine has been smoke-tested by:

1. Running the bundled generic fixture through a complete practice run.
2. Loading an unchanged historical SecAI JavaScript bank only through the repository-controlled bundled/source path.
3. Confirming dynamic JavaScript-global discovery and display.
4. Importing historical compatible progress.
5. Verifying the application operates from the GitHub Pages deployment.

Further browser validation should be driven by observed defects rather than broad rewrites.
