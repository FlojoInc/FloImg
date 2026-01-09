# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in FloImg, please report it responsibly.

### How to Report

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email us at: **security@floimg.com**

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Assessment**: We will assess the vulnerability and determine severity
- **Updates**: We will keep you informed of our progress
- **Resolution**: We aim to resolve critical vulnerabilities within 7 days
- **Credit**: With your permission, we will credit you in the release notes

### Scope

This policy applies to:

- `@teamflojo/floimg` - Core library
- `@teamflojo/floimg-*` - All official plugins
- FloImg Studio (`apps/studio/`)

### Out of Scope

- Third-party dependencies (report to their maintainers)
- Social engineering attacks
- Physical security

## Security Best Practices

When using FloImg:

1. **Keep dependencies updated** - Run `pnpm audit` regularly
2. **Validate inputs** - Sanitize user-provided workflow parameters
3. **Secure API keys** - Use environment variables, never commit secrets
4. **Review workflows** - Audit workflows from untrusted sources before execution

## Security Features

FloImg includes several security measures:

- Input validation on all workflow parameters
- Sandboxed execution environment
- No arbitrary code execution in workflows
- Dependency auditing in CI pipeline
