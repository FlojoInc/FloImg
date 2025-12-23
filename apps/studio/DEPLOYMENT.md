# Deploying floimg-studio

floimg-studio is open-source and fully self-hostable. Run it on your own infrastructure with your own API keys.

## Quick Start

### Docker (Recommended)

```bash
docker build -t floimg-studio .
docker run -d -p 5100:5100 \
  -e OPENAI_API_KEY=sk-... \
  floimg-studio
```

Access at `http://localhost:5100`

### Docker Compose

```yaml
version: "3.8"
services:
  floimg-studio:
    build: .
    ports:
      - "5100:5100"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
```

### From Source

```bash
git clone https://github.com/teamflojo/floimg.git
cd floimg/apps/studio
pnpm install
pnpm build
pnpm start
```

## Configuration

Copy the example environment file:

```bash
cp .env.production.example .env
```

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
git pull
docker build -t floimg-studio .
docker stop floimg-studio && docker rm floimg-studio
docker run -d --name floimg-studio -p 5100:5100 --env-file .env floimg-studio
```

---

_Don't want to manage infrastructure? A hosted version is available at [studio.floimg.com](https://studio.floimg.com)._
