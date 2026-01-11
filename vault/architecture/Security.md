# Security Architecture

This document covers FloImg's security model for developers and contributors.

## Credential Flow

FloImg uses a layered configuration system. Credentials are resolved at runtime in this order:

1. **CLI arguments** (highest priority) - e.g., `--api-key`
2. **Local config file** - `.floimgrc.json` or `floimg.config.ts`
3. **Global config file** - `~/.floimg/config.json`
4. **Environment variables** (lowest priority)

The resolution happens in `packages/floimg/src/config/loader.ts`.

## Provider Authentication

Each generator plugin handles its own authentication:

| Plugin           | Credential Source     | Authentication Method                |
| ---------------- | --------------------- | ------------------------------------ |
| floimg-openai    | `OPENAI_API_KEY`      | Bearer token in Authorization header |
| floimg-stability | `STABILITY_API_KEY`   | Bearer token in Authorization header |
| floimg-replicate | `REPLICATE_API_TOKEN` | Token header                         |

Plugins read credentials via the config loader and pass them to their respective SDK clients.

## Cloud Storage Authentication

S3 and S3-compatible storage (R2, Tigris) use the AWS SDK credential chain:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. Shared credentials file (`~/.aws/credentials`)
3. IAM role (EC2, ECS, Lambda)

Implementation: `packages/floimg/src/save/s3.ts`

## MCP Server Security

The MCP server (`packages/floimg-mcp/src/server.ts`) runs as a subprocess spawned by Claude Code.

### Credential Isolation

- The MCP server inherits environment variables from the parent Claude Code process
- API calls are made from within the MCP server process
- Tool results returned to Claude contain only operation outcomes, not credentials

### Tool Response Design

MCP tools are designed to return minimal information:

```typescript
// Good: Returns only what's needed
return { success: true, path: "/output/image.png" };

// Bad: Never include credentials in responses
return { success: true, apiKey: process.env.OPENAI_API_KEY }; // DON'T DO THIS
```

### What Flows to Anthropic

When using Claude Code:

- User messages → Anthropic
- Tool call parameters → Anthropic
- Tool call results → Anthropic
- Environment variables → NOT sent (unless a tool explicitly outputs them)

## Plugin Security Guidelines

When developing FloImg plugins:

1. **Read credentials via config loader** - Don't access `process.env` directly
2. **Never log credentials** - Even at debug level
3. **Never include credentials in error messages** - Sanitize before throwing
4. **Never return credentials in tool responses** - Return only operation results

Example:

```typescript
// packages/floimg-example/src/index.ts
import { createGenerator } from "@teamflojo/floimg";

export default createGenerator(
  {
    name: "example",
    // ...
  },
  async (params, ctx) => {
    const apiKey = ctx.config.providers?.example?.apiKey;

    if (!apiKey) {
      // Good: Generic error without exposing config structure
      throw new Error("Example API key not configured");
    }

    // Use the key internally, never expose it
    const result = await exampleApi.generate(params, { apiKey });

    // Return only the result, not the key
    return ctx.createImageFromBuffer(result.buffer, "output.png");
  }
);
```

## Threat Model

### What FloImg Protects Against

- **Accidental credential exposure**: Config commands mask sensitive values
- **Credential in logs**: SDK clients don't log auth headers
- **Credential in error messages**: Plugins sanitize errors

### What FloImg Does Not Protect Against

- **Malicious plugins**: If you install a malicious plugin, it has access to your credentials
- **Compromised machine**: FloImg runs locally with your user permissions
- **Intentional exposure**: If you run `echo $OPENAI_API_KEY`, that's on you

### Trust Boundaries

```
┌─────────────────────────────────────────┐
│           Your Machine                   │
│  ┌─────────────────────────────────┐    │
│  │     FloImg CLI / MCP Server     │    │
│  │  - Reads credentials from env   │    │
│  │  - Makes API calls to providers │    │
│  └──────────────┬──────────────────┘    │
│                 │                        │
│                 ▼                        │
│  ┌─────────────────────────────────┐    │
│  │   External API Providers        │    │
│  │   (OpenAI, Stability, AWS)      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           Anthropic (Claude Code)        │
│  - Receives conversation + tool results │
│  - Does NOT receive env vars directly   │
└─────────────────────────────────────────┘
```

## Security Checklist for Contributors

When submitting PRs:

- [ ] No credentials hardcoded in code
- [ ] No credentials logged (even at debug level)
- [ ] Error messages don't expose credentials or config paths
- [ ] Test files don't contain real API keys
- [ ] MCP tool responses don't include sensitive data

## Related Documentation

- [Configuration](./Configuration.md) - Config file formats and precedence
- [Plugin Architecture](./Plugin-Architecture.md) - How plugins work
- [floimg.com/docs/security](https://floimg.com/docs/security) - User-facing security guide
