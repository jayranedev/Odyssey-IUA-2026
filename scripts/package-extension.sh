#!/usr/bin/env bash
# Build the browser extension with a production API URL and zip it for distribution.
#
# Usage:
#   VITE_API_URL=https://odyssey-iua-2026-1.onrender.com VITE_WEB_APP_URL=https://app.yourdomain.com \
#     ./scripts/package-extension.sh
#
# Output: dist-packages/jugaadgpt-extension.zip
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="$ROOT/jugaadgpt-frontend/extension"
OUT_DIR="$ROOT/dist-packages"

: "${VITE_API_URL:=https://odyssey-iua-2026-1.onrender.com}"
: "${VITE_WEB_APP_URL:=http://localhost:5173}"

echo "Building extension with API=$VITE_API_URL WEB=$VITE_WEB_APP_URL"
cd "$EXT_DIR"
npm install --no-audit --no-fund
VITE_API_URL="$VITE_API_URL" VITE_WEB_APP_URL="$VITE_WEB_APP_URL" npm run build

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/jugaadgpt-extension.zip"

cd "$EXT_DIR/dist"
if command -v zip >/dev/null 2>&1; then
  zip -r "$OUT_DIR/jugaadgpt-extension.zip" .
else
  # Windows Git Bash fallback
  powershell.exe -NoProfile -Command \
    "Compress-Archive -Path '$(pwd -W 2>/dev/null || pwd)/*' -DestinationPath '$(cd "$OUT_DIR" && pwd -W 2>/dev/null || echo "$OUT_DIR")/jugaadgpt-extension.zip' -Force"
fi

echo "Done → $OUT_DIR/jugaadgpt-extension.zip"
echo "Users install via chrome://extensions → Developer mode → Load unpacked (after unzipping)."
