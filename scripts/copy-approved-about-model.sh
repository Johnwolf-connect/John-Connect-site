#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${1:-/workspaces/john-wolf-3d-head/web/public/head-interactive.glb}"
if [[ ! -f "$SOURCE" ]]; then echo "Approved model missing: $SOURCE"; exit 1; fi
mkdir -p "$ROOT/public/about"
cp "$SOURCE" "$ROOT/public/about/head-interactive.glb"
echo "Copied approved head model to public/about/head-interactive.glb"
