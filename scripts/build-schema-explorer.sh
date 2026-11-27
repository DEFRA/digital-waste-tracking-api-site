#!/usr/bin/env bash
# Builds the schema explorer into docs/schema-explorer/ (gitignored), which
# mkdocs copies into the site as it is.
#
# The beta-N pages are built from docs/event-model/schemas/ as it is, the
# schemas the API spec pages are bundled from too (run `npm run schemas:sync`
# first to update them). Each version's openapi.json gives its top-level
# schemas.
#
# It clones waste-movement-backend for what can't come from the schema files:
# the legacy (ReceiptOfWaste) page, built from its Joi schemas; the test that
# the explorer reports the same errors as the API's validator; and examples
# taken from its schema tests. scripts/schema-explorer is copied into the
# clone, where its imports of ../../src and node_modules resolve, and built
# there.
#
#   SCHEMA_SOURCE_REF=<branch, tag or SHA>  the backend commit to clone (main)
#   --skip-tests  don't check it validates like the API
set -euo pipefail

REPO="${SCHEMA_SOURCE_REPO:-https://github.com/DEFRA/waste-movement-backend.git}"
REF="${SCHEMA_SOURCE_REF:-main}"
# Bundles the "Try it" code. Not one of the backend's own dependencies.
ESBUILD="esbuild@0.28.2"

skip_tests=""
for arg in "$@"; do
  case "$arg" in
    --skip-tests) skip_tests=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

root="$(cd "$(dirname "$0")/.." && pwd)"
schemas="$root/docs/event-model/schemas"
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
if [ -z "$skip_tests" ]; then
  node --test --test-reporter=spec "scripts/schema-explorer/*.test.js"
fi

node scripts/schema-explorer/build.js "$schemas" "$tmp/out" --standalone --legacy

# Only replace the previous build once this one has worked.
rm -rf "$dest"
cp -R "$tmp/out" "$dest"
echo "Built docs/schema-explorer from docs/event-model/schemas/ and waste-movement-backend@$sha"
