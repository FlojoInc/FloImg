# Using S3-Compatible Storage Providers

imgflo's S3Provider works with AWS S3 and any S3-compatible storage service (Cloudflare R2, Tigris, Backblaze B2, DigitalOcean Spaces, etc.).

## Basic S3 Setup

### AWS S3

```typescript
import createClient, { S3Provider } from 'imgflo';

const imgflo = createClient();

imgflo.registerStoreProvider(new S3Provider({
  bucket: 'my-bucket',
  region: 'us-east-1',
  // Credentials are optional if using IAM roles
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
}));

// Upload
const result = await imgflo.upload({
  blob: imageBlob,
  key: 'images/photo.png'
});

console.log(result.url);
// https://my-bucket.s3.us-east-1.amazonaws.com/images/photo.png
```

## S3-Compatible Services

### Cloudflare R2

```typescript
imgflo.registerStoreProvider(new S3Provider({
  name: 'r2', // Custom name to avoid conflicts
  bucket: 'my-r2-bucket',
  region: 'auto',
  endpoint: 'https://<account-id>.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  },
  // Custom public URL if using R2 custom domain
  publicUrl: 'https://cdn.example.com'
}));

await imgflo.upload({
  blob: imageBlob,
  key: 'images/photo.png',
  provider: 'r2' // Specify which provider to use
});
```

### Tigris

```typescript
imgflo.registerStoreProvider(new S3Provider({
  name: 'tigris',
  bucket: 'my-tigris-bucket',
  region: 'auto',
  endpoint: 'https://fly.storage.tigris.dev',
  credentials: {
    accessKeyId: process.env.TIGRIS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TIGRIS_SECRET_ACCESS_KEY!
  }
}));
```

### Backblaze B2

```typescript
imgflo.registerStoreProvider(new S3Provider({
  name: 'b2',
  bucket: 'my-b2-bucket',
  region: 'us-west-004',
  endpoint: 'https://s3.us-west-004.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!
  }
}));
```

### DigitalOcean Spaces

```typescript
imgflo.registerStoreProvider(new S3Provider({
  name: 'do-spaces',
  bucket: 'my-space',
  region: 'nyc3',
  endpoint: 'https://nyc3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!
  },
  // DigitalOcean Spaces CDN URL
  publicUrl: 'https://my-space.nyc3.cdn.digitaloceanspaces.com'
}));
```

## Multiple Providers Simultaneously

You can register multiple S3-compatible providers and choose which one to use for each upload:

```typescript
import createClient, { S3Provider } from 'imgflo';

const imgflo = createClient();

// Register AWS S3
imgflo.registerStoreProvider(new S3Provider({
  name: 'aws',
  bucket: 'aws-bucket',
  region: 'us-east-1'
}));

// Register Cloudflare R2
imgflo.registerStoreProvider(new S3Provider({
  name: 'r2',
  bucket: 'r2-bucket',
  region: 'auto',
  endpoint: 'https://account-id.r2.cloudflarestorage.com',
  credentials: { /* ... */ }
}));

// Register Tigris
imgflo.registerStoreProvider(new S3Provider({
  name: 'tigris',
  bucket: 'tigris-bucket',
  region: 'auto',
  endpoint: 'https://fly.storage.tigris.dev',
  credentials: { /* ... */ }
}));

// Upload to different providers
await imgflo.upload({ blob, key: 'image1.png', provider: 'aws' });
await imgflo.upload({ blob, key: 'image2.png', provider: 'r2' });
await imgflo.upload({ blob, key: 'image3.png', provider: 'tigris' });
```

## Credentials

```typescript
new S3Provider({
  bucket: 'my-bucket',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIA...',
    secretAccessKey: 'secret...',
    sessionToken: 'token...' // Optional, for temporary credentials
  }
})
```

Credentials are optional if you're using IAM roles (recommended for production).

## Custom Public URLs

### Simple Base URL

```typescript
new S3Provider({
  bucket: 'my-bucket',
  region: 'us-east-1',
  publicUrl: 'https://cdn.example.com'
})

// Uploads to: s3://my-bucket/images/photo.png
// Returns URL: https://cdn.example.com/images/photo.png
```

### URL Templates

Use `{bucket}`, `{region}`, and `{key}` placeholders:

