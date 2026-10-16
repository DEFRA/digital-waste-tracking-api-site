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
| `npm run specs:bundle` | Bundles and validates each `beta-*` spec into `docs/api/` |
| `npm run format` / `format:check` | Prettier |

## Publishing

Versions are managed with [mike](https://github.com/jimporter/mike) on the `gh-pages` branch:

- **preview**: deployed on every push to `main` (`docs-preview.yml`)
- **test** / **production**: deployed manually with the _Deploy Release Docs_ workflow (`docs-release.yml`)

`docs-bootstrap.yml` initialises `gh-pages` once, for a new repo.

Problem-type URIs returned by the API (`PROBLEM_DETAILS_TYPE_BASE` in `waste-movement-backend` and `waste-movement-external-api`) point at `/preview/problems/` on this site, so don't rename or remove those pages without updating the services.

## Confluence

`confluence-sync.yml` publishes `docs/software-provider-integration-guidance.md` to Confluence on push to `main`. It needs the `CONFLUENCE_USER` and `CONFLUENCE_API_TOKEN` repo secrets.
