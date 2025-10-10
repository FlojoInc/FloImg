#!/bin/bash

# Example: Using imgflo CLI for the complete workflow
# This shows how an AI agent could easily shell out to imgflo commands

echo "🎨 Example 1: Generate gradient and save locally"
imgflo generate \
  --provider svg \
  --name shapes \
  --params '{"type":"gradient","width":1200,"height":630,"color1":"#667eea","color2":"#764ba2"}' \
  --out gradient.svg

echo ""
echo "🔄 Convert SVG to PNG"
imgflo transform \
  --in gradient.svg \
  --op convert \
  --to image/png \
  --out gradient.png

echo ""
echo "☁️  Upload to S3"
imgflo upload \
  --in gradient.png \
  --key examples/gradient.png

echo ""
echo "---"
echo ""

echo "🎨 Example 2: Generate pattern with different colors"
imgflo generate \
  --provider svg \
  --name shapes \
  --params '{"type":"pattern","patternType":"dots","width":800,"height":600}' \
  --out pattern.svg

imgflo transform --in pattern.svg --op convert --to image/png --out pattern.png

echo ""
echo "✨ Done! Check the output files:"
ls -lh *.svg *.png
