#!/usr/bin/env bash
# Rebuild public/puzzles/sets.json from the full Lichess puzzle database, test it, and commit it.
# Needs network access to database.lichess.org (run it in an environment that allows it).
#
#   bash scripts/puzzles/refresh-from-lichess.sh            # download (or reuse), build, test, commit
#   bash scripts/puzzles/refresh-from-lichess.sh --push     # ...and push the current branch
#
# The ~300 MB download lives outside the repo and is never committed; only sets.json (~1 MB) is.
set -euo pipefail

URL="https://database.lichess.org/lichess_db_puzzle.csv.zst"
ROOT="$(git rev-parse --show-toplevel)"
CACHE="${PUZZLE_CACHE:-${TMPDIR:-/tmp}/lichess-puzzles}"
FILE="$CACHE/lichess_db_puzzle.csv.zst"
OUT="public/puzzles/sets.json"

cd "$ROOT"
mkdir -p "$CACHE"

step() { printf '\n==> %s\n' "$*"; }

step "Downloading the Lichess puzzle database (resumes if interrupted)"
for attempt in 1 2 3 4; do
  if curl -fL --retry 3 --retry-delay 5 -C - -o "$FILE" "$URL"; then break; fi
  # A complete file makes curl's resume fail with "range not satisfiable"; that's fine.
  if [ -s "$FILE" ] && [ "$(stat -c %s "$FILE")" -gt 100000000 ]; then break; fi
  echo "Download failed (attempt $attempt), retrying in $((attempt * 5))s..." >&2
  sleep $((attempt * 5))
done

step "Checking the download"
size=$(stat -c %s "$FILE")
magic=$(head -c 4 "$FILE" | od -An -tx1 | tr -d ' \n')
# A zstd frame (28b52ffd) or a skippable frame (5X2a4d18), which the Lichess file starts with.
if [ "$magic" != "28b52ffd" ] && ! [[ "$magic" =~ ^5[0-9a-f]2a4d18$ ]]; then
  echo "Not a zstd file (got magic '$magic'). Probably an error page; deleting it. Re-run to try again." >&2
  rm -f "$FILE"
  exit 1
fi
if [ "$size" -lt 100000000 ]; then
  echo "Only $((size / 1000000)) MB: the download looks incomplete. Re-run to resume it." >&2
  exit 1
fi
echo "OK: $((size / 1000000)) MB"

step "Installing dependencies"
if [ ! -d node_modules ]; then npm ci --no-audit --no-fund; fi

step "Building puzzle sets"
node scripts/puzzles/build-sets.mjs --lichess "$FILE"

step "Testing every puzzle (legal moves, real mates, no duplicates) and the app"
npx vitest run

step "Committing"
git add "$OUT"
if git diff --cached --quiet; then
  echo "sets.json is unchanged: nothing to commit."
else
  sets=$(node -e "const d=require('./$OUT');console.log(d.sets.length+' sets, '+d.sets.reduce((a,s)=>a+s.puzzles.length,0)+' puzzles')")
  git commit -m "Rebuild puzzle sets from the Lichess puzzle database ($sets)"
  echo "Committed: $sets"
fi

if [ "${1:-}" = "--push" ]; then
  step "Pushing"
  branch=$(git rev-parse --abbrev-ref HEAD)
  for attempt in 1 2 3 4; do
    if git push -u origin "$branch"; then break; fi
    sleep $((2 ** attempt))
  done
fi

step "Done"
