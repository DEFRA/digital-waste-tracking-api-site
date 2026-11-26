# Schema explorer

Generates an interactive page per API version (`beta-1`, `beta-2`, …) that draws each request and response body as a block diagram. Every `$ref` fragment is resolved, `oneOf` / `anyOf` / `if`-`then`-`else` become readable rules, and the page shows where each shared fragment under `common/` is reused. A switcher in the sidebar moves between versions, staying on the same endpoint where it exists.

Every endpoint and fragment page also has a **Try it** view: an editor, pre-filled from the schema's examples, that checks the JSON as you type. It uses the API's own compiled schemas (the same ajv, options and formats as `src/schemas/validate/index.js`) and reduces the errors the way `src/schemas/validate/hapi-validator.js` does. So a request body gets the same `errorType`, `pointer` and `message` list as the API's 400 response. A request body also gets the checks its route runs after the schema (`withPayloadChecks`): EWC and POP codes against the reference data, the consignment note rule for hazardous waste, and date-times not being empty or in the future (against the viewer's clock). These are the API's own functions, bundled for the browser. Each error links to its place in the editor and in the diagram. Only the body is checked, not headers, path IDs or checks against stored data. Edits are kept in the viewer's browser.

Try it's code (the compiled validators, error handling and checks, over half of a version's code) is a separate `try-it.js` beside each page, loaded the first time Try it is opened or pointed at, so the diagrams don't wait for it. The EWC code list the checks use is bundled as the codes alone (`ewc-codes.js`), not the utils package's full list with descriptions.

### Legacy (Joi) routes

`--legacy` (on in the published build) adds a **legacy** version (shown as **ReceiptOfWaste**; see `labels.js`), listed after the beta versions (newest first), for the routes that still validate with Joi: receive a movement (`POST`/`PUT /movements/{wasteTrackingId}/receive`) and bulk receive (`POST`/`PUT /bulk/{bulkId}/movements/receive`). `legacy/schemas.js` finds them by importing the backend's route modules: every non-beta route whose path ends in `/receive` and whose payload is a Joi schema. There are no JSON Schema files for these, so `legacy/joi-model.js` reads each Joi schema's own description (`schema.describe()`) into the same model: fields and limits, `.when()` conditions, `xor`/`or`/`with`/`without` rules, alternatives, and `.custom()` checks (named where Joi has a description, with the messages they can report; their logic is code, so it isn't shown). A nested schema matching one of the Joi schemas `@defra/waste-movement-utils` exports from `src/schemas/` is shown as that shared fragment.

Its **Try it** runs the routes' real Joi schemas in the browser: `legacy/check.js` validates as the routes do (Joi with `abortEarly` off, then the API's own `validationErrorFormatter`, and per-item errors for bulk routes), and `legacy/bundle.js` bundles it with esbuild. Errors therefore come back in the legacy API's format, `{ key, errorType, message }`. The examples come from the utils package's own valid test payload.

Everything is generated from the schema files alone, so it can't drift from them. Within a version, every `*-request.schema.json` and `*-response.schema.json` is a top-level schema, and everything they reference is a shared fragment. No OpenAPI spec is read. Each top-level schema's page is named after its file, e.g. `beta-2/index.html#create-movement-request`.

## Build it locally

From the root of this repo:

```sh
npm run schema-explorer:build
open docs/schema-explorer/index.html    # opens the latest version
```

`scripts/build-schema-explorer.sh` clones `waste-movement-backend` (`main` by default), copies this folder into the clone's `scripts/`, installs dependencies, runs the tests and builds from the clone's `src/schemas/`. The code here imports the backend's `src/` and `node_modules`, so it and its tests only run inside a backend checkout. Paths such as `src/schemas/` in this README are the backend's.

- `SCHEMA_SOURCE_REF=<branch, tag or SHA>` builds from another backend commit.
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

`.github/workflows/schema-explorer.yml` builds it. `docs-preview.yml` and `docs-release.yml` call it, and put it in the version they deploy under `schema-explorer/`, e.g. `/preview/schema-explorer/`. It's built from the backend's `main` at deploy time; a build is reused from the cache until that commit or the code here changes. A new `beta-N` folder or route in the backend is picked up with no changes here, unless it has payload checks: those need adding to `checks/checks.js`, and the tests fail until they are.

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
- `checks/checks.js` lists the payload checks each beta request schema runs after it, importing the checks from `src/`. A schema not listed has none. `checks/bundle.js` bundles them, with the utils reference data they use, into the pages of versions that have any.
- `checks.test.js` runs every beta route's real payload validation against the page's (schema, errors and checks bundle), on each example, every way of breaking each field, unrecognised EWC codes and future date-times. It takes each route's request schema from its version's `openapi.json`, and fails if the route isn't there or its checks differ from `checks/checks.js`.
- `legacy/schemas.js` finds the legacy route schemas and the utils schemas shown as their fragments, and writes the module the legacy bundle imports in its place. `legacy/joi-model.js` turns them into the model; `legacy/check.js` and `legacy/bundle.js` are the legacy **Try it**.
- `legacy.test.js` checks the legacy page's bundle reports exactly what `legacy/check.js` does unbundled against the real modules, for every example and every way of breaking each field.
- `ewc-codes.js` swaps the utils package's EWC code list for the codes alone in both bundles (the checks and legacy). `ewc-codes.test.js` checks it answers exactly as the real one for every code.
- `test-cases.js` makes the broken payloads the tests use.
