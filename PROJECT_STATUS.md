# PROJECT STATUS

**Last Updated**: 2025-12-25

## Current Focus

No active tasks. Use `/p [description]` to plan new work.

## Just Completed

**T-2025-001: AI Transforms and Community Documentation** (2025-12-25)

- Added OpenAI transforms: edit (inpaint) and variations
- Created @teamflojo/floimg-replicate package with 4 transforms
- Added comprehensive community documentation in vault/community/
- Added GitHub issue and PR templates
- PR #17 merged

## Recent Releases

**v0.5.0** (2025-12-23)

- FloImg Studio packages published to npm
- @teamflojo/floimg-studio-ui v0.1.2
- @teamflojo/floimg-studio-shared v0.1.0
- Docker image: ghcr.io/teamflojo/floimg-studio:0.5.0

**v0.3.2** - Core library with brand refresh (teal accent)

## Package Versions

| Package                         | npm Version | Description                        |
| ------------------------------- | ----------- | ---------------------------------- |
| @teamflojo/floimg               | 0.3.2       | Core library                       |
| @teamflojo/floimg-openai        | 0.1.0       | OpenAI DALL-E + transforms         |
| @teamflojo/floimg-stability     | 0.1.0       | Stability AI SDXL/SD3 + transforms |
| @teamflojo/floimg-google        | 0.1.0       | Google Imagen                      |
| @teamflojo/floimg-replicate     | 0.1.0       | Replicate AI transforms            |
| @teamflojo/floimg-ollama        | 0.1.0       | Ollama local AI                    |
| @teamflojo/floimg-qr            | 0.1.0       | QR code generator                  |
| @teamflojo/floimg-mermaid       | 0.1.0       | Mermaid diagrams                   |
| @teamflojo/floimg-quickchart    | 0.1.0       | Chart.js via QuickChart            |
| @teamflojo/floimg-studio-ui     | 0.1.2       | Studio React components            |
| @teamflojo/floimg-studio-shared | 0.1.0       | Studio shared types                |

## FloImg Studio

Visual workflow builder in `apps/studio/`:

- **Self-hosted**: `docker run -p 5100:5100 ghcr.io/teamflojo/floimg-studio`
- **Cloud**: https://studio.floimg.com

## AI Transform Providers

| Provider            | Operations                                            |
| ------------------- | ----------------------------------------------------- |
| openai-transform    | edit, variations                                      |
| stability-transform | removeBackground, upscale, searchAndReplace, outpaint |
| replicate-transform | faceRestore, colorize, realEsrgan, fluxEdit           |

## Next Up

- Publish updated packages to npm (floimg-openai, floimg-replicate)
- Additional AI provider packages (Anthropic, Gemini)
- More generator plugins

## Blockers

- None

## Notes

- Open-source project (MIT license)
- GitHub Issues for external contributors
- Vault is source of truth for internal task tracking
