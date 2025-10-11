import type { ImageGenerator, ImageBlob } from "imgflo";
import * as d3 from "d3";
import { JSDOM } from "jsdom";

/**
 * D3 data visualization generator using server-side rendering
 *
 * This generator accepts D3 code directly (pass-through pattern).
 * You provide a render function that uses D3 to create visualizations.
 * No imgflo abstraction - you get full D3 capabilities.
 *
 * @see https://d3js.org/ - D3 documentation
 *
 * @example
 * ```typescript
 * import createClient from 'imgflo';
 * import d3viz from 'imgflo-d3';
 *
 * const imgflo = createClient();
 * imgflo.registerGenerator(d3viz());
 *
 * const chart = await imgflo.generate({
 *   generator: 'd3',
 *   params: {
 *     width: 600,
 *     height: 400,
 *     render: (svg, d3, data) => {
 *       // Use D3 directly
 *       svg.selectAll('rect')
 *         .data(data)
 *         .join('rect')
 *         .attr('x', (d, i) => i * 50)
 *         .attr('y', d => 400 - d.value * 10)
 *         .attr('width', 40)
 *         .attr('height', d => d.value * 10)
 *         .attr('fill', 'steelblue');
 *     },
 *     data: [
 *       { value: 10 },
 *       { value: 20 },
 *       { value: 15 }
 *     ]
 *   }
 * });
 * ```
 */
export interface D3Config {
  /** Default width (default: 800) */
  width?: number;
  /** Default height (default: 600) */
  height?: number;
  /** Default background color */
  backgroundColor?: string;
}

export interface D3Params extends Record<string, unknown> {
  /** Width of the visualization */
  width?: number;
  /** Height of the visualization */
  height?: number;
  /** Background color */
  backgroundColor?: string;
  /**
   * Render function that receives (svg, d3, data) and creates the visualization
   * The svg is a D3 selection of the root SVG element
   */
  render?: (svg: any, d3: typeof import('d3'), data: any) => void;
  /**
   * String version of render function (for serialization)
   * Will be eval'd in a safe context
   */
  renderString?: string;
  /** Data to pass to the render function */
  data?: any;
}

/**
 * Create a D3 generator instance
 */
export default function d3viz(config: D3Config = {}): ImageGenerator {
  const {
    width: defaultWidth = 800,
    height: defaultHeight = 600,
    backgroundColor: defaultBgColor = 'white',
  } = config;

  return {
    name: "d3",

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      const {
        width = defaultWidth,
        height = defaultHeight,
        backgroundColor = defaultBgColor,
        render,
        renderString,
        data = [],
      } = params as D3Params;

      if (!render && !renderString) {
        throw new Error("D3 generator requires either 'render' function or 'renderString' parameter");
      }

      // Create a fake DOM using jsdom
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
      const document = dom.window.document;

      // Create SVG element
      const body = d3.select(document.body);
      const svg = body
        .append('svg')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', width)
        .attr('height', height)
        .style('background-color', backgroundColor);

      // Execute render function
      try {
        if (render) {
          // Direct function call
          await render(svg, d3, data);
        } else if (renderString) {
          // Eval string (for serialization scenarios like MCP)
          const renderFn = new Function('svg', 'd3', 'data', renderString);
          await renderFn(svg, d3, data);
        }
      } catch (error) {
        throw new Error(`D3 render function failed: ${(error as Error).message}`);
      }

      // Get the SVG string
      const svgNode = svg.node();
      if (!svgNode) {
        throw new Error('Failed to create SVG element');
      }

      const svgString = svgNode.outerHTML;
      const bytes = Buffer.from(svgString, 'utf-8');

      return {
        bytes,
        mime: 'image/svg+xml',
        width: width as number,
        height: height as number,
        source: "d3",
        metadata: {
          backgroundColor,
          dataPoints: Array.isArray(data) ? data.length : undefined,
        },
      };
    },
  };
}

// Also export as named export for convenience
export { d3viz };
