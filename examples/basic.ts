/**
 * Basic example: Generate SVG → Convert to PNG → Upload to S3
 *
 * This demonstrates the core workflow that makes imgflo useful for AI agents:
 * 1. Generate an image (easy for LLMs since it's just code/parameters)
 * 2. Convert to a web-friendly format
 * 3. Upload to cloud storage and get a URL back
 */

import createClient from "../src/index.js";

async function main() {
  // Create client with S3 configuration
  const imgflo = createClient({
    verbose: true,
    store: {
      default: "s3",
      s3: {
        region: process.env.AWS_REGION || "us-east-1",
        bucket: process.env.S3_BUCKET || "my-images",
        // Credentials will be picked up from AWS SDK's default credential chain
      },
    },
  });

  console.log("🎨 Generating gradient SVG...");
  const svg = await imgflo.generate({
    provider: "svg",
    name: "shapes",
    params: {
      type: "gradient",
      width: 1200,
      height: 630,
      color1: "#667eea",
      color2: "#764ba2",
    },
  });

  console.log(`✓ Generated SVG: ${svg.width}x${svg.height}`);

  console.log("\n🔄 Converting SVG to PNG...");
  const png = await imgflo.transform({
    blob: svg,
    op: "convert",
    to: "image/png",
  });

  console.log(`✓ Converted to PNG: ${png.width}x${png.height}`);

  console.log("\n☁️  Uploading to S3...");
  const result = await imgflo.upload({
    blob: png,
    key: "examples/gradient.png",
  });

  console.log(`✓ Upload complete!`);
  console.log(`   URL: ${result.url}`);
  console.log(`   ETag: ${result.etag}`);

  console.log("\n✨ Done! You can now use this URL in Google Slides, emails, etc.");
  console.log(`   ${result.url}`);
}

main().catch(console.error);
