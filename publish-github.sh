#!/usr/bin/env bash
# Run on your computer after installing and authenticating the GitHub CLI.
# Usage: ./publish-github.sh private    (default, review first)
#        ./publish-github.sh public     (when ready to share)
set -euo pipefail
visibility="${1:-private}"
if [[ "$visibility" != 'public' && "$visibility" != 'private' ]]; then
  echo 'Usage: ./publish-github.sh [public|private]' >&2
  exit 2
fi
for command_name in gh git; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing $command_name. Install it before running this script." >&2
    exit 1
  fi
done
gh auth status >/dev/null
cd "$(dirname "$0")"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init -b main
fi
git add .
if ! git diff --cached --quiet; then
  git commit -m 'Initial PSHCP Benefit Atlas explorer'
fi
gh repo create pshcp-benefit-explorer "--$visibility" --source=. --remote=origin --push
