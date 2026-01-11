# MCP Server Architecture

## Overview

The `@teamflojo/floimg-mcp` package provides a Model Context Protocol (MCP) server that enables direct integration with AI assistants like Claude Code.

> **Note**: MCP was extracted from the core `@teamflojo/floimg` package into a separate plugin to keep core minimal. See T-2026-122.

## Installation

```bash
npm install -g @teamflojo/floimg-mcp
# or
npx @teamflojo/floimg-mcp
```

## Components

### MCP Server (`packages/floimg-mcp/src/server.ts`)

A complete MCP server implementation using the official TypeScript SDK:

- **stdio transport** - Communicates via standard input/output
- **Three tools** exposed to AI assistants:
  - `generate_image` - Generate images using available generators
  - `transform_image` - Convert formats, resize, optimize
  - `upload_image` - Upload to S3/filesystem and get URLs
- **Full error handling** - Consistent error responses
- **Configuration integration** - Uses floimg's config system

### Binary Entry Point

The `floimg-mcp` binary in `packages/floimg-mcp/package.json`:

```json
{
  "bin": {
    "floimg-mcp": "./dist/server.js"
  }
}
```

## Architecture

### Request Flow

```
Claude Code → JSON-RPC → stdio → floimg-mcp → floimg core → Response
```

1. Claude Code sends JSON-RPC request via stdio
2. MCP server receives and validates request
3. Server calls floimg core library (generate/transform/upload)
4. Results are serialized (base64 for images) and returned
5. Claude Code receives response and continues workflow

### Tool Definitions

#### generate_image

```typescript
{
  generator: string; // e.g., "shapes"
  params: object; // Generator-specific params
}
// Returns: { success: true, blob: { bytes, mime, width, height } }
```

#### transform_image

```typescript
{
  imageBytes: string;     // base64
  mime: string;
  operation: "convert" | "resize" | "optimizeSvg";
  to?: string;            // target mime type
  width?: number;
  height?: number;
}
// Returns: { success: true, blob: { bytes, mime, width, height } }
```

#### upload_image

```typescript
{
  imageBytes: string;     // base64
  mime: string;
  key: string;            // storage key
  provider?: string;      // optional
}
// Returns: { success: true, url, key }
```

## Implementation Details

### Type Safety

All type conversions are handled properly:

- String to `MimeType` - Cast with validation
- Buffer to base64 - For transport over JSON-RPC
- Transform params - Properly structured for client API

### Error Handling

Errors are caught and returned in consistent format:

```json
{
  "success": false,
  "error": "ConfigurationError",
  "message": "No storage provider specified"
}
```

### Configuration

The MCP server inherits all floimg configuration:

- Environment variables (AWS_REGION, S3_BUCKET, etc.)
- Config files (floimg.config.ts, .floimgrc.json, ~/.floimg/config.json)
- CLI arguments (when applicable)

## Technical Decisions

### Why stdio?

- Standard for MCP servers
- Simple, reliable transport
- No HTTP server complexity
- No authentication overhead (handled by host)

### Why base64 for images?

- JSON-RPC requires JSON-serializable data
- Base64 is standard for binary data in JSON
- Easy to decode on client side
- No need for file system temp files

### Why three separate tools?

- **Composability** - Each tool does one thing well
- **Flexibility** - Can use individually or chain them
- **Clarity** - Clear purpose for each operation
- **Efficiency** - Can skip unnecessary steps

### Why same package?

- **Simpler distribution** - One npm install
- **Version alignment** - No drift between library and MCP
- **Shared code** - Uses core library directly
- **Easier maintenance** - Single codebase

## Security Considerations

### Authentication

- MCP host (Claude Code) handles authentication
- Server runs in user's environment
- No network exposure

### Credentials

- AWS credentials from environment or config
- No credentials stored in code
- Uses standard AWS SDK credential chain

### Access Control

- Server has same permissions as user
- S3 operations limited by IAM policy
- No privilege escalation

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK from Anthropic

## Backwards Compatibility

The MCP server is additive - it doesn't change any existing functionality:

- Library API unchanged
- CLI commands unchanged
- Configuration system unchanged
- No breaking changes

Users who don't need MCP can ignore it completely.

---

## Related Documents

- [[Workflow-Abstraction]] - The generate/transform/save primitives
- [[Plugin-Architecture]] - How generators work
- [[Design-Principles]] - Overall philosophy
