#!/usr/bin/env bash
# Read-only. Gathers everything needed to propose a release: never tags, never pushes.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "== branch =="
current_branch=$(git branch --show-current)
echo "current: ${current_branch:-DETACHED HEAD}"

echo
echo "== working tree =="
if [ -z "$(git status --porcelain)" ]; then
  echo "clean"
else
  echo "DIRTY - uncommitted changes present:"
  git status --porcelain
fi

echo
echo "== sync with origin/main =="
git fetch origin main --quiet
local_main=$(git rev-parse main 2>/dev/null || echo "NO_LOCAL_MAIN_BRANCH")
origin_main=$(git rev-parse origin/main)
echo "local main:  $local_main"
echo "origin main: $origin_main"
if [ "$local_main" = "$origin_main" ]; then
  echo "status: in sync"
else
  ahead=$(git rev-list --count origin/main..main 2>/dev/null || echo "?")
  behind=$(git rev-list --count main..origin/main 2>/dev/null || echo "?")
  echo "status: OUT OF SYNC - local main is $ahead commit(s) ahead, $behind commit(s) behind origin/main"
fi

echo
echo "== existing version tags on origin (v*.*.*) =="
# Scoped to `origin` deliberately, not local `git tag -l`: if any other remote
# (e.g. an upstream fork) has ever been fetched, its tags land in the same local
# namespace with no prefix, and can silently outrank this repo's own version series.
origin_tags=$(git ls-remote --tags origin 'refs/tags/v*.*.*' | awk -F'/' '{print $NF}' | grep -v '\^{}' | sort -V)
highest=$(echo "$origin_tags" | tail -1)
echo "highest existing tag: ${highest:-none found}"
echo "most recent 10:"
echo "$origin_tags" | tail -10

if [ -n "$highest" ]; then
  ver=${highest#v}
  IFS='.' read -r major minor patch <<< "$ver"
  echo
  echo "== proposed next versions (pick one, or something else entirely) =="
  echo "patch bump: v${major}.${minor}.$((patch + 1))"
  echo "minor bump: v${major}.$((minor + 1)).0"
  echo "major bump: v$((major + 1)).0.0"
fi

echo
echo "== changelog basis =="
# Walk origin's tags newest-first and take the first one that's actually an
# ancestor of HEAD (same origin-only scoping reason as above - `git describe`
# would happily match a stray tag from some other fetched remote instead).
nearest_tag=""
for t in $(echo "$origin_tags" | sort -rV); do
  if git merge-base --is-ancestor "$t" HEAD 2>/dev/null; then
    nearest_tag="$t"
    break
  fi
done
if [ -n "$nearest_tag" ]; then
  echo "nearest ancestor tag on this branch: $nearest_tag"
  echo "commits since $nearest_tag:"
  git log "$nearest_tag"..HEAD --oneline
else
  echo "no ancestor version tag found on this branch's history."
  echo "last 15 commits instead:"
  git log --oneline -15
fi
