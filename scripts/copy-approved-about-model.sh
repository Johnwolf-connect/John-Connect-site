#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${1:-/workspaces/john-wolf-3d-head/web/public/head-interactive.glb}"
if [[ ! -f "$SOURCE" ]]; then
  echo "Approved model not found at: $SOURCE"
  echo "Usage: bash scripts/copy-approved-about-model.sh /path/to/head-interactive.glb"
  exit 1
fi
mkdir -p "$ROOT/public/about"
cp "$SOURCE" "$ROOT/public/about/head-interactive.glb"
echo "Approved model copied to public/about/head-interactive.glb"
if command -v git >/dev/null && git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  echo "To include this .glb despite the existing *.glb ignore rule:"
  echo "  git add -f public/about/head-interactive.glb"
  echo "  git commit -m 'Add approved 3D head asset'"
fi
