# Roadmap

Current version: **v0.6.0**

## Now (v0.6.0)

Latest release highlights:

- **Fluent API** - Chainable syntax for building workflows: `floimg.from().transform().to()`
- **AI provider packages** - OpenAI, Stability AI, Google Imagen, and Replicate as separate packages
- **Transform providers** - Self-dispatching architecture with I/O type metadata for visual builder validation
- **Studio alignment** - FloImg Studio now uses the core pipeline runner (same execution path as CLI/API)

See [CHANGELOG](../CHANGELOG.md) for full details.

## Next

Work in progress or committed for upcoming releases:

- **YAML import** - Import workflows into FloImg Studio from CLI/API exports
- **Additional AI transforms** - More Replicate models, improved stability transforms
- **Test coverage** - Targeting 80%+ coverage on core library

## Later

Directional ideas (not committed, no timeline):

- Additional AI providers as they become available
- Workflow branching and fan-out (parallel generation → composite)
- Performance optimizations (caching, memory management)
- Community plugin contribution guidelines

## Non-Goals

Explicitly out of scope:

- Real-time image editing UI (use FloImg Studio)
- Traditional photo editing features (use transforms)
- Video processing
