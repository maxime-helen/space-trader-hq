#!/usr/bin/env bash
# Checks that a range of commits is ready to be rebased onto main: no merge commits,
# and no fixup!/squash!/amend! commits left over from review.
# Pull requests are merged with "Rebase and merge", so every commit lands on main as is.
#   check-history.sh <base> <head>
set -euo pipefail

base="${1:?usage: check-history.sh <base> <head>}"
head="${2:?usage: check-history.sh <base> <head>}"

cd "$(git rev-parse --show-toplevel)"

merges="$(git log --merges --format='    %h %s' "$base..$head")"
autosquash="$(git log --no-merges --format='%h %s' "$base..$head" | grep -E '^[0-9a-f]+ (fixup|squash|amend)! ' | sed 's/^/    /' || true)"

if [[ -n "$merges" ]]; then
  echo "✖ Merge commits are not allowed; rebase instead (git rebase origin/main):" >&2
  echo "$merges" >&2
fi
if [[ -n "$autosquash" ]]; then
  echo "✖ Fold these commits into the ones they fix (git rebase -i --autosquash origin/main):" >&2
  echo "$autosquash" >&2
fi
[[ -z "$merges" && -z "$autosquash" ]] || exit 1

echo "✔ History is linear, with no fixup commits"
