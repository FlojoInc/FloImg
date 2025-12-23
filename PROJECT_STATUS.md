# PROJECT STATUS

**Last Updated**: 2025-12-23

## Current Focus

No active tasks. Use `/p [description]` to plan new work.

## Recent Releases

**v0.5.0** (2025-12-23)

- FloImg Studio packages published to npm
- @teamflojo/floimg-studio-ui v0.1.2
- @teamflojo/floimg-studio-shared v0.1.0
- Docker image: ghcr.io/teamflojo/floimg-studio:0.5.0
- Fixed: React context deps externalized as peerDependencies

**v0.4.3** - Bug fixes and stability improvements

**v0.3.2** - Core library with brand refresh (teal accent)

## Package Versions

| Package                         | npm Version | Description             |
| ------------------------------- | ----------- | ----------------------- |
| @teamflojo/floimg               | 0.3.2       | Core library            |
| @teamflojo/floimg-studio-ui     | 0.1.2       | Studio React components |
| @teamflojo/floimg-studio-shared | 0.1.0       | Studio shared types     |
| @teamflojo/floimg-qr            | 0.1.0       | QR code generator       |
| @teamflojo/floimg-mermaid       | 0.1.0       | Mermaid diagrams        |
| @teamflojo/floimg-quickchart    | 0.1.0       | Chart.js via QuickChart |

## FloImg Studio

Visual workflow builder in `apps/studio/`:

- **Self-hosted**: `docker run -p 5100:5100 ghcr.io/teamflojo/floimg-studio`
- **Cloud**: https://studio.floimg.com (via floimg-cloud)

## Next Up

1. Additional AI provider packages (Anthropic, Gemini)
2. More generator plugins
3. Documentation updates for AI features

## Blockers

- None currently

## Notes

- This is an open-source project (MIT license)
- GitHub Issues used for external contributor communication
- Vault is source of truth for internal task tracking
- AI features are optional - all providers use BYOK (Bring Your Own Key)
