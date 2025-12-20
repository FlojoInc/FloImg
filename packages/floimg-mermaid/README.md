# floimg-mermaid

Mermaid diagram generator for floimg - create flowcharts, sequence diagrams, class diagrams, and more using Mermaid syntax.

## Installation

```bash
npm install @teamflojo/floimg @teamflojo/floimg-mermaid
```

This will install Mermaid CLI (~50MB including dependencies).

## Usage

```typescript
import createClient from '@teamflojo/floimg';
import mermaid from '@teamflojo/floimg-mermaid';

const floimg = createClient({
  store: {
    default: 's3',
    s3: { region: 'us-east-1', bucket: 'my-diagrams' }
  }
});

// Register the Mermaid generator
floimg.registerGenerator(mermaid());

// Generate a flowchart
const diagram = await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      graph TD
        A[Start] --> B{Is it working?}
        B -->|Yes| C[Great!]
        B -->|No| D[Debug]
        D --> B
    `,
    theme: 'dark'
  }
});

// Upload to S3
const result = await floimg.save(diagram, './output/flow.svg');
console.log(result.url);
```

## Diagram Types

Mermaid supports many diagram types - all available via pass-through syntax:

### Flowchart

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      graph LR
        A[Square Rect] --> B(Rounded)
        B --> C{Decision}
        C -->|One| D[Result 1]
        C -->|Two| E[Result 2]
    `
  }
});
```

### Sequence Diagram

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      sequenceDiagram
        Alice->>John: Hello John, how are you?
        John-->>Alice: Great!
        Alice-)John: See you later!
    `
  }
});
```

### Class Diagram

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      classDiagram
        Animal <|-- Duck
        Animal <|-- Fish
        Animal : +int age
        Animal : +String gender
        Animal: +isMammal()
        class Duck{
          +String beakColor
          +swim()
          +quack()
        }
    `
  }
});
```

### State Diagram

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      stateDiagram-v2
        [*] --> Still
        Still --> [*]
        Still --> Moving
        Moving --> Still
        Moving --> Crash
        Crash --> [*]
    `
  }
});
```

### Entity Relationship Diagram

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
        CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
    `
  }
});
```

### Gantt Chart

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      gantt
        title A Gantt Diagram
        dateFormat YYYY-MM-DD
        section Section
          A task :a1, 2024-01-01, 30d
          Another task :after a1, 20d
    `
  }
});
```

### Pie Chart

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      pie title Pets adopted by volunteers
        "Dogs" : 386
        "Cats" : 85
        "Rats" : 15
    `
  }
});
```

### Git Graph

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      gitGraph
        commit
        commit
        branch develop
        checkout develop
        commit
        commit
        checkout main
        merge develop
    `
  }
});
```

## Configuration

### Generator Options

```typescript
floimg.registerGenerator(mermaid({
  theme: 'dark',              // Default theme
  backgroundColor: '#1a1a1a', // Default background
  format: 'svg',              // 'svg' | 'png'
  width: 800,                 // Default width (for PNG)
  height: 600                 // Default height (for PNG)
}));
```

### Per-Diagram Overrides

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: '...',
    theme: 'forest',          // Override theme
    backgroundColor: 'transparent',
    format: 'png',            // Generate PNG instead
    width: 1200,
    height: 800
  }
});
```

### Available Themes

- `default` - Default Mermaid theme
- `forest` - Green theme
- `dark` - Dark theme
- `neutral` - Neutral grey theme

### Advanced Configuration

Pass Mermaid config object directly:

```typescript
await floimg.generate({
  generator: 'mermaid',
  params: {
    code: '...',
    mermaidConfig: {
      theme: 'base',
      themeVariables: {
        primaryColor: '#BB2528',
        primaryTextColor: '#fff',
        primaryBorderColor: '#7C0000',
        lineColor: '#F8B229',
        secondaryColor: '#006100',
        tertiaryColor: '#fff'
      }
    }
  }
});
```

## Mermaid Documentation

Since this generator uses Mermaid syntax directly, refer to the official Mermaid docs:

- **Diagram Types**: https://mermaid.js.org/intro/syntax-reference.html
- **Flowcharts**: https://mermaid.js.org/syntax/flowchart.html
- **Sequence Diagrams**: https://mermaid.js.org/syntax/sequenceDiagram.html
- **Configuration**: https://mermaid.js.org/config/setup/modules/mermaidAPI.html
- **Themes**: https://mermaid.js.org/config/theming.html

## Examples

### System Architecture

```typescript
const architecture = await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      graph TB
        subgraph "Frontend"
          A[React App]
          B[Next.js]
        end
        subgraph "Backend"
          C[API Gateway]
          D[Lambda Functions]
          E[(Database)]
        end
        A --> C
        B --> C
        C --> D
        D --> E
    `,
    theme: 'dark',
    backgroundColor: 'transparent'
  }
});
```

### User Journey

```typescript
const journey = await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      journey
        title My working day
        section Go to work
          Make tea: 5: Me
          Go upstairs: 3: Me
          Do work: 1: Me, Cat
        section Go home
          Go downstairs: 5: Me
          Sit down: 5: Me
    `
  }
});
```

### Mind Map

```typescript
const mindMap = await floimg.generate({
  generator: 'mermaid',
  params: {
    code: `
      mindmap
        root((floimg))
          Generators
            Shapes
            OpenAI
            QuickChart
            Mermaid
          Transform
            Convert
            Resize
          Upload
            S3
            Filesystem
    `
  }
});
```

## Output Formats

### SVG (Default)

```typescript
// Returns scalable vector graphic
const svg = await floimg.generate({
  generator: 'mermaid',
  params: { code: '...', format: 'svg' }
});
```

### PNG

```typescript
// Returns raster image
const png = await floimg.generate({
  generator: 'mermaid',
  params: {
    code: '...',
    format: 'png',
    width: 1920,
    height: 1080
  }
});
```

## Performance

- **First render**: ~1-2 seconds (includes CLI startup)
- **Subsequent renders**: ~500ms-1s per diagram
- **Memory**: ~50-100MB per process

## Troubleshooting

### "Mermaid code parsing failed"

Check your Mermaid syntax:
```typescript
// ❌ Bad syntax
code: `graph TD A -> B`

// ✅ Correct syntax
code: `graph TD\n  A --> B`
```

### Diagram not rendering

Ensure proper indentation and whitespace:
```typescript
code: `
  graph TD
    A[Start] --> B[End]
`
```

### Theme not applying

Make sure theme name is valid:
```typescript
theme: 'dark'  // ✅ Valid
theme: 'blue'  // ❌ Invalid
```

## Why Mermaid?

- **Text-based**: Easy to version control and generate programmatically
- **Wide support**: Many diagram types
- **Clean syntax**: Human-readable
- **AI-friendly**: Easy for LLMs to generate
- **No GUI needed**: Perfect for automation

## License

MIT

## See Also

- [floimg](https://github.com/bcooke/floimg) - Core library
- [Mermaid](https://mermaid.js.org) - Diagram library
- [Mermaid Live Editor](https://mermaid.live) - Test diagrams
