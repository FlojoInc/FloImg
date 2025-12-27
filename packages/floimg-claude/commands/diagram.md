---
description: Generate a Mermaid diagram (flowcharts, sequence diagrams, class diagrams, etc.)
allowed-tools: Bash
---

# Diagram Generation

Generate a Mermaid diagram based on: "$ARGUMENTS"

## Instructions

1. **Determine diagram type** from the request:
   - Process flow / workflow → flowchart (`graph TD` or `graph LR`)
   - API calls / interactions → sequence diagram
   - Object relationships → class diagram
   - Lifecycle / states → state diagram
   - Timeline / schedule → Gantt chart

2. **Write valid Mermaid code** and run the floimg CLI:

```bash
npx -y @teamflojo/floimg diagram "MERMAID_CODE" -o ./diagram.png
```

Or use a file:

```bash
npx -y @teamflojo/floimg diagram --file ./diagram.mmd -o ./diagram.png
```

3. **Report the result** to the user:
   - Confirm the file path
   - Offer to adjust layout, styling, or export format

## Examples

**Flowchart:**

```bash
npx -y @teamflojo/floimg diagram "graph TD; A[Start] --> B{Decision}; B -->|Yes| C[Action]; B -->|No| D[End]" -o ./flow.png
```

**Sequence diagram:**

```bash
npx -y @teamflojo/floimg diagram "sequenceDiagram; User->>API: Request; API->>DB: Query; DB-->>API: Result; API-->>User: Response" -o ./sequence.png
```

**State diagram:**

```bash
npx -y @teamflojo/floimg diagram "stateDiagram-v2; [*] --> Draft; Draft --> Review; Review --> Published; Published --> [*]" -o ./states.png
```

## Mermaid Syntax Quick Reference

### Flowchart

```
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

### Sequence Diagram

```
sequenceDiagram
    participant U as User
    participant A as API
    U->>A: Request
    A-->>U: Response
```

### Class Diagram

```
classDiagram
    class Animal {
        +String name
        +makeSound()
    }
    Animal <|-- Dog
```

## Node Shapes

| Syntax      | Shape              |
| ----------- | ------------------ |
| `A[Text]`   | Rectangle          |
| `B{Text}`   | Diamond (decision) |
| `C((Text))` | Circle             |
| `D([Text])` | Stadium            |
| `E[(Text)]` | Database           |

## Edge Types

| Syntax      | Style            |
| ----------- | ---------------- |
| `-->`       | Arrow            |
| `---`       | Line             |
| `-.->`      | Dotted arrow     |
| `==>`       | Thick arrow      |
| `--text-->` | Arrow with label |

## Diagram Types

| Type      | Start Syntax            | Use Case          |
| --------- | ----------------------- | ----------------- |
| Flowchart | `graph TD` / `graph LR` | Process flows     |
| Sequence  | `sequenceDiagram`       | API interactions  |
| Class     | `classDiagram`          | OOP relationships |
| State     | `stateDiagram-v2`       | Lifecycles        |
| Gantt     | `gantt`                 | Project timelines |
| ER        | `erDiagram`             | Database schemas  |

## Optional Flags

| Flag       | Description              | Example        |
| ---------- | ------------------------ | -------------- |
| `--theme`  | Mermaid theme            | `--theme dark` |
| `--width`  | Image width in pixels    | `--width 1200` |
| `--format` | Output format (png, svg) | `--format svg` |
