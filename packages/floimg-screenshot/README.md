# floimg-screenshot

Screenshot generator for floimg using Playwright headless browser.

## Installation

```bash
npm install @teamflojo/floimg @teamflojo/floimg-screenshot
```

This will automatically install Playwright and download Chromium (~200MB).

## Usage

```typescript
import createClient from '@teamflojo/floimg';
import screenshot from '@teamflojo/floimg-screenshot';

const floimg = createClient({
  store: {
    default: 's3',
    s3: { region: 'us-east-1', bucket: 'my-screenshots' }
  }
});

// Register the screenshot generator
floimg.registerGenerator(screenshot());

// Screenshot a website
const site = await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://example.com',
    width: 1920,
    height: 1080
  }
});

// Upload to S3
const result = await floimg.save(site, './output/example.png');
console.log(result.url);
```

## Use Cases

### 1. Website Screenshots

```typescript
await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://github.com/bcooke/floimg',
    width: 1280,
    height: 800,
    fullPage: true  // Capture entire page
  }
});
```

### 2. HTML Rendering

Perfect for generating images from HTML/CSS:

```typescript
await floimg.generate({
  generator: 'screenshot',
  params: {
    html: `
      <div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <h1>Sales Report Q4</h1>
        <p>Revenue: $1.2M</p>
      </div>
    `,
    width: 800,
    height: 600
  }
});
```

### 3. Element Screenshots

Capture specific elements:

```typescript
await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://example.com',
    selector: '#main-content',  // CSS selector
    width: 1920,
    height: 1080
  }
});
```

### 4. Wait for Content

Wait for dynamic content to load:

```typescript
await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://example.com/dashboard',
    waitFor: '.chart-loaded',  // Wait for this selector
    delay: 1000  // Additional 1s delay
  }
});
```

### 5. High DPI / Retina Screenshots

```typescript
await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://example.com',
    width: 1280,
    height: 720,
    deviceScaleFactor: 2  // 2x resolution
  }
});
```

## Configuration

### Generator Options

```typescript
floimg.registerGenerator(screenshot({
  persistent: true,        // Reuse browser instance (faster)
  defaultWidth: 1920,
  defaultHeight: 1080,
  launchOptions: {
    headless: true,
    args: ['--no-sandbox']  // Browser launch args
  }
}));
```

### Persistent Browser Mode

For better performance when taking multiple screenshots:

```typescript
const screenshotGen = screenshot({ persistent: true });
floimg.registerGenerator(screenshotGen);

// Take multiple screenshots - browser stays open
await floimg.generate({ generator: 'screenshot', params: { url: 'https://site1.com' } });
await floimg.generate({ generator: 'screenshot', params: { url: 'https://site2.com' } });
await floimg.generate({ generator: 'screenshot', params: { url: 'https://site3.com' } });

// Browser closes when process exits
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | - | URL to screenshot (required if no html) |
| `html` | string | - | HTML to render (required if no url) |
| `selector` | string | - | CSS selector to screenshot |
| `width` | number | 1280 | Viewport width |
| `height` | number | 720 | Viewport height |
| `fullPage` | boolean | false | Capture full scrollable page |
| `waitFor` | string | - | Selector to wait for |
| `delay` | number | - | Additional delay in ms |
| `deviceScaleFactor` | number | 1 | Device scale factor (for retina) |
| `format` | 'png' \| 'jpeg' | 'png' | Output format |
| `quality` | number | 90 | JPEG quality (0-100) |

## Examples

### OpenGraph Images

Generate OG images from HTML:

```typescript
const ogImage = await floimg.generate({
  generator: 'screenshot',
  params: {
    html: `
      <html>
        <head>
          <style>
            body {
              margin: 0;
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              font-family: Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            h1 { font-size: 72px; margin: 0; }
            p { font-size: 32px; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div>
            <h1>My Blog Post Title</h1>
            <p>A great article about something interesting</p>
          </div>
        </body>
      </html>
    `,
    width: 1200,
    height: 630
  }
});
```

### Dashboard Screenshot

Capture a live dashboard:

```typescript
const dashboard = await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://internal-dashboard.company.com',
    fullPage: true,
    waitFor: '.dashboard-loaded',
    width: 1920,
    height: 1080
  }
});
```

### Mobile Viewport

```typescript
const mobile = await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://example.com',
    width: 375,   // iPhone size
    height: 667,
    deviceScaleFactor: 2
  }
});
```

## Performance Considerations

- **Cold start**: ~1-2 seconds for browser launch
- **Persistent mode**: Reuses browser, faster for multiple screenshots
- **Memory**: Each browser instance uses ~50-100MB RAM
- **Disk space**: Chromium download is ~200MB

## Playwright Documentation

For advanced browser control, see:
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [Browser contexts](https://playwright.dev/docs/browser-contexts)
- [Selectors](https://playwright.dev/docs/selectors)

## Troubleshooting

### Browser fails to launch

If you see errors about missing dependencies:

```bash
# Install system dependencies
npx playwright install-deps chromium
```

### Screenshots timeout

Increase timeout for slow-loading pages:

```typescript
await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://slow-site.com',
    delay: 5000  // Wait 5 seconds
  }
});
```

### Element not found

Ensure selector exists:

```typescript
await floimg.generate({
  generator: 'screenshot',
  params: {
    url: 'https://example.com',
    waitFor: '#my-element',  // Wait for it to appear
    selector: '#my-element'   // Then screenshot it
  }
});
```

## Security Notes

- Never screenshot untrusted HTML (XSS risk)
- Be careful with URLs from user input
- Consider sandboxing in production
- Use `--no-sandbox` carefully (reduces security)

## License

MIT

## See Also

- [floimg](https://github.com/bcooke/floimg) - Core library
- [Playwright](https://playwright.dev) - Browser automation