```typescript
new S3Provider({
  bucket: 'assets',
  region: 'us-west-2',
  publicUrl: 'https://cdn.example.com/{bucket}/{key}'
})

// Uploads to: s3://assets/images/photo.png
// Returns URL: https://cdn.example.com/assets/images/photo.png
```

### CDN URLs

```typescript
// CloudFront
new S3Provider({
  bucket: 'my-bucket',
  region: 'us-east-1',
  publicUrl: 'https://d111111abcdef8.cloudfront.net'
})

// Cloudflare R2 with custom domain
new S3Provider({
  name: 'r2',
  bucket: 'my-bucket',
  region: 'auto',
  endpoint: 'https://account-id.r2.cloudflarestorage.com',
  publicUrl: 'https://images.example.com',
  credentials: { /* ... */ }
})
```

## Configuration File Setup

### imgflo.config.ts

```typescript
import { defineConfig } from 'imgflo/config';

export default defineConfig({
  store: {
    default: 'aws', // Default provider
    aws: {
      name: 'aws',
      bucket: process.env.AWS_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1'
    },
    r2: {
      name: 'r2',
      bucket: process.env.R2_BUCKET,
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      },
      publicUrl: process.env.R2_PUBLIC_URL
    }
  }
});
```

### Environment Variables

```bash
# AWS S3
AWS_BUCKET=my-aws-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=secret...

# Cloudflare R2
R2_BUCKET=my-r2-bucket
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=key...
R2_SECRET_ACCESS_KEY=secret...
R2_PUBLIC_URL=https://cdn.example.com

# Tigris
TIGRIS_BUCKET=my-tigris-bucket
TIGRIS_ENDPOINT=https://fly.storage.tigris.dev
TIGRIS_ACCESS_KEY_ID=key...
TIGRIS_SECRET_ACCESS_KEY=secret...
```

## Upload Result

The upload result always includes a public URL:

```typescript
interface UploadResult {
  key: string;        // Storage key (e.g., "images/photo.png")
  url: string;        // Public URL (auto-generated)
  etag?: string;      // ETag from S3
  metadata?: object;  // Additional metadata
}

const result = await imgflo.upload({ blob, key: 'photo.png' });

console.log(result);
// {
//   key: "photo.png",
//   url: "https://my-bucket.s3.us-east-1.amazonaws.com/photo.png",
//   etag: "\"abc123\"",
//   metadata: { versionId: "..." }
// }
```

## Best Practices

### 1. Use Named Providers
Always specify a `name` when using multiple S3-compatible services:

```typescript
// ✅ Good - Can use multiple providers
new S3Provider({ name: 'aws', ... })
new S3Provider({ name: 'r2', ... })

// ❌ Bad - Second provider overwrites first
new S3Provider({ ... }) // name defaults to 's3'
new S3Provider({ ... }) // overwrites previous
```

### 2. Set Default Provider
Configure a default in your config file:

```typescript
{
  store: {
    default: 'aws', // Used when provider not specified
    aws: { ... },
    r2: { ... }
  }
}
```

### 3. Use Environment Variables
Keep credentials out of code:

```typescript
credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
}
```

### 4. Custom Public URLs for CDNs
Use CDN URLs for better performance:

```typescript
publicUrl: 'https://cdn.example.com'
```

## Troubleshooting

### URLs Don't Match Expected Format

Check your `publicUrl` configuration. If not set, imgflo uses default AWS format:
```
https://{bucket}.s3.{region}.amazonaws.com/{key}
```

### Multiple Providers Conflict

Ensure each provider has a unique `name`:
```typescript
name: 'aws'    // ✅
name: 'r2'     // ✅
name: 'tigris' // ✅
```

### Credentials Not Working

1. Check environment variables are set
2. Try both flat and nested credential formats
3. Verify credentials have correct permissions

### Wrong Endpoint

For S3-compatible services, verify the correct endpoint:
- R2: `https://<account-id>.r2.cloudflarestorage.com`
- Tigris: `https://fly.storage.tigris.dev`
- B2: `https://s3.{region}.backblazeb2.com`

## See Also

- [Quick Start Guide](./QUICK_START.md)
- [Configuration](../../README.md#configuration)
- [API Documentation](../../README.md)
