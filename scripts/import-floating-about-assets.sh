#!/usr/bin/env bash
# Run from the root of John-Connect-site. Requires a local checkout of
# john-wolf-3d-head alongside this repository, or set HEAD_REPO.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${HEAD_REPO:-$(dirname "$ROOT")/john-wolf-3d-head}"
FROM="$SOURCE/web/public"
TO="$ROOT/public/models/about"
if [[ ! -d "$FROM" ]]; then
  echo "Missing source assets: $FROM" >&2
  echo "Clone john-wolf-3d-head next to John-Connect-site, or set HEAD_REPO." >&2
  exit 1
fi
if [[ ! -s "$FROM/head-interactive.glb" ]]; then
  echo "Missing or empty: $FROM/head-interactive.glb" >&2
  exit 1
fi
mkdir -p "$TO"
cp "$FROM/head-interactive.glb" "$TO/head-interactive.glb"
if [[ -s "$FROM/source_meshopt.glb" ]]; then
  cp "$FROM/source_meshopt.glb" "$TO/source_meshopt.glb"
fi
if [[ -d "$FROM/floppy" ]]; then
  mkdir -p "$TO/floppy"
  cp -R "$FROM/floppy/." "$TO/floppy/"
fi
echo "Copied About model assets:"
find "$TO" -type f -print | sort
echo "Check that all referenced floppy .gltf buffers and textures are present."
echo "These files are staged locally; commit them on integrate-floating-about after verifying."
