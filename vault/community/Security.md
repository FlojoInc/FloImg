# Security Policy

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in floimg, please report it responsibly:

### Email

Send details to: **security@floimg.com**

### What to Include

Please include as much of the following information as possible:

- Type of vulnerability (e.g., RCE, XSS, path traversal, DoS)
- Affected component (package name, file path)
- Step-by-step instructions to reproduce
- Proof-of-concept or exploit code (if available)
- Impact assessment
- Any suggested fixes

### Response Timeline

| Stage              | Timeline              |
| ------------------ | --------------------- |
| Acknowledgment     | Within 48 hours       |
| Initial assessment | Within 1 week         |
| Fix development    | Depends on severity   |
| Public disclosure  | After fix is released |

## Supported Versions

Security updates are provided for:

| Version        | Supported                 |
| -------------- | ------------------------- |
| Latest         | Yes                       |
| Previous minor | 90 days after new release |
| Older versions | No                        |

We recommend always using the latest version.

## Security Considerations

### API Keys

floimg integrates with external AI services that require API keys:

- **Never commit API keys** to version control
- Use environment variables for all secrets
- The CLI reads from `.env` files (gitignored by default)
- In production, use secure secret management

```bash
# Good: Environment variable
export OPENAI_API_KEY=sk-...

# Good: .env file (gitignored)
echo "OPENAI_API_KEY=sk-..." >> .env

# Bad: Hardcoded in source
const client = openai({ apiKey: "sk-..." });  // Don't do this
```

### File System Access

floimg can read and write files:

- Validate file paths in user-facing applications
- Be cautious with user-provided paths in pipelines
- The S3 provider requires explicit bucket configuration

### Pipeline Execution

YAML pipelines execute arbitrary operations:

- Review pipelines before running untrusted YAML
- Pipeline parameters are not sandboxed
- Consider the source of any external pipelines

### MCP Server

The MCP server exposes floimg capabilities to AI agents:

- MCP runs with the permissions of the host process
- Image IDs are session-scoped but not cryptographically secure
- The workspace directory is accessible to the AI agent

## Dependencies

We monitor dependencies for known vulnerabilities using:

- GitHub Dependabot
- npm audit

To check for vulnerabilities locally:

```bash
pnpm audit
```

## Best Practices for Users

### In Applications

1. **Validate inputs** - Don't pass untrusted input directly to floimg
2. **Limit file access** - Restrict read/write to specific directories
3. **Audit pipelines** - Review YAML pipelines before execution
4. **Rotate keys** - Regularly rotate API keys for AI services

### In CI/CD

1. **Use secrets management** - Never hardcode API keys
2. **Pin versions** - Use specific versions, not `latest`
3. **Scan images** - If using Docker, scan for vulnerabilities

## Disclosure Policy

We follow coordinated disclosure:

1. Reporter submits vulnerability privately
2. We acknowledge and assess
3. We develop and test a fix
4. We release the fix
5. We publish a security advisory
6. Reporter may publish after disclosure

We credit reporters in security advisories unless they prefer anonymity.

## Security Advisories

Past security advisories are published on:

- [GitHub Security Advisories](https://github.com/TeamFlojo/floimg/security/advisories)

## Contact

- **Security issues**: security@floimg.com
- **General questions**: [GitHub Discussions](https://github.com/TeamFlojo/floimg/discussions)

## See Also

- [[Contributing]] - General contribution guidelines
- [[../architecture/Configuration]] - Configuration and secrets
