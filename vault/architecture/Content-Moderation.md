# Content Moderation

FloImg Studio implements content moderation to ensure generated and uploaded images comply with safety guidelines.

## Approach: Scan Before Save

**Nothing touches disk without passing moderation.** Images are scanned after generation, before persistence.

```
Generator → Image Buffer → Moderation API → Pass? → Save to Disk
                                          → Fail? → Block + Log Incident
```

## Implementation

**Location**: `apps/studio/backend/src/moderation/moderator.ts`

### Moderation Provider

- **Service**: OpenAI Moderation API
- **Model**: `omni-moderation-latest`
- **Requirement**: `OPENAI_API_KEY` environment variable

### Categories Checked

OpenAI's moderation API checks for:

| Category                 | Description                     |
| ------------------------ | ------------------------------- |
| `sexual`                 | Sexual content                  |
| `sexual/minors`          | Sexual content involving minors |
| `hate`                   | Hate speech                     |
| `hate/threatening`       | Threatening hate speech         |
| `harassment`             | Harassing content               |
| `harassment/threatening` | Threatening harassment          |
| `self-harm`              | Self-harm content               |
| `self-harm/intent`       | Self-harm intent                |
| `self-harm/instructions` | Self-harm instructions          |
| `violence`               | Violent content                 |
| `violence/graphic`       | Graphic violence                |

### Format Handling

| Format               | Handling                                   |
| -------------------- | ------------------------------------------ |
| PNG, JPEG, GIF, WebP | Sent directly to OpenAI                    |
| SVG                  | Converted to PNG via Resvg, then moderated |
| AVIF                 | Passed through (moderation skipped)        |

**Why convert SVG?** OpenAI's API only supports raster formats. SVGs can contain embedded images or render inappropriate text, so we rasterize them first to ensure the visual content is scanned.

**Why skip AVIF?** AVIF is a newer format not commonly used for abuse. Converting it requires additional dependencies. This may be revisited if AVIF adoption increases.

## Configuration

| Environment Variable     | Description                             | Default                    |
| ------------------------ | --------------------------------------- | -------------------------- |
| `OPENAI_API_KEY`         | Required for moderation to work         | None (moderation disabled) |
| `MODERATION_STRICT_MODE` | Block content when moderation API fails | `false`                    |

### Strict Mode

- **FSC (FloImg Studio Cloud)**: `MODERATION_STRICT_MODE=true` - API failures block content (safe default for cloud)
- **Self-hosted**: `MODERATION_STRICT_MODE=false` - API failures allow content with warning (permissive for local use)

## What Happens When Content is Flagged

1. **Save blocked**: Image is not written to disk
2. **Incident logged**: Details written to `./data/moderation/incidents.jsonl`
3. **Error returned**: Client receives "Content policy violation" error
4. **Console warning**: Category details logged for debugging

### Incident Log Format

```json
{
  "timestamp": "2025-12-30T12:00:00.000Z",
  "type": "generated",
  "flagged": true,
  "categories": ["violence"],
  "scores": { "violence": 0.95, "violence/graphic": 0.82 },
  "context": { "nodeId": "node_1" }
}
```

Logs are append-only JSONL for easy parsing and compliance auditing.

## API Functions

### `moderateImage(buffer, mimeType)`

Moderate a single image buffer. Handles format conversion internally.

```typescript
const result = await moderateImage(imageBuffer, "image/png");
if (result.flagged) {
  // Handle violation
}
```

### `moderateText(text)`

Moderate text content (useful for chart labels, diagram text, etc.).

### `moderateContent(text?, imageBuffer?, mimeType?)`

Moderate both text and image together. Flagged if either is flagged.

### `logModerationIncident(type, result, context?)`

Log an incident for admin review.

### `getRecentIncidents(limit?)`

Retrieve recent incidents for admin dashboard.

## Self-Hosted Considerations

Self-hosted users can:

1. **Disable moderation**: Don't set `OPENAI_API_KEY`
2. **Use permissive mode**: Default `MODERATION_STRICT_MODE=false`
3. **Provide own key**: Use their own OpenAI API key

When moderation is disabled, all content passes through with a console warning.

## Future Enhancements

- **Manual review queue**: Admin dashboard for edge cases
- **Appeals process**: Users can request review of false positives
- **Alternative providers**: Support for other moderation APIs (AWS Rekognition, Google Cloud Vision)
- **Configurable thresholds**: Allow tuning sensitivity per category
- **CSAM detection**: PhotoDNA integration for legal compliance

## Related

- [[Deployment-Architecture]] - Environment variable configuration
- OpenAI Moderation API: https://platform.openai.com/docs/guides/moderation
