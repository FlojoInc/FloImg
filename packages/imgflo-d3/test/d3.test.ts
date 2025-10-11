import { describe, it, expect } from 'vitest';
import d3viz from '../src/index.js';

describe('imgflo-d3', () => {
  it('should create a generator with default config', () => {
    const generator = d3viz();
    expect(generator.name).toBe('d3');
    expect(generator.generate).toBeTypeOf('function');
  });

  it('should generate a simple visualization', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 400,
      height: 300,
      render: (svg: any, d3: any, data: any) => {
        svg.append('rect')
          .attr('width', 100)
          .attr('height', 100)
          .attr('fill', 'red');
      },
      data: []
    });

    expect(result.bytes).toBeInstanceOf(Buffer);
    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.mime).toBe('image/svg+xml');
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
    expect(result.source).toBe('d3');

    // Check SVG contains our rect
    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('<svg');
    expect(svgString).toContain('<rect');
    expect(svgString).toContain('fill="red"');
  });

  it('should generate a bar chart', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 600,
      height: 400,
      render: (svg: any, d3: any, data: any) => {
        svg.selectAll('rect')
          .data(data)
          .join('rect')
          .attr('x', (d: any, i: number) => i * 60)
          .attr('y', (d: any) => 400 - d.value * 3)
          .attr('width', 50)
          .attr('height', (d: any) => d.value * 3)
          .attr('fill', 'steelblue');
      },
      data: [
        { value: 30 },
        { value: 80 },
        { value: 45 }
      ]
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.metadata?.dataPoints).toBe(3);

    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('steelblue');
  });

  it('should generate a line chart', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 500,
      height: 300,
      render: (svg: any, d3: any, data: any) => {
        const x = d3.scaleLinear()
          .domain([0, data.length - 1])
          .range([0, 500]);

        const y = d3.scaleLinear()
          .domain([0, d3.max(data, (d: any) => d.value)])
          .range([300, 0]);

        const line = d3.line()
          .x((d: any, i: number) => x(i))
          .y((d: any) => y(d.value));

        svg.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 2)
          .attr('d', line);
      },
      data: [
        { value: 10 },
        { value: 30 },
        { value: 20 },
        { value: 50 }
      ]
    });

    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('<path');
    expect(svgString).toContain('stroke="steelblue"');
  });

  it('should generate a pie chart', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 400,
      height: 400,
      render: (svg: any, d3: any, data: any) => {
        const radius = 200;
        const g = svg.append('g')
          .attr('transform', `translate(200,200)`);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const pie = d3.pie()
          .value((d: any) => d.value);

        const arc = d3.arc()
          .innerRadius(0)
          .outerRadius(radius);

        g.selectAll('path')
          .data(pie(data))
          .join('path')
          .attr('d', arc)
          .attr('fill', (d: any, i: number) => color(i));
      },
      data: [
        { label: 'A', value: 30 },
        { label: 'B', value: 70 },
        { label: 'C', value: 45 }
      ]
    });

    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('<g');
    expect(svgString).toContain('transform');
  });

  it('should generate a scatter plot', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 500,
      height: 400,
      render: (svg: any, d3: any, data: any) => {
        const x = d3.scaleLinear()
          .domain([0, d3.max(data, (d: any) => d.x)])
          .range([0, 500]);

        const y = d3.scaleLinear()
          .domain([0, d3.max(data, (d: any) => d.y)])
          .range([400, 0]);

        svg.selectAll('circle')
          .data(data)
          .join('circle')
          .attr('cx', (d: any) => x(d.x))
          .attr('cy', (d: any) => y(d.y))
          .attr('r', 5)
          .attr('fill', 'steelblue');
      },
      data: [
        { x: 10, y: 20 },
        { x: 20, y: 40 },
        { x: 30, y: 25 }
      ]
    });

    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('<circle');
  });

  it('should support custom background color', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 400,
      height: 300,
      backgroundColor: '#f0f0f0',
      render: (svg: any) => {
        svg.append('rect')
          .attr('width', 50)
          .attr('height', 50);
      },
      data: []
    });

    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('background-color: rgb(240, 240, 240)');
  });

  it('should accept default config', async () => {
    const generator = d3viz({
      width: 1000,
      height: 800,
      backgroundColor: 'lightblue'
    });

    const result = await generator.generate({
      render: (svg: any) => {
        svg.append('circle')
          .attr('cx', 50)
          .attr('cy', 50)
          .attr('r', 25);
      },
      data: []
    });

    expect(result.width).toBe(1000);
    expect(result.height).toBe(800);
  });

  it('should support renderString parameter', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 300,
      height: 200,
      renderString: `
        svg.append('rect')
          .attr('width', 100)
          .attr('height', 100)
          .attr('fill', 'green');
      `,
      data: []
    });

    const svgString = result.bytes.toString('utf-8');
    expect(svgString).toContain('fill="green"');
  });

  it('should throw error when neither render nor renderString provided', async () => {
    const generator = d3viz();

    await expect(
      generator.generate({
        width: 400,
        height: 300,
        data: []
      })
    ).rejects.toThrow("D3 generator requires either 'render' function or 'renderString' parameter");
  });

  it('should handle render function errors', async () => {
    const generator = d3viz();

    await expect(
      generator.generate({
        width: 400,
        height: 300,
        render: () => {
          throw new Error('Render failed');
        },
        data: []
      })
    ).rejects.toThrow('D3 render function failed: Render failed');
  });

  it('should support D3 scales and axes', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 600,
      height: 400,
      render: (svg: any, d3: any, data: any) => {
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const g = svg.append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
          .domain(data.map((d: any) => d.name))
          .range([0, width])
          .padding(0.1);

        const y = d3.scaleLinear()
          .domain([0, d3.max(data, (d: any) => d.value)])
          .range([height, 0]);

        g.selectAll('rect')
          .data(data)
          .join('rect')
          .attr('x', (d: any) => x(d.name))
          .attr('y', (d: any) => y(d.value))
          .attr('width', x.bandwidth())
          .attr('height', (d: any) => height - y(d.value))
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
        { name: 'Q3', value: 150 }
      ]
    });

    const svgString = result.bytes.toString('utf-8');
    // Check for axis elements (they have class="tick")
    expect(svgString).toContain('class="tick"');
  });

  it('should support D3 color schemes', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 400,
      height: 300,
      render: (svg: any, d3: any, data: any) => {
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        svg.selectAll('rect')
          .data(data)
          .join('rect')
          .attr('x', (d: any, i: number) => i * 50)
          .attr('y', 50)
          .attr('width', 40)
          .attr('height', 100)
          .attr('fill', (d: any, i: number) => color(i));
      },
      data: [1, 2, 3, 4]
    });

    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it('should handle empty data', async () => {
    const generator = d3viz();

    const result = await generator.generate({
      width: 400,
      height: 300,
      render: (svg: any, d3: any, data: any) => {
        svg.selectAll('rect')
          .data(data)
          .join('rect');
      },
      data: []
    });

    expect(result.bytes.length).toBeGreaterThan(0);
    expect(result.metadata?.dataPoints).toBe(0);
  });
});
