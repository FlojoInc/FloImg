/**
 * Google Slides Workflow Example
 *
 * This demonstrates the exact use case that inspired imgflo:
 * An AI agent (like Claude Code) can generate images for slides and
 * automatically upload them to get shareable URLs.
 */

import createClient from "../src/index.js";

async function createSlideImages() {
  const imgflo = createClient({
    store: {
      default: "s3",
      s3: {
        region: process.env.AWS_REGION || "us-east-1",
        bucket: process.env.S3_BUCKET || "presentation-assets",
      },
    },
  });

  // Slide 1: Title slide background
  console.log("📊 Creating title slide background...");
  const titleBg = await imgflo.generate({
    provider: "svg",
    name: "shapes",
    params: {
      type: "gradient",
      width: 1920,
      height: 1080,
      color1: "#6366f1",
      color2: "#8b5cf6",
    },
  });

  const titleBgPng = await imgflo.transform({
    blob: titleBg,
    op: "convert",
    to: "image/png",
  });

  const titleBgResult = await imgflo.upload({
    blob: titleBgPng,
    key: "slides/title-background.png",
  });

  console.log(`✓ Title background: ${titleBgResult.url}`);

  // Slide 2: Content slide with pattern
  console.log("\n📊 Creating content slide background...");
  const contentBg = await imgflo.generate({
    provider: "svg",
    name: "shapes",
    params: {
      type: "pattern",
      patternType: "grid",
      width: 1920,
      height: 1080,
    },
  });

  const contentBgPng = await imgflo.transform({
    blob: contentBg,
    op: "convert",
    to: "image/png",
  });

  const contentBgResult = await imgflo.upload({
    blob: contentBgPng,
    key: "slides/content-background.png",
  });

  console.log(`✓ Content background: ${contentBgResult.url}`);

  // Slide 3: Accent graphic
  console.log("\n📊 Creating accent graphic...");
  const accent = await imgflo.generate({
    provider: "svg",
    name: "shapes",
    params: {
      type: "circle",
      width: 500,
      height: 500,
      fill: "#f59e0b",
    },
  });

  const accentPng = await imgflo.transform({
    blob: accent,
    op: "convert",
    to: "image/png",
  });

  const accentResult = await imgflo.upload({
    blob: accentPng,
    key: "slides/accent-circle.png",
  });

  console.log(`✓ Accent graphic: ${accentResult.url}`);

  console.log("\n✨ All slide images generated and uploaded!");
  console.log("\nURLs for Google Slides:");
  console.log(`1. ${titleBgResult.url}`);
  console.log(`2. ${contentBgResult.url}`);
  console.log(`3. ${accentResult.url}`);

  return {
    titleBackground: titleBgResult.url,
    contentBackground: contentBgResult.url,
    accent: accentResult.url,
  };
}

// If an AI agent needs to generate slides, it can:
// 1. Call this function to generate all images
// 2. Get back the URLs
// 3. Use the Google Slides MCP to insert these images

createSlideImages().catch(console.error);
