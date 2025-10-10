# imgflo Configuration Guide

## Overview

imgflo supports flexible configuration through multiple sources, with a clear priority system:

**Priority (highest to lowest):**
1. **CLI arguments** - Immediate overrides (`--bucket`, `--region`, etc.)
2. **Local config file** - Project-specific settings (`./imgflo.config.ts`)
3. **Global config file** - User-wide settings (`~/.imgflo/config.json`)
4. **Environment variables** - Fallback option

## Quick Start

### Interactive Setup

The easiest way to configure imgflo:

```bash
imgflo config init
```

This will guide you through setting up S3 and OpenAI credentials.

### Manual Setup

#### Option 1: Global Configuration (Recommended)

Set configuration values that work across all projects:

```bash
# Set S3 credentials
imgflo config set s3.bucket my-images-bucket
imgflo config set s3.region us-east-1

# Set OpenAI (future feature)
imgflo config set openai.apiKey sk-...

# View config
imgflo config get
```

Global config is stored at: `~/.imgflo/config.json`

#### Option 2: Local Project Configuration

Create `imgflo.config.ts` in your project root:

```typescript
import { defineConfig } from 'imgflo/config';

export default defineConfig({
  store: {
    default: 's3',
    s3: {
      region: 'us-east-1',
      bucket: 'my-project-images',
    }
  },
  ai: {
    default: 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    }
  }
});
```

Or use JSON (`.imgflorc.json`):

```json
{
  "store": {
    "default": "s3",
    "s3": {
      "region": "us-east-1",
      "bucket": "my-project-images"
    }
  }
}
```

#### Option 3: Environment Variables

```bash
export AWS_REGION=us-east-1
export S3_BUCKET=my-images-bucket
export OPENAI_API_KEY=sk-...
```

## Configuration Options

### Storage Providers

#### S3 Configuration

```typescript
{
  store: {
    default: 's3',
    s3: {
      region: 'us-east-1',           // AWS region
      bucket: 'my-bucket',             // S3 bucket name
      accessKeyId: '...',              // Optional: AWS access key
      secretAccessKey: '...',          // Optional: AWS secret key
      endpoint: 'https://...',         // Optional: Custom S3 endpoint
      publicUrl: 'https://cdn.../\     // Optional: CDN URL for uploaded files
    }
  }
}
```

Via CLI:
```bash
imgflo config set s3.bucket my-bucket
imgflo config set s3.region us-west-2
```

#### Filesystem Storage

```typescript
{
  store: {
    default: 'fs',
    fs: {
      basePath: './output',            // Local directory
      baseUrl: 'https://example.com'   // Optional: Base URL for files
    }
  }
}
```

### AI Providers (Future)

#### OpenAI Configuration

```typescript
{
  ai: {
    default: 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      organization: 'org-...'  // Optional
    }
  }
}
```

Via CLI:
```bash
imgflo config set openai.apiKey sk-...
```

## CLI Argument Overrides

All config can be overridden via CLI arguments:

### Upload Command

```bash
# Override S3 bucket for this upload
imgflo upload \
  --in image.png \
  --key test.png \
  --bucket different-bucket \
  --region us-west-1
```

### Generate Command

```bash
# Specify provider explicitly
imgflo generate \
  --provider svg \
  --name shapes \
  --params '{"type":"gradient"}' \
  --out bg.svg
```

## Configuration Management

### View Configuration

```bash
# Show all config
imgflo config get

# Show specific value
imgflo config get s3.bucket
imgflo config get store
```

### Set Configuration

```bash
# Set S3 bucket
imgflo config set s3.bucket my-new-bucket

# Set S3 region
imgflo config set s3.region eu-west-1

# Set OpenAI key
imgflo config set openai.apiKey sk-...
```

### Find Config File Locations

```bash
imgflo config path
```

Shows:
- Current directory config files
- Global config location
- Which config is being used

### Verify Configuration

```bash
imgflo doctor
```

Shows:
- Which config files exist
- Current configuration values
- Environment variables
- Suggestions if misconfigured

## Examples

### Example 1: Per-Project Buckets

