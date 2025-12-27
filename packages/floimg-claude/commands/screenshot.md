---
description: Capture a screenshot of a webpage using Playwright
allowed-tools: Bash
---

# Webpage Screenshot

Capture a screenshot of: "$ARGUMENTS"

## Instructions

1. **Parse the URL** from the user's request:
   - Add `https://` if missing
   - Note any viewport or device preferences
   - Check if full-page capture is requested

2. **Run the floimg CLI** to capture the screenshot:

```bash
npx -y @teamflojo/floimg screenshot "URL" -o ./screenshot.png
```

3. **Report the result** to the user:
   - Confirm the file path and dimensions
   - Offer to crop, resize, or capture different viewport

## Examples

**Basic screenshot:**

```bash
npx -y @teamflojo/floimg screenshot "https://github.com" -o ./github.png
```

**Full page capture:**

```bash
npx -y @teamflojo/floimg screenshot "https://docs.floimg.com" --full-page -o ./docs-full.png
```

**Mobile viewport:**

```bash
npx -y @teamflojo/floimg screenshot "https://example.com" --width 375 --height 812 --device-scale 2 -o ./mobile.png
```

**Desktop HD:**

```bash
npx -y @teamflojo/floimg screenshot "https://example.com" --width 1920 --height 1080 -o ./desktop-hd.png
```

## Optional Flags

| Flag             | Description                    | Default |
| ---------------- | ------------------------------ | ------- |
| `--full-page`    | Capture entire scrollable page | false   |
| `--width`        | Viewport width in pixels       | 1280    |
| `--height`       | Viewport height in pixels      | 720     |
| `--device-scale` | Pixel density (2 for Retina)   | 1       |
| `--format`       | Output format (png, jpeg)      | png     |
| `--quality`      | JPEG quality (1-100)           | 80      |

## Common Viewport Sizes

| Device        | Width | Height | Scale |
| ------------- | ----- | ------ | ----- |
| Desktop HD    | 1920  | 1080   | 1     |
| Desktop       | 1280  | 720    | 1     |
| Laptop        | 1366  | 768    | 1     |
| iPad Pro      | 1024  | 1366   | 2     |
| iPad          | 768   | 1024   | 2     |
| iPhone 14 Pro | 393   | 852    | 3     |
| iPhone SE     | 375   | 667    | 2     |

## Notes

- First screenshot may take longer (browser launch)
- Some sites may block automated screenshots
- JavaScript executes before capture
- Requires network access to the target URL
