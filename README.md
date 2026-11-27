# Digital Waste Tracking API — public documentation site

Public documentation for Software Providers integrating with the Digital Waste Tracking API, published at <https://defra.github.io/digital-waste-tracking-api-site/>.

It holds the integration guidance, the OpenAPI specifications for each beta version, and the problem-type pages that the API's error responses link to. Internal design and planning material lives in the internal `DEFRA/digital-waste-tracking-api-docs` repo.

## Local development

Requires Node.js 22+ and Python 3.

```bash
npm ci
npm run specs:bundle            # builds docs/api/openapi-beta-N.yaml for the Swagger UI pages
pip install mkdocs-material mike mkdocs-swagger-ui-tag
mkdocs serve
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run schemas:sync` | Copies the JSON Schemas and OpenAPI specs from `waste-movement-backend` into `docs/event-model/schemas/` |
| `npm run schema-explorer:build` | Builds the schema explorer from `docs/event-model/schemas/` (and a `waste-movement-backend` clone for the legacy page) into `docs/schema-explorer/` (gitignored); run `schemas:sync` first to update the schemas |
| `npm run specs:bundle` | Bundles and validates each `beta-*` spec into `docs/api/` |
| `npm run format` / `format:check` | Prettier |

## Publishing

Versions are managed with [mike](https://github.com/jimporter/mike) on the `gh-pages` branch:

- **preview**: deployed on every push to `main` (`docs-preview.yml`)
- **test** / **production**: deployed manually with the _Deploy Release Docs_ workflow (`docs-release.yml`)

Each deploy also builds the schema explorer (`schema-explorer.yml`) and publishes it in that version, e.g. `/preview/schema-explorer/`. Its beta versions are built from the schemas committed in `docs/event-model/schemas/` at the ref being deployed, the same snapshot as the API spec pages, so a schema change in the backend reaches both with `npm run schemas:sync`. The legacy page comes from a clone of the backend's `main` (or `backend_ref`). A build is reused from the cache until the schemas, the backend commit or the explorer's code changes. If the explorer fails to build, its job goes red and the version keeps the explorer it already has.

## Schema explorer

An interactive page per API version, drawing each request and response as a block diagram with a **Try it** view that validates JSON the way the API does. The generator is in `scripts/schema-explorer/` (see its README). Its beta versions are drawn from the synced schemas in `docs/event-model/schemas/`, with each version's `openapi.json` giving its top-level schemas. **Try it checks against the schema only**, not the checks the API runs after it (reference data such as EWC codes, dates not in the future), so the API may still reject something that's valid there. The legacy (ReceiptOfWaste) page is built from the backend's Joi schemas, in a clone of `waste-movement-backend`, which the build also uses to test its errors against the API's and for examples.

```bash
npm run schema-explorer:build
open docs/schema-explorer/index.html
```

The nav links to it, so `mkdocs build --strict` fails until it has been built.

`docs-bootstrap.yml` initialises `gh-pages` once, for a new repo.

Problem-type URIs returned by the API (`PROBLEM_DETAILS_TYPE_BASE` in `waste-movement-backend` and `waste-movement-external-api`) point at `/preview/problems/` on this site, so don't rename or remove those pages without updating the services.
