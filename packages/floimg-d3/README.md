# floimg-d3

D3 data visualization generator for floimg using server-side rendering.

## Installation

```bash
npm install @teamflojo/floimg @teamflojo/floimg-d3
```

## Usage

```typescript
import createClient from '@teamflojo/floimg';
import d3viz from '@teamflojo/floimg-d3';

const floimg = createClient();
floimg.registerGenerator(d3viz());

// Create a bar chart
const chart = await floimg.generate({
  generator: 'd3',
  params: {
    width: 600,
    height: 400,
    render: (svg, d3, data) => {
      // Use D3 directly - full API available
      svg.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', (d, i) => i * 60)
        .attr('y', d => 400 - d.value * 3)
        .attr('width', 50)
        .attr('height', d => d.value * 3)
        .attr('fill', 'steelblue');
    },
    data: [
      { value: 30 },
      { value: 80 },
      { value: 45 },
      { value: 60 },
      { value: 20 }
    ]
  }
});

// Upload to S3
await floimg.save(chart, './output/bar.svg');
```

## Examples

### Bar Chart

```typescript
const barChart = await floimg.generate({
  generator: 'd3',
  params: {
    width: 800,
    height: 400,
    render: (svg, d3, data) => {
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, width])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height, 0]);

      g.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', d => x(d.name))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', 'steelblue');

      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

      g.append('g')
        .call(d3.axisLeft(y));
    },
    data: [
      { name: 'Q1', value: 120 },
      { name: 'Q2', value: 200 },
      { name: 'Q3', value: 150 },
      { name: 'Q4', value: 170 }
    ]
  }
});
```

### Line Chart

```typescript
const lineChart = await floimg.generate({
  generator: 'd3',
  params: {
    width: 800,
    height: 400,
    render: (svg, d3, data) => {
      const margin = { top: 20, right: 20, bottom: 30, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height, 0]);

      const line = d3.line()
        .x((d, i) => x(i))
        .y(d => y(d.value));

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', line);

      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

      g.append('g')
        .call(d3.axisLeft(y));
    },
    data: [
      { value: 30 },
      { value: 50 },
      { value: 45 },
      { value: 80 },
      { value: 70 },
      { value: 90 }
    ]
  }
});
```

### Pie Chart

```typescript
const pieChart = await floimg.generate({
  generator: 'd3',
  params: {
    width: 500,
    height: 500,
    render: (svg, d3, data) => {
      const width = 500;
      const height = 500;
      const radius = Math.min(width, height) / 2;

      const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const pie = d3.pie()
        .value(d => d.value);

      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      const arcs = g.selectAll('arc')
        .data(pie(data))
        .join('g')
        .attr('class', 'arc');

      arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i));

      arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .text(d => d.data.label);
    },
    data: [
      { label: 'A', value: 30 },
      { label: 'B', value: 70 },
      { label: 'C', value: 45 },
      { label: 'D', value: 60 }
    ]
  }
});
```

### Scatter Plot

```typescript
const scatterPlot = await floimg.generate({
  generator: 'd3',
  params: {
    width: 600,
    height: 400,
    render: (svg, d3, data) => {
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const width = 600 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.x)])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.y)])
        .range([height, 0]);

      g.selectAll('circle')
        .data(data)
        .join('circle')
        .attr('cx', d => x(d.x))
        .attr('cy', d => y(d.y))
        .attr('r', 5)
        .attr('fill', 'steelblue')
        .attr('opacity', 0.7);

      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

      g.append('g')
        .call(d3.axisLeft(y));
    },
    data: [
      { x: 10, y: 20 },
      { x: 20, y: 40 },
      { x: 30, y: 25 },
      { x: 40, y: 60 },
      { x: 50, y: 45 }
    ]
  }
});
```

### Area Chart

```typescript
const areaChart = await floimg.generate({
  generator: 'd3',
  params: {
    width: 800,
    height: 400,
    render: (svg, d3, data) => {
      const margin = { top: 20, right: 20, bottom: 30, left: 50 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height, 0]);

      const area = d3.area()
        .x((d, i) => x(i))
        .y0(height)
        .y1(d => y(d.value));

      g.append('path')
        .datum(data)
        .attr('fill', 'steelblue')
        .attr('opacity', 0.7)
        .attr('d', area);

      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

      g.append('g')
        .call(d3.axisLeft(y));
    },
    data: [
      { value: 30 },
      { value: 50 },
      { value: 45 },
      { value: 80 },
      { value: 70 },
      { value: 90 }
    ]
  }
});
```

### Heatmap

```typescript
const heatmap = await floimg.generate({
  generator: 'd3',
  params: {
    width: 600,
    height: 400,
    render: (svg, d3, data) => {
      const cellSize = 50;
      const rows = data.length;
      const cols = data[0].length;

      const color = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data.flat())]);

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          svg.append('rect')
            .attr('x', j * cellSize)
            .attr('y', i * cellSize)
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('fill', color(data[i][j]))
            .attr('stroke', 'white');

          svg.append('text')
            .attr('x', j * cellSize + cellSize / 2)
            .attr('y', i * cellSize + cellSize / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('fill', data[i][j] > 5 ? 'white' : 'black')
            .text(data[i][j]);
        }
      }
    },
    data: [
      [1, 3, 5, 7],
      [2, 4, 6, 8],
      [9, 7, 5, 3],
      [8, 6, 4, 2]
    ]
  }
});
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | number | 800 | Output width in pixels |
| `height` | number | 600 | Output height in pixels |
| `backgroundColor` | string | 'white' | Background color |
| `render` | function | *required* | Function that receives (svg, d3, data) |
| `renderString` | string | - | String version of render function (for serialization) |
| `data` | any | [] | Data to pass to render function |

## Configuration

```typescript
floimg.registerGenerator(d3viz({
  width: 1000,           // Default width
  height: 600,           // Default height
  backgroundColor: '#f0f0f0'  // Default background
}));
```

## Features

- **Full D3 API**: Complete access to all D3 capabilities
- **Server-side rendering**: No browser required
- **SVG output**: Scalable vector graphics
- **Pass-through pattern**: Zero abstraction, pure D3 code
- **Type-safe**: Full TypeScript support

## D3 Documentation

For full D3 capabilities and examples:
- https://d3js.org/
- https://observablehq.com/@d3/gallery

## Performance

- **Generation time**: ~10-100ms depending on complexity
- **Memory**: Minimal (~5-20MB)
- **No external dependencies**: Pure Node.js

## Use Cases

### Data Reports

```typescript
// Generate multiple charts for a report
const charts = await Promise.all([
  floimg.generate({ generator: 'd3', params: salesChartConfig }),
  floimg.generate({ generator: 'd3', params: revenueChartConfig }),
  floimg.generate({ generator: 'd3', params: growthChartConfig })
]);
```

### Real-time Dashboards

```typescript
// Update charts with live data
setInterval(async () => {
  const liveData = await fetchLiveData();
  const chart = await floimg.generate({
    generator: 'd3',
    params: {
      render: createChartRenderer(),
      data: liveData
    }
  });
  await floimg.save(chart, './output/dashboard-live.svg');
}, 60000);
```

### API Endpoints

```typescript
app.get('/api/chart/:type', async (req, res) => {
  const data = await fetchData(req.params.type);
  const chart = await floimg.generate({
    generator: 'd3',
    params: { render: getRenderer(req.params.type), data }
  });
  res.type('image/svg+xml').send(chart.bytes);
});
```

## License

MIT

## See Also

- [floimg](https://github.com/bcooke/floimg) - Core library
- [D3.js](https://d3js.org/) - Data visualization library
