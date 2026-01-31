# Version Management

How to check what version of FloImg Studio you're running.

## Quick Check

```bash
# Check version via API
curl http://localhost:5100/api/version

# Example response
{
  "service": "floimg-studio-oss",
  "version": "0.21.1",
  "commit": "abc1234def5678...",
  "buildTime": "2026-01-30T10:00:00Z",
  "nodeEnv": "production"
}
```

## Version Information

### Fields Explained

| Field       | Description                                        |
| ----------- | -------------------------------------------------- |
| `service`   | Always "floimg-studio-oss"                         |
| `version`   | Release version (e.g., "0.21.1") - matches git tag |
| `commit`    | Full git commit SHA                                |
| `buildTime` | When the Docker image was built (ISO 8601)         |
| `nodeEnv`   | Environment mode (production/development)          |

### Version Sources

When running from Docker (`ghcr.io/flojoinc/floimg-studio`):

- **version**: From `APP_VERSION` build arg (set during release builds)
- **commit**: From `GIT_COMMIT` build arg
- **buildTime**: From `BUILD_TIME` build arg

When running from source:

- **version**: From `npm_package_version` (package.json)
- **commit**: "unknown" (unless `GIT_COMMIT` env var set)
- **buildTime**: "unknown" (unless `BUILD_TIME` env var set)

## UI Version Display

The version is displayed in the Node Palette panel:

```
FloImg Studio v0.21.1 (abc1234)
```

This is injected at build time via Vite's `define` configuration.

## Docker Image Tags

### Available Tags

| Tag          | Description                        |
| ------------ | ---------------------------------- |
| `latest`     | Most recent build from main branch |
| `main-{sha}` | Specific commit from main branch   |
| `X.Y.Z`      | Specific release version           |

### Checking Your Image

```bash
# What tag are you running?
docker inspect floimg-studio --format '{{.Config.Image}}'

# Check the image digest
docker inspect ghcr.io/flojoinc/floimg-studio:latest --format '{{.Id}}'
```

## Updating to Latest

```bash
# Pull latest image
docker pull ghcr.io/flojoinc/floimg-studio:latest

# Restart container
docker compose down && docker compose up -d

# Or if using docker run
docker stop floimg-studio
docker rm floimg-studio
docker run -d --name floimg-studio -p 5100:5100 ghcr.io/flojoinc/floimg-studio:latest
```

## Pinning Versions

For production stability, pin to a specific version:

```yaml
# docker-compose.yaml
services:
  studio:
    image: ghcr.io/flojoinc/floimg-studio:0.21.1 # Pinned version
```

Check available versions at: https://github.com/FlojoInc/floimg/pkgs/container/floimg-studio

## Release Notes

See [CHANGELOG.md](../../CHANGELOG.md) for version history and release notes.

## Troubleshooting

### Version shows "unknown"

The Docker image wasn't built with version information. This can happen with:

- Local development builds
- Builds without the proper build args

### Outdated version

If `/api/version` shows an old version but you pulled `:latest`:

1. Check your Docker image: `docker images | grep floimg-studio`
2. Verify the pull worked: `docker pull ghcr.io/flojoinc/floimg-studio:latest`
3. Restart the container after pulling

### UI shows different version than API

The UI version is baked in at build time. If they differ:

- The frontend static files might be cached
- Try a hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
