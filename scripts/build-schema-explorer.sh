#!/usr/bin/env bash
# Builds the schema explorer into docs/schema-explorer/ (gitignored), which
# mkdocs copies into the site as it is.
#
# The explorer runs the API's own code (validation, payload checks, the legacy
# Joi schemas), not just the schema files synced to docs/event-model/schemas/.
# So this clones waste-movement-backend, copies scripts/schema-explorer into the
# clone, where its imports of ../../src and node_modules resolve, and builds it
# there from the clone's src/schemas: main by default, the same source
# `npm run schemas:sync` copies the schemas from.
#
#   SCHEMA_SOURCE_REF=<branch, tag or SHA>  the backend commit to build from (main)
#   --skip-tests                            don't check it validates like the API
set -euo pipefail

REPO="${SCHEMA_SOURCE_REPO:-https://github.com/DEFRA/waste-movement-backend.git}"
REF="${SCHEMA_SOURCE_REF:-main}"
# Bundles the "Try it" code. Not one of the backend's own dependencies.
ESBUILD="esbuild@0.28.2"

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="$root/docs/schema-explorer"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# init + fetch rather than clone --branch, which can't fetch a SHA.
git init --quiet "$tmp/backend"
cd "$tmp/backend"
git fetch --quiet --depth 1 "$REPO" "$REF"
git checkout --quiet FETCH_HEAD
sha="$(git rev-parse HEAD)"

mkdir -p scripts
rm -rf scripts/schema-explorer
cp -R "$root/scripts/schema-explorer" scripts/schema-explorer

npm ci --ignore-scripts --no-audit --no-fund
npm install --no-save --ignore-scripts --no-audit --no-fund "$ESBUILD"

# The explorer copies the API's validation; don't publish it if they differ.
if [ "${1:-}" != "--skip-tests" ]; then
  node --test --test-reporter=spec "scripts/schema-explorer/*.test.js"
fi

node scripts/schema-explorer/build.js src/schemas "$tmp/out" --standalone --legacy

# Only replace the previous build once this one has worked.
rm -rf "$dest"
cp -R "$tmp/out" "$dest"
echo "Built docs/schema-explorer from waste-movement-backend@$sha"
