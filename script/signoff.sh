#!/bin/sh
# Run the local gate, then post a gh-signoff status on the already-pushed HEAD.
# Does not install the extension or a ruleset. Requires: gh, basecamp/gh-signoff.
set -eu

cd "$(dirname "$0")/.."

echo "==> bun run check"
bun run check

head="$(git rev-parse HEAD)"
short="$(git rev-parse --short HEAD)"

if ! git rev-parse --abbrev-ref --symbolic-full-name '@{push}' >/dev/null 2>&1; then
  echo "error: no push remote for this branch; push HEAD first, then re-run." >&2
  exit 1
fi

push_tip="$(git rev-parse '@{push}')"
if ! git merge-base --is-ancestor "$head" "$push_tip"; then
  echo "error: HEAD $short is not on the push remote; push first, then re-run." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found." >&2
  exit 1
fi

if ! gh signoff --help >/dev/null 2>&1; then
  echo "error: gh-signoff extension missing. Install with:" >&2
  echo "  gh extension install basecamp/gh-signoff" >&2
  exit 1
fi

echo "==> gh signoff ($short)"
gh signoff
