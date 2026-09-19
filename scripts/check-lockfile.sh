#!/usr/bin/env bash
# Verifies that pnpm-lock.yaml matches package.json.
#   Local (git hook): checks the STAGED versions, i.e. exactly what is being committed.
#   CI (CI=true):     checks the committed versions at HEAD.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if [[ "${CI:-}" == "true" ]]; then
  REF="HEAD";  list_files() { git ls-files; };                                    WHERE="this commit"
else
  REF="";      list_files() { git diff --cached --name-only --diff-filter=ACMR; }; WHERE="the staged changes"
fi

# 1. Only pnpm-lock.yaml is allowed: reject lockfiles from other package managers.
if list_files | grep -qE '(^|/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|bun\.lockb?)$'; then
  echo "✖ A non-pnpm lockfile is in $WHERE. This project uses pnpm: remove it and run pnpm install." >&2
  exit 1
fi

# 2. Locally, skip when no dependency-related file is staged.
if [[ -z "$REF" ]] && ! list_files | grep -qE '^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc)$'; then
  exit 0
fi

# 3. Rebuild the snapshot in a temp dir and ask pnpm whether the lockfile satisfies the manifest.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for f in package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc; do
  if git cat-file -e "$REF:$f" 2>/dev/null; then git show "$REF:$f" > "$TMP/$f"; fi
done

if [[ ! -f "$TMP/pnpm-lock.yaml" ]]; then
  echo "✖ pnpm-lock.yaml is missing from $WHERE. Run: pnpm install && git add pnpm-lock.yaml" >&2
  exit 1
fi

if ! (cd "$TMP" && pnpm install --frozen-lockfile --lockfile-only --ignore-scripts --offline >"$TMP/out.log" 2>&1); then
  if grep -q 'ERR_PNPM_OUTDATED_LOCKFILE' "$TMP/out.log"; then
    echo "✖ pnpm-lock.yaml does not match package.json in $WHERE." >&2
    echo "  Run: pnpm install && git add package.json pnpm-lock.yaml" >&2
  else
    echo "✖ Lockfile check failed:" >&2
    cat "$TMP/out.log" >&2
  fi
  exit 1
fi

echo "✔ pnpm-lock.yaml matches package.json"