```bash
# In project A
cd ~/projects/website-a
echo '{"store":{"s3":{"bucket":"website-a-images"}}}' > .imgflorc.json
imgflo upload --in logo.png --key logo.png

# In project B
cd ~/projects/website-b
echo '{"store":{"s3":{"bucket":"website-b-images"}}}' > .imgflorc.json
imgflo upload --in logo.png --key logo.png
```

### Example 2: Global + Override

```bash
# Set global default
imgflo config set s3.bucket default-bucket
imgflo config set s3.region us-east-1

# Use global config
imgflo upload --in image.png --key test.png
# Uploads to: default-bucket

# Override for one upload
imgflo upload --in image.png --key test.png --bucket special-bucket
# Uploads to: special-bucket
```

### Example 3: Local + Environment

Create `imgflo.config.ts`:

```typescript
import { defineConfig } from 'imgflo/config';

export default defineConfig({
  store: {
    default: 's3',
    s3: {
      // Bucket from environment
      bucket: process.env.S3_BUCKET || 'fallback-bucket',
      region: 'us-east-1',
    }
  }
});
```

Then:
```bash
export S3_BUCKET=production-images
imgflo upload --in image.png --key prod.png
# Uses: production-images bucket

S3_BUCKET=staging-images imgflo upload --in image.png --key staging.png
# Uses: staging-images bucket
```

## Security Best Practices

### DO ✅

- Store sensitive values in environment variables
- Use IAM roles when running on AWS
- Use global config (`~/.imgflo/config.json`) for personal projects
- Use local config (`imgflo.config.ts`) with env vars for team projects
- Add `.imgflorc.json` to `.gitignore` if it contains secrets

### DON'T ❌

- Commit API keys or secrets to git
- Hard-code credentials in config files
- Share global config between team members
- Store production credentials in local configs

## AWS Credentials

imgflo uses the AWS SDK, which looks for credentials in this order:

1. CLI arguments (`--accessKeyId`, if we add this)
2. imgflo config file
3. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
4. AWS credentials file (`~/.aws/credentials`)
5. IAM role (when running on EC2, ECS, Lambda, etc.)

**Recommendation**: Use IAM roles in production, credentials file for development.

## TypeScript IntelliSense

When using `imgflo.config.ts`, you get full autocomplete:

```typescript
import { defineConfig } from 'imgflo/config';

export default defineConfig({
  // TypeScript will autocomplete and type-check this
  store: {
    default: 's3',  // Autocomplete: 's3' | 'fs'
    s3: {
      bucket: '',   // Autocomplete: required
      region: '',   // Autocomplete: required
    }
  }
});
```

## Troubleshooting

### "No storage provider configured"

Fix:
```bash
# Set S3 bucket
imgflo config set s3.bucket your-bucket-name
imgflo config set s3.region us-east-1

# Or use environment variables
export S3_BUCKET=your-bucket-name
export AWS_REGION=us-east-1
```

### "Access Denied" when uploading to S3

Check:
1. Bucket name is correct: `imgflo config get s3.bucket`
2. Region is correct: `imgflo config get s3.region`
3. AWS credentials are valid: `aws s3 ls s3://your-bucket`
4. IAM permissions allow `s3:PutObject`

### Config not loading

Debug:
```bash
# Check which configs exist
imgflo doctor

# Check config search paths
imgflo config path

# View current config
imgflo config get
```

### Can't find global config

The global config should be at:
- **macOS/Linux**: `~/.imgflo/config.json`
- **Windows**: `%USERPROFILE%\.imgflo\config.json`

Create it manually or use:
```bash
imgflo config init
```

## Migration from Environment Variables

If you're currently using environment variables, migrate like this:

```bash
# Old way
export S3_BUCKET=my-bucket
export AWS_REGION=us-east-1
imgflo upload --in image.png --key test.png

# New way (global config)
imgflo config set s3.bucket my-bucket
imgflo config set s3.region us-east-1
imgflo upload --in image.png --key test.png

# Remove environment variables
unset S3_BUCKET AWS_REGION
```

Now it just works without needing to set env vars every time!
