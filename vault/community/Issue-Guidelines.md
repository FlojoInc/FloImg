# Issue Guidelines

This guide covers how to create effective bug reports and feature requests.

## Before Creating an Issue

1. **Search existing issues** - Your issue may already be reported
2. **Check discussions** - It might be better as a discussion first
3. **Reproduce the issue** - Ensure it's consistent

## Bug Reports

### Required Information

````markdown
## Description

A clear description of what the bug is.

## Steps to Reproduce

1. Install floimg with `npm install @teamflojo/floimg`
2. Run this code:
   ```typescript
   // minimal reproduction code
   ```
````

3. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- floimg version: x.x.x
- Node.js version: x.x.x
- OS: macOS/Linux/Windows
- Package manager: npm/pnpm/yarn

````

### Good Bug Report Example

```markdown
## Description

`floimg.transform()` throws "Cannot read property 'bytes' of undefined"
when using resize with a percentage value.

## Steps to Reproduce

1. Create a new project with `pnpm init`
2. Install: `pnpm add @teamflojo/floimg`
3. Run this code:

```typescript
import createClient from '@teamflojo/floimg';

const floimg = createClient();
const image = await floimg.load('./test.png');

// This throws
const resized = await floimg.transform({
  blob: image,
  op: 'resize',
  params: { width: '50%' }  // percentage causes error
});
````

## Expected Behavior

Image should resize to 50% of original width.

## Actual Behavior

Throws: `TypeError: Cannot read property 'bytes' of undefined`

Stack trace:

```
at SharpProvider.transform (node_modules/@teamflojo/floimg/dist/providers/transform/sharp.js:45:12)
```

## Environment

- floimg version: 0.3.2
- Node.js version: 20.10.0
- OS: macOS 14.2
- Package manager: pnpm 8.12.0

````

### Tips for Bug Reports

- **Minimal reproduction** - Smallest code that shows the bug
- **Specific versions** - Exact versions of all packages
- **Error messages** - Full error with stack trace
- **Screenshots** - If visual, include before/after

## Feature Requests

### Required Information

```markdown
## Problem Statement

What problem are you trying to solve? Why is this needed?

## Proposed Solution

How do you envision this working?

## Alternatives Considered

What other approaches did you consider?

## Use Case

Describe your specific use case for this feature.
````

### Good Feature Request Example

````markdown
## Problem Statement

I need to add watermarks to generated images, but currently I have to
use a separate library after floimg generates the image. This breaks
the pipeline flow and requires manual file handling.

## Proposed Solution

Add a `watermark` transform operation that composites a watermark image:

```typescript
const watermarked = await floimg.transform({
  blob: image,
  op: "watermark",
  params: {
    image: "./logo.png", // watermark image
    position: "bottom-right", // corner placement
    opacity: 0.5, // transparency
    margin: 20, // pixels from edge
  },
});
```
````

## Alternatives Considered

1. **Using composite directly** - Works but requires calculating positions manually
2. **Post-processing with Sharp** - Breaks pipeline, requires file I/O
3. **External watermark service** - Adds latency and cost

## Use Case

Building a photo processing service where all uploaded images need
a branded watermark before storage. Using floimg for the rest of
the pipeline (resize, format conversion).

```

### Tips for Feature Requests

- **Focus on the problem** - Not just the solution
- **Real use cases** - Why you need this specifically
- **Consider scope** - Is this core or plugin territory?

## Discussions vs Issues

### Use Issues For

- Bug reports with reproduction steps
- Well-defined feature requests
- Documentation errors

### Use Discussions For

- Questions about usage
- Ideas you want feedback on
- General help requests
- Showcasing what you've built

## Labels

Issues are labeled to help with triage:

| Label | Meaning |
|-------|---------|
| `bug` | Confirmed bug |
| `enhancement` | Feature request |
| `documentation` | Docs improvement |
| `good first issue` | Suitable for new contributors |
| `help wanted` | Extra attention needed |
| `duplicate` | Already reported |
| `wontfix` | Won't be addressed |

## Issue Lifecycle

1. **New** - Just created
2. **Triaged** - Reviewed and labeled
3. **Accepted** - Will be worked on
4. **In Progress** - Someone is working on it
5. **Resolved** - Fixed and closed

## Stale Issues

Issues without activity for 60 days may be closed as stale. This keeps the issue tracker manageable. Closed issues can be reopened if still relevant.

## Security Issues

**Do not report security vulnerabilities as public issues.**

See [[Security]] for responsible disclosure process.

## See Also

- [[Contributing]] - How to contribute
- [[Pull-Request-Guide]] - Submitting fixes
- [[Security]] - Reporting vulnerabilities
```
