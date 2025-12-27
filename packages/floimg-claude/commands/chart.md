---
description: Generate a chart or graph using QuickChart (bar, line, pie, doughnut, radar, etc.)
allowed-tools: Bash
---

# Chart Generation

Generate a chart based on: "$ARGUMENTS"

## Instructions

1. **Parse the chart request**:
   - Identify chart type (bar, line, pie, doughnut, radar, scatter)
   - Extract data points (labels and values)
   - Note any styling preferences (title, colors)

2. **Run the floimg CLI** to generate the chart:

```bash
npx -y @teamflojo/floimg chart TYPE --labels "LABELS" --values "VALUES" -o ./chart.png
```

**Chart types:** `bar`, `line`, `pie`, `doughnut`, `radar`, `polarArea`, `scatter`

3. **Report the result** to the user:
   - Confirm the file path
   - Offer alternatives (different chart type, colors, size)

## Examples

**Bar chart:**

```bash
npx -y @teamflojo/floimg chart bar --labels "Q1,Q2,Q3,Q4" --values "100,150,120,180" --title "Quarterly Sales" -o ./sales-chart.png
```

**Pie chart:**

```bash
npx -y @teamflojo/floimg chart pie --labels "Desktop,Mobile,Tablet" --values "60,30,10" -o ./device-chart.png
```

**Line chart:**

```bash
npx -y @teamflojo/floimg chart line --labels "Mon,Tue,Wed,Thu,Fri" --values "10,25,15,30,20" --title "Weekly Traffic" -o ./traffic.png
```

**Multiple datasets (JSON config):**
For complex charts with multiple series, use the `--config` flag with JSON:

```bash
npx -y @teamflojo/floimg chart bar --config '{"data":{"labels":["Q1","Q2","Q3"],"datasets":[{"label":"2023","data":[10,20,30]},{"label":"2024","data":[15,25,35]}]}}' -o ./comparison.png
```

## Chart Types

| Type      | Best For                  |
| --------- | ------------------------- |
| bar       | Categorical comparisons   |
| line      | Trends over time          |
| pie       | Parts of a whole          |
| doughnut  | Parts of whole (hollow)   |
| radar     | Multi-variable comparison |
| polarArea | Radial data display       |
| scatter   | Correlation analysis      |

## Optional Flags

| Flag       | Description                  | Example            |
| ---------- | ---------------------------- | ------------------ |
| `--title`  | Chart title                  | `--title "Sales"`  |
| `--width`  | Image width in pixels        | `--width 800`      |
| `--height` | Image height in pixels       | `--height 600`     |
| `--config` | Full Chart.js config as JSON | `--config '{...}'` |
