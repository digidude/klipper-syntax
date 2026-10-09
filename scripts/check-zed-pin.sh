#!/bin/sh
# The Zed extension fetches its grammar from this repository at a pinned
# commit. Fail unless that pin is a real commit that contains grammar/ as it is
# now, so a published extension never highlights with a stale or missing parser.
#
#   scripts/check-zed-pin.sh            # pin must exist and match HEAD's grammar/
#   scripts/check-zed-pin.sh --format   # only check that the pin is well-formed
set -eu
cd "$(dirname "$0")/.."

rev=$(sed -n 's/^rev = "\(.*\)"/\1/p' zed/extension.toml)
repo=$(sed -n 's/^repository = "\(.*\)"/\1/p' zed/extension.toml | tail -1)

case "$repo" in
  file://*) echo "zed/extension.toml points at a local checkout: $repo" >&2; exit 1 ;;
esac
if ! printf '%s' "$rev" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "zed/extension.toml: rev is not a 40-character commit: $rev" >&2
  exit 1
fi
[ "${1:-}" = "--format" ] && exit 0

if ! git cat-file -e "$rev^{commit}" 2>/dev/null; then
  echo "rev $rev is not a commit in this repository (not fetched, or never pushed)" >&2
  exit 1
fi
if ! git diff --quiet "$rev" HEAD -- grammar/src; then
  echo "grammar/src changed since rev $rev: bump rev in zed/extension.toml" >&2
  git diff --stat "$rev" HEAD -- grammar/src >&2
  exit 1
fi
echo "zed grammar pin ok: $rev"
