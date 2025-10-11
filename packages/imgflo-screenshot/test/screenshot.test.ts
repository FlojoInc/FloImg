import { describe, it, expect } from 'vitest';
import screenshot from '../src/index.js';

describe('imgflo-screenshot', () => {
  it('should create a generator with default config', () => {
    const generator = screenshot();
    expect(generator.name).toBe('screenshot');
    expect(generator.generate).toBeTypeOf('function');
  });

  it('should capture screenshot from HTML', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      html: '<html><body><h1>Hello World</h1></body></html>',
      width: 800,
      height: 600
    });

    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/png');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.source).toBe('screenshot:playwright');
  }, 30000);

  it('should capture screenshot from URL', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      url: 'https://example.com',
      width: 1024,
      height: 768
    });

    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/png');
    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
  }, 30000);

  it('should support full page screenshots', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      html: `
        <html>
          <body style="height: 2000px;">
            <h1>Long Page</h1>
            <div style="margin-top: 1500px;">Bottom</div>
          </body>
        </html>
      `,
      fullPage: true,
      width: 800
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/png');
  }, 30000);

  it('should support element selector screenshots', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      html: `
        <html>
          <body>
            <div id="target" style="width: 200px; height: 200px; background: blue;">
              Target Element
            </div>
          </body>
        </html>
      `,
      selector: '#target',
      width: 800
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/png');
  }, 30000);

  it('should support JPEG format', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      html: '<html><body><h1>JPEG Test</h1></body></html>',
      width: 800,
      height: 600,
      format: 'jpeg'
    });

    expect(result.mime).toBe('image/jpeg');
    expect(result.bytes.length).toBeGreaterThan(0);
  }, 30000);

  it('should support custom viewport dimensions', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      html: '<html><body><h1>Custom Size</h1></body></html>',
      width: 1920,
      height: 1080
    });

    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  }, 30000);

  it('should support device scale factor', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      html: '<html><body><h1>Retina</h1></body></html>',
      width: 800,
      height: 600,
      deviceScaleFactor: 2
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    // Retina screenshots are typically larger
    expect(result.bytes.length).toBeGreaterThan(1000);
  }, 30000);

  it('should accept default config', async () => {
    const generator = screenshot({
      defaultWidth: 1280,
      defaultHeight: 720
    });

    const result = await generator.generate({
      html: '<html><body><h1>Default Config</h1></body></html>',
      format: 'jpeg'
    });

    expect(result.width).toBe(1280);
    expect(result.height).toBe(720);
    expect(result.mime).toBe('image/jpeg');
  }, 30000);

  it('should throw error when neither url nor html is provided', async () => {
    const generator = screenshot();

    await expect(
      generator.generate({ width: 800 })
    ).rejects.toThrow("Either 'url' or 'html' parameter is required");
  });

  it('should handle complex HTML with CSS', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      html: `
        <html>
          <head>
            <style>
              .box {
                width: 300px;
                height: 200px;
                background: linear-gradient(to right, #667eea, #764ba2);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: sans-serif;
                font-size: 24px;
              }
            </style>
          </head>
          <body>
            <div class="box">Styled Content</div>
          </body>
        </html>
      `,
      width: 800,
      height: 600
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  }, 30000);

  it('should handle wait until options', async () => {
    const generator = screenshot();

    const result = await generator.generate({
      html: '<html><body><h1>Network Idle</h1></body></html>',
      waitUntil: 'networkidle',
      width: 800,
      height: 600
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  }, 30000);
});
