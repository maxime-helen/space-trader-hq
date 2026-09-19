#!/usr/bin/env bash
# Checks branch names: <type>/<short-description>, e.g. feat/fleet-list.
# Types are the commit types allowed by commitlint (@commitlint/config-conventional).
#   check-branch.sh <branch>...  checks the given names (CI)
#   check-branch.sh              reads git's pre-push lines from stdin (hook)
set -euo pipefail

TYPES='build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test'
PATTERN="^($TYPES)/[a-z0-9]+(-[a-z0-9]+)*$"

branches=()
if [[ $# -gt 0 ]]; then
  branches=("$@")
else
  # Each line: <local ref> <local sha> <remote ref> <remote sha>
  while read -r _local_ref local_sha remote_ref _remote_sha; do
    [[ "$remote_ref" == refs/heads/* ]] || continue # tags and other refs
    [[ "$local_sha" =~ ^0+$ ]] && continue          # deleting a branch is always allowed
    branches+=("${remote_ref#refs/heads/}")
  done
fi

failed=()
for branch in ${branches[@]+"${branches[@]}"}; do
  [[ "$branch" == main || "$branch" =~ $PATTERN ]] || failed+=("$branch")
done

if [[ ${#failed[@]} -gt 0 ]]; then
  echo "✖ Branch names must be <type>/<short-description>, e.g. feat/fleet-list:" >&2
  printf '    %s\n' "${failed[@]}" >&2
  echo "  Types: ${TYPES//|/, }. Description: lowercase words separated by hyphens." >&2
  echo "  Rename with: git branch -m <new-name>" >&2
  exit 1
fi

echo "✔ Branch names are valid"
