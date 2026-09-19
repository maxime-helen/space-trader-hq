#!/usr/bin/env bash
# Downloads the SpaceTraders OpenAPI spec at a pinned upstream commit,
# bundles its multi-file $refs into one file, and records the source commit.
# Usage: pnpm api:sync [commit-sha]   (defaults to the SHA in openapi/SOURCE)
set -euo pipefail

REPO="SpaceTradersAPI/api-docs"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REDOCLY="$ROOT/node_modules/.bin/redocly"
OUT_DIR="$ROOT/openapi"

SHA="${1:-$(sed -n 's/^commit=//p' "$OUT_DIR/SOURCE" 2>/dev/null || true)}"
: "${SHA:?Pass a commit SHA: pnpm api:sync <sha>}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$SHA" | tar -xz -C "$TMP" --strip-components=1

mkdir -p "$OUT_DIR"

# Bundle from a clean copy so the upstream Redocly config is not picked up.
mkdir -p "$TMP/clean" && cp -r "$TMP/reference" "$TMP/models" "$TMP/clean/"
(cd "$TMP/clean" && "$REDOCLY" bundle reference/SpaceTraders.json -o bundled.json >/dev/null)

cp "$TMP/clean/bundled.json" "$OUT_DIR/spacetraders.json"
printf 'repo=%s\ncommit=%s\n' "$REPO" "$SHA" > "$OUT_DIR/SOURCE"

echo "Synced $REPO@$SHA -> openapi/spacetraders.json"
