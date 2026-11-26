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
| `npm run schema-explorer:build` | Builds the schema explorer from `waste-movement-backend` (`main` by default) into `docs/schema-explorer/` (gitignored) |
| `npm run specs:bundle` | Bundles and validates each `beta-*` spec into `docs/api/` |
| `npm run format` / `format:check` | Prettier |

## Publishing

Versions are managed with [mike](https://github.com/jimporter/mike) on the `gh-pages` branch:

- **preview**: deployed on every push to `main` (`docs-preview.yml`)
- **test** / **production**: deployed manually with the _Deploy Release Docs_ workflow (`docs-release.yml`)

Each deploy also builds the schema explorer (`schema-explorer.yml`) and publishes it in that version, e.g. `/preview/schema-explorer/`. It's built from the backend's `main` at deploy time, the source `npm run schemas:sync` copies from. After a schema change in the backend, run _Deploy Preview Docs_ by hand to update preview. Both workflows can build it from another backend branch, tag or SHA. A build is reused from the cache until the backend commit or the explorer's code changes. If the explorer fails to build, its job goes red and the version keeps the explorer it already has.

## Schema explorer

An interactive page per API version, drawing each request and response as a block diagram with a **Try it** view that validates JSON the way the API does. The generator is in `scripts/schema-explorer/` (see its README). It is built in a clone of `waste-movement-backend`, from its `src/schemas/`, because it runs the API's own validation code.

```bash
npm run schema-explorer:build
open docs/schema-explorer/index.html
```

The nav links to it, so `mkdocs build --strict` fails until it has been built.

`docs-bootstrap.yml` initialises `gh-pages` once, for a new repo.

Problem-type URIs returned by the API (`PROBLEM_DETAILS_TYPE_BASE` in `waste-movement-backend` and `waste-movement-external-api`) point at `/preview/problems/` on this site, so don't rename or remove those pages without updating the services.
