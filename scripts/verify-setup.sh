#!/bin/bash
# Verify development environment prerequisites for FloImg

echo "FloImg Setup Verification"
echo "========================="
echo ""

ERRORS=0
WARNINGS=0

# Check Node version
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
if [ -z "$NODE_VERSION" ]; then
    echo "  Node.js not found"
    ERRORS=$((ERRORS + 1))
elif [ "$NODE_MAJOR" -lt 22 ]; then
    echo "  Node.js $NODE_VERSION (need 22+)"
    ERRORS=$((ERRORS + 1))
else
    echo "  Node.js $NODE_VERSION"
fi

# Check pnpm
PNPM_VERSION=$(pnpm -v 2>/dev/null)
PNPM_MAJOR=$(echo $PNPM_VERSION | cut -d. -f1)
if [ -z "$PNPM_VERSION" ]; then
    echo "  pnpm not found (run: corepack enable)"
    ERRORS=$((ERRORS + 1))
elif [ "$PNPM_MAJOR" -lt 9 ]; then
    echo "  pnpm $PNPM_VERSION (need 9+)"
    ERRORS=$((ERRORS + 1))
else
    echo "  pnpm $PNPM_VERSION"
fi

# Check Git
GIT_VERSION=$(git --version 2>/dev/null | cut -d' ' -f3)
if [ -z "$GIT_VERSION" ]; then
    echo "  Git not found"
    ERRORS=$((ERRORS + 1))
else
    echo "  Git $GIT_VERSION"
fi

# Check for .tool-versions (optional but recommended)
if [ -f ".tool-versions" ]; then
    echo "  .tool-versions found"
else
    echo "  .tool-versions not found (optional)"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "All required checks passed!"
    if [ $WARNINGS -gt 0 ]; then
        echo "($WARNINGS warning(s) - see above)"
    fi
    echo ""
    echo "Next: Run 'pnpm install' to install dependencies."
else
    echo "$ERRORS issue(s) found. Please fix before continuing."
    exit 1
fi
