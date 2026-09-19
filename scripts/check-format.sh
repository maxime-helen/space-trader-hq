#!/usr/bin/env bash
# Fails the commit when a staged file is not formatted with Prettier.
# Checks the STAGED content: files that also have unstaged edits are read
# from the git index, so the check matches exactly what is being committed.
set -euo pipefail

# Run from the repository root, resolved from this script's own location, so the
# script works from any working directory and git's paths resolve correctly.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

PRETTIER="node_modules/.bin/prettier"
if [[ ! -x "$PRETTIER" ]]; then
  echo "✖ Prettier not found at $PRETTIER. Run: pnpm install" >&2
  exit 1
fi

staged=()
while IFS= read -r f; do staged+=("$f"); done < <(git diff --cached --name-only --diff-filter=ACMR)
[[ ${#staged[@]} -eq 0 ]] && exit 0

# Newline-delimited set of files that also have unstaged edits (bash 3.2 has no associative arrays).
unstaged="$(git diff --name-only)"

fully_staged=()
partially_staged=()
for f in "${staged[@]}"; do
  if printf '%s\n' "$unstaged" | grep -qxF -- "$f"; then
    partially_staged+=("$f")
  else
    fully_staged+=("$f")
  fi
done

failed=()

# Fast path: one Prettier run over every fully staged file (disk content = staged content).
if [[ ${#fully_staged[@]} -gt 0 ]]; then
  while IFS= read -r line; do
    if [[ "$line" == "[warn] "* && "$line" != *"Code style issues"* ]]; then
      failed+=("${line#\[warn\] }")
    fi
  done < <("$PRETTIER" --check --ignore-unknown "${fully_staged[@]}" 2>&1 || true)
fi

# Exact path: partially staged files are checked from the index, one by one.
if [[ ${#partially_staged[@]} -gt 0 ]]; then
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  for f in "${partially_staged[@]}"; do
    info="$("$PRETTIER" --file-info "$f")"
    if grep -q '"ignored": true' <<<"$info" || grep -q '"inferredParser": null' <<<"$info"; then
      continue
    fi
    git show ":$f" > "$TMP/staged"
    "$PRETTIER" --stdin-filepath "$f" < "$TMP/staged" > "$TMP/formatted"
    cmp -s "$TMP/staged" "$TMP/formatted" || failed+=("$f (staged version)")
  done
fi

if [[ ${#failed[@]} -gt 0 ]]; then
  echo "✖ Prettier: ${#failed[@]} staged file(s) are not formatted:" >&2
  printf '    %s\n' "${failed[@]}" >&2
  echo "  Run: pnpm format, then git add the files" >&2
  exit 1
fi

echo "✔ Staged files are formatted"
