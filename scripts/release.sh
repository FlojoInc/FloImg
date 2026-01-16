#!/bin/bash
#
# Release script for floimg monorepo
#
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 0.15.7
#
# This script:
# 1. Updates root package.json version
# 2. Validates CHANGELOG.md has an entry for the version
# 3. Provides instructions for completing the release
#

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 0.15.7"
  exit 1
fi

# Validate version format (semver without v prefix)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in semver format (e.g., 0.15.7)"
  exit 1
fi

# Check we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Error: Must be on main branch (currently on $CURRENT_BRANCH)"
  exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --staged --quiet; then
  echo "Error: Uncommitted changes detected. Commit or stash them first."
  exit 1
fi

# Check that version is higher than current highest tag
HIGHEST_TAG=$(git tag --sort=-v:refname | head -1 | sed 's/^v//')
if [ -n "$HIGHEST_TAG" ]; then
  # Simple string comparison works for semver in most cases
  if [ "$(printf '%s\n' "$HIGHEST_TAG" "$VERSION" | sort -V | tail -1)" = "$HIGHEST_TAG" ]; then
    echo "Error: Version $VERSION is not higher than current highest tag v$HIGHEST_TAG"
    exit 1
  fi
fi

# Check CHANGELOG.md has entry for this version
if ! grep -q "\[v$VERSION\]" CHANGELOG.md; then
  echo "Error: CHANGELOG.md does not have an entry for [v$VERSION]"
  echo "Add a section like: ## [v$VERSION] - $(date +%Y-%m-%d)"
  exit 1
fi

# Update root package.json
echo "Updating root package.json to $VERSION..."
npm pkg set version="$VERSION"

echo ""
echo "Root package.json updated to $VERSION"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Commit: git commit -am \"chore: release v$VERSION\""
echo "  3. Tag: git tag v$VERSION"
echo "  4. Push: git push origin main --tags"
echo ""
echo "The v$VERSION tag will trigger the release workflow."
