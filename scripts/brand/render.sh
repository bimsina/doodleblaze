#!/usr/bin/env bash
# Renders the share image and app icons into public/ with headless Chrome.
# Usage: bash scripts/brand/render.sh   (needs Google Chrome and network access for fonts)
set -euo pipefail
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
DIR="file://$PWD/scripts/brand"
shot() { # url width height out
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=6000 --window-size="$2,$3" --screenshot="$4" "$1" >/dev/null 2>&1
}
shot "$DIR/og.html" 1200 630 public/og.png
shot "$DIR/icon.html?size=180" 180 180 public/apple-touch-icon.png
shot "$DIR/icon.html?size=192" 192 192 public/icon-192.png
shot "$DIR/icon.html?size=512&safe=1" 512 512 public/icon-512-maskable.png
shot "$DIR/icon.html?size=512" 512 512 public/icon-512.png
shot "$DIR/icon.html?size=32" 32 32 public/favicon-32.png
shot "$DIR/icon.html?size=16" 16 16 public/favicon-16.png
python3 scripts/brand/ico.py public/favicon.ico public/favicon-16.png public/favicon-32.png
rm public/favicon-16.png public/favicon-32.png
echo "rendered: $(ls public | tr '\n' ' ')"
