#!/usr/bin/env bash
# Genera los PNG estáticos (512×512, fondo transparente) de las mascotas 3D a
# partir de scripts/pet3d-preview.html, con Chrome o Edge en modo headless.
#
#   bash scripts/render-pet-sprites.sh            # requiere python o npx para servir
#
# Resultado: assets/mascota/{tecolote,monarca,ayotl}/stage{1-6}.png
set -euo pipefail
cd "$(dirname "$0")/.."

BROWSER="${BROWSER:-}"
for c in "/c/Program Files/Google/Chrome/Application/chrome.exe" \
         "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
         "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         "$(command -v google-chrome || true)" "$(command -v chromium || true)"; do
  if [ -z "$BROWSER" ] && [ -n "$c" ] && [ -x "$c" ]; then BROWSER="$c"; fi
done
[ -n "$BROWSER" ] || { echo "No encontré Chrome ni Edge. Define BROWSER=/ruta/al/navegador"; exit 1; }

PORT=8765
python -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1

winpath() { if command -v cygpath >/dev/null; then cygpath -w "$1"; else echo "$1"; fi; }

for pet in tecolote monarca ayotl; do
  mkdir -p "assets/mascota/$pet"
  for stage in 1 2 3 4 5 6; do
    out="$PWD/assets/mascota/$pet/stage$stage.png"
    rm -f "$out"
    "$BROWSER" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
      --hide-scrollbars --default-background-color=00000000 --window-size=512,512 \
      --virtual-time-budget=15000 --screenshot="$(winpath "$out")" \
      "http://localhost:$PORT/scripts/pet3d-preview.html?pet=$pet&stage=$stage&size=512" >/dev/null 2>&1 || true
    for _ in $(seq 1 40); do [ -s "$out" ] && break; sleep 0.5; done
    [ -s "$out" ] && echo "✓ $pet etapa $stage" || { echo "✗ $pet etapa $stage"; exit 1; }
  done
done
