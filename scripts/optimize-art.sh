#!/usr/bin/env bash
# Optimize source art into web-ready WebP.
#
# Workflow: drop full-res masters (PNG/JPG) into public/art/<kind>/, then run
# this script. It moves each master into art-originals/<kind>/ (git-ignored,
# kept as your archive) and emits a downscaled WebP into public/art/<kind>/
# that actually ships. Re-runnable and idempotent.
#
#   ./scripts/optimize-art.sh
#
# Requires ImageMagick (`magick`). In-game art renders small (cards ~120px,
# enemy medallions ~90px), so these display sizes are visually identical while
# cutting the payload ~100x.
set -euo pipefail
cd "$(dirname "$0")/.."

quality=82
declare -A maxdim=( [cards]=640 [enemies]=640 [characters]=900 [backgrounds]=1920 )

for kind in cards enemies characters backgrounds; do
  src="public/art/$kind"
  orig="art-originals/$kind"
  mkdir -p "$orig" "$src"
  shopt -s nullglob
  # move any newly-dropped masters aside first
  for f in "$src"/*.png "$src"/*.jpg "$src"/*.jpeg "$src"/*.PNG "$src"/*.JPG; do
    mv -f "$f" "$orig/"
  done
  # (re)build a webp for every master
  for f in "$orig"/*.png "$orig"/*.jpg "$orig"/*.jpeg "$orig"/*.PNG "$orig"/*.JPG; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"; base="${base%.*}"
    out="$src/$base.webp"
    magick "$f" -strip -resize "${maxdim[$kind]}x${maxdim[$kind]}>" -quality "$quality" "$out"
    printf '  %-28s %s\n' "$base.webp" "$(du -h "$out" | cut -f1)"
  done
  shopt -u nullglob
done

echo "Done. Shipped art:"
du -sh public/art
