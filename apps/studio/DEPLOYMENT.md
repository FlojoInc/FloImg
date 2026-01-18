# Deploying FloImg Studio

FloImg Studio is open-source and fully self-hostable. Run it on your own infrastructure with your own API keys.

## Quick Start

### Docker (Recommended)

Pre-built images are available on GitHub Container Registry:

```bash
docker run -d -p 5100:5100 \
  -e OPENAI_API_KEY=sk-... \
  ghcr.io/flojoinc/floimg-studio
```

Access at `http://localhost:5100`

### Docker Compose

```yaml
version: "3.8"
services:
  floimg-studio:
    image: ghcr.io/flojoinc/floimg-studio:latest
    ports:
      - "5100:5100"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
```

### Build from Source

```bash
git clone https://github.com/FlojoInc/floimg.git
cd floimg
pnpm install
pnpm -r build
cd apps/studio/backend
pnpm start
```

Or build your own Docker image:

```bash
git clone https://github.com/FlojoInc/floimg.git
cd floimg
docker build -f apps/studio/Dockerfile -t floimg-studio .
docker run -d -p 5100:5100 -e OPENAI_API_KEY=sk-... floimg-studio
```

## Configuration

### Required

| Variable         | Description               |
| ---------------- | ------------------------- |
| `OPENAI_API_KEY` | For AI-powered generators |

### Optional

| Variable            | Default | Description             |
| ------------------- | ------- | ----------------------- |
| `PORT`              | 5100    | Server port             |
| `HOST`              | 0.0.0.0 | Bind address            |
| `ANTHROPIC_API_KEY` | -       | Alternative AI provider |

### Storage (Optional)

FloImg Studio supports pluggable storage backends. By default, images are saved to the filesystem (zero config). For cloud or network storage, configure an S3-compatible backend.

#### Filesystem (Default)

Works out of the box. Optionally configure a custom base directory:

```bash
FLOIMG_SAVE_FS_BASE_DIR=/data/images
```

#### S3-Compatible Storage

Works with AWS S3, MinIO, Cloudflare R2, Backblaze B2, etc:

```bash
FLOIMG_SAVE_S3_BUCKET=my-bucket
FLOIMG_SAVE_S3_REGION=us-east-1
FLOIMG_SAVE_S3_ENDPOINT=https://s3.amazonaws.com  # Optional, for non-AWS
FLOIMG_SAVE_S3_ACCESS_KEY_ID=AKIA...
FLOIMG_SAVE_S3_SECRET_ACCESS_KEY=...
```

**MinIO example** (local development or self-hosted):

```bash
FLOIMG_SAVE_S3_BUCKET=floimg
FLOIMG_SAVE_S3_REGION=us-east-1
FLOIMG_SAVE_S3_ENDPOINT=http://localhost:9000
FLOIMG_SAVE_S3_ACCESS_KEY_ID=minioadmin
FLOIMG_SAVE_S3_SECRET_ACCESS_KEY=minioadmin
```

## Architecture

The production build serves everything from a single container:

```
┌──────────────────────────────┐
│      floimg-studio           │
│  ┌────────────────────────┐  │
│  │   Fastify Server       │  │
│  │   - API routes (/api/) │  │
│  │   - Static files (/)   │  │
│  │   - WebSocket          │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## Platform Support

The pre-built Docker image is currently **x86 (amd64) only**.

**Apple Silicon (M1/M2/M3) users**: Build from source instead of using the pre-built image:

```bash
git clone https://github.com/FlojoInc/floimg.git
cd floimg
docker build -f apps/studio/Dockerfile -t floimg-studio .
docker run -d -p 5100:5100 -e OPENAI_API_KEY=sk-... floimg-studio
```

Multi-arch builds (amd64 + arm64) are planned for a future release.

## Health Check

```bash
curl http://localhost:5100/api/health
```

## Updating

```bash
docker pull ghcr.io/flojoinc/floimg-studio:latest
docker stop floimg-studio && docker rm floimg-studio
docker run -d --name floimg-studio -p 5100:5100 --env-file .env ghcr.io/flojoinc/floimg-studio
```

## npm Packages

For advanced usage, FloImg Studio components are available on npm:

- `@teamflojo/floimg-studio-ui` - React components (for building custom UIs)
- `@teamflojo/floimg-studio-shared` - Shared types

---

_Don't want to manage infrastructure? A hosted version is available at [studio.floimg.com](https://studio.floimg.com)._
