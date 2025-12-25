# T-2025-001: AI Transforms and Community Documentation

**Status**: COMPLETE
**Created**: 2025-12-25
**Completed**: 2025-12-25

## Summary

Add OpenAI transforms, create Replicate package, and add comprehensive community documentation.

## Deliverables

### New Packages

- [x] `packages/floimg-replicate/` - Replicate integration with 4 AI transforms
  - faceRestore (GFPGAN)
  - colorize (DeOldify)
  - realEsrgan (upscale)
  - fluxEdit (FLUX Kontext text-guided editing)

### Enhanced Packages

- [x] `packages/floimg-openai/src/transforms.ts` - OpenAI edit + variations transforms
- [x] `packages/floimg-stability/README.md` - Package documentation

### Community Documentation

- [x] `vault/community/_index.md` - Map of Content
- [x] `vault/community/Contributing.md` - Contribution guide
- [x] `vault/community/Code-of-Conduct.md` - Contributor Covenant
- [x] `vault/community/Security.md` - Vulnerability reporting
- [x] `vault/community/Development-Setup.md` - Local dev setup
- [x] `vault/community/Pull-Request-Guide.md` - PR best practices
- [x] `vault/community/Issue-Guidelines.md` - Bug reports and features

### GitHub Templates

- [x] `.github/ISSUE_TEMPLATE/bug_report.md`
- [x] `.github/ISSUE_TEMPLATE/feature_request.md`
- [x] `.github/ISSUE_TEMPLATE/config.yml`
- [x] `.github/PULL_REQUEST_TEMPLATE.md`

### Examples

- [x] `examples/ai-transforms.ts` - AI transform examples for all providers
- [x] `examples/pipeline-example.ts` - YAML pipeline workflow examples

### Documentation

- [x] `README.md` - Updated with AI Transform Providers section
- [x] `CHANGELOG.md` - Documented new features

## PR

https://github.com/TeamFlojo/floimg/pull/17 (merged)
