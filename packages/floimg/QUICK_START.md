# Quick Start Guide

Get started with floimg in seconds using `npx` — no setup required.

## Try It Now

```bash
# Generate a QR code
npx @teamflojo/floimg qr "https://floimg.com" -o qr.png

# Create a chart
npx @teamflojo/floimg chart bar --labels "Q1,Q2,Q3" --values "10,20,30" -o chart.png

# Resize an image
npx @teamflojo/floimg resize photo.jpg 800x600 -o thumbnail.jpg

# Convert format (PNG to WebP)
npx @teamflojo/floimg convert image.png -o image.webp
```

## How Plugin Auto-Install Works

floimg is modular. The core package is lightweight, and plugins are installed on-demand.

When you run a command that requires a plugin (like `qr` or `chart`), floimg will:

1. Check if the required plugin is installed
2. If not, prompt you to install it
3. Install and run your command

```
$ npx @teamflojo/floimg qr "https://example.com"

🔍 The 'qr' command requires @teamflojo/floimg-qr
   QR Code Generator

Install it now? (y/n): y
📦 Installing @teamflojo/floimg-qr...
✅ Installed!

✅ QR code saved to: qr.png
```

**After the first run**, the plugin is cached and subsequent runs are fast.

## Interactive Mode

Run floimg with no arguments to see an interactive menu:

```bash
npx @teamflojo/floimg
```

This shows all available commands and examples.

## Command Reference

### QR Code

```bash
floimg qr <text> [options]

Options:
  -o, --out <path>           Output file (default: qr.png)
  -s, --size <pixels>        Size in pixels (default: 300)
  -f, --format <format>      png or svg (default: png)
  -e, --error-correction     L, M, Q, or H (default: M)
  --dark <color>             Dark color hex (default: #000000)
  --light <color>            Light color hex (default: #ffffff)

Examples:
  floimg qr "https://floimg.com" -o qr.png
  floimg qr "Hello World" --size 400 --format svg -o hello.svg
  floimg qr "https://example.com" --error-correction H --dark "#1a1a2e"
```

### Chart

```bash
floimg chart <type> [options]

Types: bar, line, pie, doughnut, radar, polarArea, scatter

Options:
  -o, --out <path>           Output file (default: chart.png)
  -l, --labels <items>       Comma-separated labels
  -v, --values <items>       Comma-separated values
  -d, --data <file>          JSON file with Chart.js config
  --title <text>             Chart title
  -w, --width <pixels>       Width (default: 500)
  -h, --height <pixels>      Height (default: 300)
  -f, --format <format>      png, svg, or webp (default: png)

Examples:
  floimg chart bar --labels "A,B,C" --values "10,20,30" -o chart.png
  floimg chart pie --labels "Yes,No" --values "70,30" --title "Survey Results"
  floimg chart line --data sales.json -o sales-chart.png
```

### Resize

```bash
floimg resize <input> <size> [options]

Size formats: WIDTHxHEIGHT (e.g., 800x600) or WIDTH (e.g., 800)

Options:
  -o, --out <path>           Output file (default: input-resized.ext)
  --fit <mode>               cover, contain, fill, inside, outside
  --position <pos>           center, top, bottom, left, right, etc.
  --background <color>       Background color for contain mode

Examples:
  floimg resize photo.jpg 800x600 -o thumbnail.jpg
  floimg resize hero.png 1200 -o hero-resized.png
  floimg resize logo.png 200x200 --fit contain --background "#ffffff"
```

### Convert

```bash
floimg convert <input> [options]

Options:
  -o, --out <path>           Output file (format inferred from extension)
  -t, --to <format>          Target format: png, jpg, webp, avif, svg
  -q, --quality <number>     Quality for lossy formats (1-100)

Examples:
  floimg convert photo.png -o photo.webp
  floimg convert image.jpg --to avif -o optimized.avif
  floimg convert screenshot.png -o screenshot.jpg --quality 85
```

## Performance Tips

### First Run

The first run with npx will:

- Download the @teamflojo/floimg package
- Compile native dependencies (sharp, canvas)
- This takes ~10-15 seconds

### Subsequent Runs

After the first run:

- npx caches the package in `~/.npm/_npx/`
- Runs take ~2-3 seconds
- This is normal and matches tools like prettier, eslint

### For Frequent Use

If you use floimg often, install it globally for faster startup:

```bash
npm install -g @teamflojo/floimg
```

Then just run `floimg` directly (no npx needed).

## Troubleshooting

### "Cannot find module" errors

This usually means native dependencies failed to compile. Try:

```bash
# Clear npx cache and retry
rm -rf ~/.npm/_npx
npx @teamflojo/floimg doctor
```

### Plugin not installing

If auto-install fails in CI/scripts (non-interactive mode):

```bash
# Pre-install plugins explicitly
npm install @teamflojo/floimg-qr @teamflojo/floimg-quickchart

# Then run commands
npx @teamflojo/floimg qr "text" --no-auto-install
```

### Permission errors

If you get EACCES errors:

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

## Next Steps

- **[Full CLI Reference](https://floimg.com/docs/cli)** - All commands and options
- **[Library API](https://floimg.com/docs/api)** - Use floimg in your code
- **[MCP Integration](https://floimg.com/docs/mcp)** - Use with Claude/AI agents
- **[Plugin Development](https://floimg.com/docs/plugins)** - Create custom generators
