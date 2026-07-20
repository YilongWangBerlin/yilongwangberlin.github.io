#!/usr/bin/env bash
# Shrink photos in assets/photos/ so the repo stays small enough for Pages.
# Longest edge -> 2000px, re-encoded at quality 72. Runs in place, macOS only
# (sips ships with the OS, so there is nothing to install).
#
#   ./tools/shrink-photos.sh

set -euo pipefail

dir="$(cd "$(dirname "$0")/.." && pwd)/assets/photos"
max_edge=2000

if [ ! -d "$dir" ]; then
  echo "no assets/photos/ yet. Create it and drop photos in."
  exit 1
fi

shopt -s nullglob nocaseglob
files=("$dir"/*.jpg "$dir"/*.jpeg "$dir"/*.png)

if [ ${#files[@]} -eq 0 ]; then
  echo "assets/photos/ is empty"
  exit 0
fi

for f in "${files[@]}"; do
  before=$(stat -f%z "$f")
  sips --resampleHeightWidthMax "$max_edge" \
       --setProperty formatOptions 72 \
       "$f" --out "$f" >/dev/null
  after=$(stat -f%z "$f")
  printf '%-40s %5s KB -> %5s KB\n' \
    "$(basename "$f")" "$((before / 1024))" "$((after / 1024))"
done

echo
echo "total: $(du -sh "$dir" | cut -f1)"
