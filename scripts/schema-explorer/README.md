# Schema explorer

Generates an interactive page per API version (`beta-1`, `beta-2`, …) that draws each request and response body as a block diagram. Every `$ref` fragment is resolved, `oneOf` / `anyOf` / `if`-`then`-`else` become readable rules, and the page shows where each shared fragment under `common/` is reused. A switcher in the sidebar moves between versions, staying on the same endpoint where it exists.

Every endpoint and fragment page also has a **Try it** view: an editor, pre-filled from the schema's examples, that checks the JSON as you type. It uses the API's own compiled schemas (the same ajv, options and formats as `src/schemas/validate/index.js`) and reduces the errors the way `src/schemas/validate/hapi-validator.js` does. So a request body gets the same `errorType`, `pointer` and `message` list the API's 400 response gives for its schema. **Only the schema is checked**: not the checks a route runs after it (`withPayloadChecks`), such as EWC and POP codes against the reference data, the consignment note rule for hazardous waste, and date-times not being empty or in the future. The API may still reject a body that's valid here, and Try it says so under its result. Each error links to its place in the editor and in the diagram. Only the body is checked, not headers, path IDs or checks against stored data. Edits are kept in the viewer's browser.

Try it's code (the compiled validators and error handling, over half of a version's code) is a separate `try-it.js` beside each page, loaded the first time Try it is opened or pointed at, so the diagrams don't wait for it.

### Legacy (Joi) routes

`--legacy` (on in the published build) adds a **legacy** version (shown as **ReceiptOfWaste**; see `labels.js`), listed after the beta versions (newest first), for the routes that still validate with Joi: receive a movement (`POST`/`PUT /movements/{wasteTrackingId}/receive`) and bulk receive (`POST`/`PUT /bulk/{bulkId}/movements/receive`). `legacy/schemas.js` finds them by importing the backend's route modules: every non-beta route whose path ends in `/receive` and whose payload is a Joi schema. There are no JSON Schema files for these, so `legacy/joi-model.js` reads each Joi schema's own description (`schema.describe()`) into the same model: fields and limits, `.when()` conditions, `xor`/`or`/`with`/`without` rules, alternatives, and `.custom()` checks (named where Joi has a description, with the messages they can report; their logic is code, so it isn't shown). A nested schema matching one of the Joi schemas `@defra/waste-movement-utils` exports from `src/schemas/` is shown as that shared fragment.

Its **Try it** runs the routes' real Joi schemas in the browser: `legacy/check.js` validates as the routes do (Joi with `abortEarly` off, then the API's own `validationErrorFormatter`, and per-item errors for bulk routes), and `legacy/bundle.js` bundles it with esbuild. Errors therefore come back in the legacy API's format, `{ key, errorType, message }`. The examples come from the utils package's own valid test payload.

The beta versions are generated from the schemas synced to `docs/event-model/schemas/` (`npm run schemas:sync`), the same files the API spec pages are bundled from, so the two can't disagree. Each version's `openapi.json` gives its top-level schemas: the request and response bodies of its routes, by their `$ref` to a schema file (a body defined inline in the spec, such as problem details, isn't one). Everything they reference is a shared fragment. Each top-level schema's page is named after its file, e.g. `beta-2/index.html#create-movement-request`.

## Build it locally

From the root of this repo:

```sh
npm run schema-explorer:build
open docs/schema-explorer/index.html    # opens the latest version
```

`scripts/build-schema-explorer.sh` builds the beta versions from `docs/event-model/schemas/` as it is; run `npm run schemas:sync` first to update it. It clones `waste-movement-backend` (`main` by default) for what can't come from the schema files: the legacy page, built from its Joi schemas; the test that the explorer reports the same errors as the API (`errors.test.js`); and the examples taken from its schema tests (`test-examples/`). It copies this folder into the clone's `scripts/`, installs dependencies, runs the tests and builds the beta versions from `docs/event-model/schemas/`. The code here imports the backend's `src/` and `node_modules`, so it and its tests only run inside a backend checkout. Paths such as `src/schemas/` in this README are the backend's.

- `SCHEMA_SOURCE_REF=<branch, tag or SHA>` clones another backend commit.
- `SCHEMA_SOURCE_REPO` clones from somewhere else, e.g. a local checkout (committed changes only).
- `-- --skip-tests` builds when the tests fail.

It writes, under `docs/schema-explorer/`:

```
index.html                  sends visitors to the latest version, keeping any #link
beta-N/index.html           each version's diagrams
beta-N/try-it.js            each version's Try it, loaded when it's opened
legacy/index.html           the ReceiptOfWaste (legacy) routes
legacy/try-it.js
```

## Publishing

`.github/workflows/schema-explorer.yml` builds it. `docs-preview.yml` and `docs-release.yml` call it, and put it in the version they deploy under `schema-explorer/`, e.g. `/preview/schema-explorer/`. CI builds the beta versions from the schemas committed at the ref it deploys, the snapshot the deploy bundles the API spec pages from, and clones the backend's `main` for the rest; a build is reused from the cache until the schemas, the backend commit or the code here changes. A new `beta-N` folder, or a new route in a version's `openapi.json`, is picked up with no changes here.

When a backend change makes the tests fail, update the code here to match.

## Files

- `build.js` is the command line: it finds the versions and writes each one's page.
- `model.js` reads one version's schemas and normalises them into the tree the page uses.
- `template.html` holds the page's styles and script. The generator replaces `__MODEL__` with the data.
- `validators.js` compiles a version's schemas into standalone validation code for **Try it**. Keep its ajv options in step with `src/schemas/validate/index.js`.
- `errors.js` turns ajv's errors into the error list **Try it** shows (type, pointer, message), following `src/schemas/validate/hapi-validator.js`. The generator inlines it into each page.
- `errors.test.js` checks the explorer reports exactly what the API would, for every schema in every version: each example as written, then with each field removed, emptied, given the wrong type or an unknown value, and with extra fields. It fails if `validators.js` or `errors.js` drift from `src/schemas/validate/`. Every build runs it.
- `test-examples/` takes examples from the backend's own schema tests (`src/schemas/beta-*`): `run.js` runs them in a process of its own, with a stand-in for Jest's globals and `hooks.js` wrapping the API's `validate()`, and records every payload it accepts. A fragment offers them after its own examples, and a top-level schema with no `.examples.json` gets them in its place. Each schema keeps the first value from each test, up to 12, so a table-driven test doesn't add hundreds. A fragment that still has none gets its part of a top-level example, if that part is valid on its own. If the tests can't be run, the build carries on without their examples and warns.
- `labels.js` holds the names shown in place of the backend's: the legacy version's, and each top-level schema's, which also sets their order in the navigation. Anything not listed keeps its name from the backend (a JSON Schema's title, a legacy schema's export name) and comes after them.
- `legacy/schemas.js` finds the legacy route schemas and the utils schemas shown as their fragments, and writes the module the legacy bundle imports in its place. `legacy/joi-model.js` turns them into the model; `legacy/check.js` and `legacy/bundle.js` are the legacy **Try it**.
- `legacy.test.js` checks the legacy page's bundle reports exactly what `legacy/check.js` does unbundled against the real modules, for every example and every way of breaking each field.
- `ewc-codes.js` swaps the utils package's EWC code list for the codes alone in the legacy bundle, as its Joi schemas only ask whether a code exists and is hazardous. `ewc-codes.test.js` checks it answers exactly as the real one for every code.
- `test-cases.js` makes the broken payloads the tests use.
