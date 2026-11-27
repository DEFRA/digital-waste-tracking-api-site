#!/usr/bin/env bash
# Copies the versioned JSON Schemas, their named examples and each version's
# OpenAPI spec from the repos that serve the API (the source of truth) into
# docs/event-model/schemas/, which is committed to this repo so a plain clone
# renders without a network fetch:
#
# - waste-movement-backend: every `beta-*` folder under src/schemas/ (beta-1,
#   beta-2).
# - waste-movement-api: every `src/versions/beta-*/schemas/` folder (beta-3 on).
#
# Each version lands in docs/event-model/schemas/<version>/, with every file at
# the same path from there as from its schema folder upstream (e.g.
# "beta-2/common/producer/producer.schema.json"). That matters because the
# schemas declare no $id: upstream treats the path as the schema's identity,
# and relative $refs resolve against wherever the file was fetched from. A new
# version in either repo is picked up with no change here. A version in both
# is taken from waste-movement-api, which is where versions are moving.
#
# See docs/event-model/schemas/README.md for why this is a copy
# rather than a $ref at raw.githubusercontent.com.
set -euo pipefail

# SCHEMA_SOURCE_REPO / SCHEMA_SOURCE_REF are the backend's older names.
BACKEND_REPO="${BACKEND_REPO:-${SCHEMA_SOURCE_REPO:-https://github.com/DEFRA/waste-movement-backend.git}}"
BACKEND_REF="${BACKEND_REF:-${SCHEMA_SOURCE_REF:-main}}"
API_REPO="${API_REPO:-https://github.com/DEFRA/waste-movement-api.git}"
API_REF="${API_REF:-main}"
DEST="docs/event-model/schemas"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# A sparse checkout of one folder of a repo; prints the commit.
fetch() {
  local repo="$1" ref="$2" dir="$3" subtree="$4"
  git clone --quiet --depth 1 --filter=blob:none --sparse --branch "$ref" "$repo" "$dir"
  git -C "$dir" sparse-checkout set "$subtree"
  git -C "$dir" rev-parse HEAD
}

backend_sha="$(fetch "$BACKEND_REPO" "$BACKEND_REF" "$tmp/backend" src/schemas)"
api_sha="$(fetch "$API_REPO" "$API_REF" "$tmp/api" src/versions)"

mkdir -p "$DEST"

# Drop the previous snapshot first, so a schema deleted upstream disappears here
# too rather than lingering. The hand-written README is not matched by either find.
find "$DEST" \( -name '*.schema.json' -o -name '*.examples.json' -o -name 'openapi.json' \) -delete
find "$DEST" -mindepth 1 -type d -empty -delete

# Copies one version's schema folder to $DEST/<version>/: schema files, the
# named request/response examples beside them, and its openapi.json (which
# $refs both by relative path) only. The .test.js and .js files upstream are
# service code.
copy_version() {
  local from="$1" version="$2"
  rm -rf "${DEST:?}/$version"
  (cd "$from" && find . \( -name '*.schema.json' -o -name '*.examples.json' -o -name 'openapi.json' \) -print0) |
    while IFS= read -r -d '' f; do
      mkdir -p "$DEST/$version/$(dirname "$f")"
      cp "$from/$f" "$DEST/$version/$f"
    done
}

# Restricted to beta-* so the loose .js schemas that sit directly under the
# backend's src/schemas/ (movement.js, headers.js, …) stay out.
for dir in "$tmp"/backend/src/schemas/beta-*/; do
  [ -d "$dir" ] && copy_version "$dir" "$(basename "$dir")"
done
for dir in "$tmp"/api/src/versions/beta-*/schemas/; do
  [ -d "$dir" ] || continue
  version="$(basename "$(dirname "$dir")")"
  if [ -d "$tmp/backend/src/schemas/$version" ]; then
    echo "$version is in both repos; using waste-movement-api's" >&2
  fi
  copy_version "$dir" "$version"
done

echo "Synced $DEST from waste-movement-backend@$backend_sha and waste-movement-api@$api_sha"
