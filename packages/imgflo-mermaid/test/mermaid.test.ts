import { describe, it, expect } from 'vitest';
import mermaid from '../src/index.js';

describe('imgflo-mermaid', () => {
  it('should create a generator with default config', () => {
    const generator = mermaid();
    expect(generator.name).toBe('mermaid');
    expect(generator.generate).toBeTypeOf('function');
  });

  it('should generate a flowchart', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `graph TD
        A[Start] --> B[End]`
    });

    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/svg+xml'); // Default format is SVG
    expect(result.source).toBe('mermaid');
  });

  it('should generate a sequence diagram', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `sequenceDiagram
        Alice->>John: Hello John, how are you?
        John-->>Alice: Great!`
    });

    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/svg+xml');
  });

  it('should generate a class diagram', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `classDiagram
        Animal <|-- Duck
        Animal <|-- Fish
        Animal : +int age
        Animal : +String gender`
    });

    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.mime).toBe('image/svg+xml');
  });

  it('should support PNG format', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `graph LR
        A --> B`,
      format: 'png'
    });

    expect(result.mime).toBe('image/png');
    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it('should support SVG format', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `graph LR
        A --> B`,
      format: 'svg'
    });

    expect(result.mime).toBe('image/svg+xml');
    expect(result.bytes).toBeInstanceOf(Buffer);
    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('<svg');
  });

  it('should support different themes', async () => {
    const generator = mermaid();

    const resultDefault = await generator.generate({
      code: `graph TD
        A[Theme Test]`,
      theme: 'default'
    });

    const resultDark = await generator.generate({
      code: `graph TD
        A[Theme Test]`,
      theme: 'dark'
    });

    expect(resultDefault.bytes.length).toBeGreaterThan(0);
    expect(resultDark.bytes.length).toBeGreaterThan(0);
  });

  it('should handle custom background color', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `graph TD
        A[Custom BG]`,
      backgroundColor: 'white'
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it('should accept default config', async () => {
    const generator = mermaid({
      theme: 'dark',
      backgroundColor: 'transparent'
    });

    const result = await generator.generate({
      code: `graph LR
        A --> B`
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it('should throw error when code is missing', async () => {
    const generator = mermaid();

    await expect(
      generator.generate({})
    ).rejects.toThrow("Mermaid 'code' parameter is required");
  });

  it('should generate a pie chart', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `pie title Pets
        "Dogs" : 386
        "Cats" : 85
        "Rats" : 15`
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it('should generate a gantt chart', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `gantt
        title Project Schedule
        dateFormat  YYYY-MM-DD
        section Design
        Planning           :a1, 2024-01-01, 30d
        Development        :after a1, 20d`
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it('should generate an ER diagram', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
        CUSTOMER {
          string name
          string custNumber
        }`
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it('should generate a state diagram', async () => {
    const generator = mermaid();

    const result = await generator.generate({
      code: `stateDiagram-v2
        [*] --> Still
        Still --> [*]
        Still --> Moving
        Moving --> Still`
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  });
});
