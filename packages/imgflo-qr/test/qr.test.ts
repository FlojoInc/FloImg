import { describe, it, expect } from 'vitest';
import qr from '../src/index.js';

describe('imgflo-qr', () => {
  it('should create a generator with default config', () => {
    const generator = qr();
    expect(generator.name).toBe('qr');
    expect(generator.generate).toBeTypeOf('function');
  });

  it('should generate a basic QR code', async () => {
    const generator = qr();

    const result = await generator.generate({
      text: 'https://github.com/bcooke/imgflo'
    });

    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/png');
    expect(result.width).toBe(300); // default width
    expect(result.height).toBe(300); // QR codes are square
    expect(result.source).toBe('qr');
  });

  it('should generate QR code with custom width', async () => {
    const generator = qr();

    const result = await generator.generate({
      text: 'Hello World',
      width: 500
    });

    expect(result.width).toBe(500);
    expect(result.height).toBe(500);
  });

  it('should generate SVG format', async () => {
    const generator = qr();

    const result = await generator.generate({
      text: 'SVG Test',
      format: 'svg'
    });

    expect(result.mime).toBe('image/svg+xml');
    expect(result.bytes).toBeInstanceOf(Buffer);
    // SVG should contain recognizable SVG tags
    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('<svg');
  });

  it('should respect error correction levels', async () => {
    const generator = qr();

    const resultL = await generator.generate({
      text: 'Error Correction L',
      errorCorrectionLevel: 'L'
    });

    const resultH = await generator.generate({
      text: 'Error Correction H',
      errorCorrectionLevel: 'H'
    });

    expect(resultL.bytes.length).toBeGreaterThan(0);
    expect(resultH.bytes.length).toBeGreaterThan(0);
    // Higher error correction usually means more data/larger size
    expect(resultH.bytes.length).toBeGreaterThanOrEqual(resultL.bytes.length);
  });

  it('should handle custom colors', async () => {
    const generator = qr();

    const result = await generator.generate({
      text: 'Colored QR',
      color: {
        dark: '#667eea',
        light: '#ffffff'
      }
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/png');
  });

  it('should accept default config', async () => {
    const generator = qr({
      width: 400,
      errorCorrectionLevel: 'H',
      margin: 5
    });

    const result = await generator.generate({
      text: 'Default Config Test'
    });

    expect(result.width).toBe(400);
    expect(result.height).toBe(400);
  });

  it('should handle QR code options pass-through', async () => {
    const generator = qr();

    // Test with specific mask pattern
    const result = await generator.generate({
      text: 'Advanced Options',
      version: 5,
      maskPattern: 3,
      margin: 2
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.text).toBe('Advanced Options');
  });

  it('should throw error when text is missing', async () => {
    const generator = qr();

    await expect(
      generator.generate({})
    ).rejects.toThrow("QR code 'text' parameter is required");
  });

  it('should handle URL encoding', async () => {
    const generator = qr();

    const result = await generator.generate({
      text: 'https://example.com/path?query=value&other=test',
      width: 350
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.width).toBe(350);
  });

  it('should handle vCard data', async () => {
    const generator = qr();

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+1-555-1234
EMAIL:john@example.com
END:VCARD`;

    const result = await generator.generate({
      text: vcard,
      errorCorrectionLevel: 'H',
      width: 400
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/png');
  });

  it('should handle WiFi network encoding', async () => {
    const generator = qr();

    const wifi = 'WIFI:T:WPA;S:MyNetwork;P:MyPassword;;';

    const result = await generator.generate({
      text: wifi,
      width: 300
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  });
});
