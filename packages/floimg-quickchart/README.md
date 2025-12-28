# floimg-quickchart

QuickChart.io generator for floimg - create charts using Chart.js configuration.

## Standing on the Shoulders of Giants

This plugin is a thin wrapper around [Chart.js](https://www.chartjs.org/) via [QuickChart](https://quickchart.io/). We don't abstract or limit the underlying library—your configuration passes through directly.

- **Full Chart.js power**: Every Chart.js option works
- **Native format**: Use Chart.js config, not a FloImg abstraction
- **Their docs are your docs**: See [Chart.js documentation](https://www.chartjs.org/docs/)

FloImg orchestrates the workflow (generate → transform → save). Chart.js does what it does best.

## Installation

```bash
npm install @teamflojo/floimg @teamflojo/floimg-quickchart
```

## Usage

```typescript
import createClient from "@teamflojo/floimg";
import quickchart from "@teamflojo/floimg-quickchart";

const floimg = createClient({
  store: {
    default: "s3",
    s3: { region: "us-east-1", bucket: "my-charts" },
  },
});

// Register the QuickChart generator
floimg.registerGenerator(quickchart());

// Generate a bar chart
const chart = await floimg.generate({
  generator: "quickchart",
  params: {
    type: "bar",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Revenue ($M)",
          data: [12, 19, 3, 5],
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  },
});

// Convert to PNG and save
const png = await floimg.transform({ blob: chart, op: "convert", to: "image/png" });
const result = await floimg.save(png, "./output/revenue.png");

console.log(result.url); // Use in slides, emails, etc.
```

## Chart Types

QuickChart supports all Chart.js chart types:

### Bar Chart

```typescript
await floimg.generate({
  generator: "quickchart",
  params: {
    type: "bar",
    data: {
      labels: ["Red", "Blue", "Yellow"],
      datasets: [{ data: [12, 19, 3] }],
    },
  },
});
```

### Line Chart

```typescript
await floimg.generate({
  generator: "quickchart",
  params: {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr"],
      datasets: [
        {
          label: "Sales",
          data: [10, 15, 13, 17],
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    },
  },
});
```

### Pie Chart

```typescript
await floimg.generate({
  generator: "quickchart",
  params: {
    type: "pie",
    data: {
      labels: ["Desktop", "Mobile", "Tablet"],
      datasets: [
        {
          data: [45, 40, 15],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        },
      ],
    },
  },
});
```

### Doughnut Chart

```typescript
await floimg.generate({
  generator: "quickchart",
  params: {
    type: "doughnut",
    data: {
      labels: ["Win", "Loss", "Draw"],
      datasets: [{ data: [10, 5, 3] }],
    },
  },
});
```

## Configuration

### Generator Options

```typescript
floimg.registerGenerator(
  quickchart({
    width: 800, // Default width
    height: 600, // Default height
    backgroundColor: "white", // Default background
    format: "png", // 'png' | 'svg' | 'webp'
    devicePixelRatio: 2.0, // For high DPI displays
  })
);
```

### Per-Chart Overrides

```typescript
await floimg.generate({
  generator: "quickchart",
  params: {
    width: 1200, // Override width
    height: 800, // Override height
    backgroundColor: "#f0f0f0",
    type: "bar",
    data: {
      /* ... */
    },
  },
});
```

## Chart.js Documentation

Since this generator uses Chart.js format directly, refer to the official Chart.js docs:

- **Chart Types**: https://www.chartjs.org/docs/latest/charts/
- **Configuration**: https://www.chartjs.org/docs/latest/configuration/
- **Options**: https://www.chartjs.org/docs/latest/general/options.html
- **Examples**: https://www.chartjs.org/docs/latest/samples/

## Advanced Examples

### Multi-Dataset Chart

```typescript
await floimg.generate({
  generator: "quickchart",
  params: {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [
        {
          label: "2023",
          data: [10, 15, 13, 17, 20],
          borderColor: "rgb(75, 192, 192)",
        },
        {
          label: "2024",
          data: [12, 17, 15, 19, 23],
          borderColor: "rgb(255, 99, 132)",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Sales Comparison",
        },
      },
    },
  },
});
```

### Stacked Bar Chart

```typescript
await floimg.generate({
  generator: "quickchart",
  params: {
    type: "bar",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        { label: "Product A", data: [10, 15, 12, 18], backgroundColor: "#FF6384" },
        { label: "Product B", data: [8, 12, 10, 14], backgroundColor: "#36A2EB" },
      ],
    },
    options: {
      scales: {
        x: { stacked: true },
        y: { stacked: true },
      },
    },
  },
});
```

## No Dependencies

This package has zero runtime dependencies - it just makes HTTP requests to QuickChart.io's free API.

## License

MIT

## See Also

- [floimg](https://github.com/bcooke/floimg) - Core library
- [QuickChart.io](https://quickchart.io) - Chart rendering service
- [Chart.js](https://www.chartjs.org) - Charting library
