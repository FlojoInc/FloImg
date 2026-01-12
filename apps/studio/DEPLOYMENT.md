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

For persistent image storage, configure S3-compatible storage:

```bash
S3_BUCKET=my-bucket
S3_REGION=auto
S3_ENDPOINT=https://...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
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
