import { describe, it, expect } from "vitest";
import {
  buildDependencyGraph,
  computeExecutionWaves,
  executeWithConcurrency,
} from "../src/core/pipeline-runner.js";
import type { PipelineStep } from "../src/core/types.js";

describe("Pipeline Runner", () => {
  describe("buildDependencyGraph", () => {
    it("should identify generate steps with no dependencies", () => {
      const steps: PipelineStep[] = [
        { kind: "generate", generator: "shapes", params: {}, out: "img1" },
      ];

      const nodes = buildDependencyGraph(steps);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].dependencies.size).toBe(0);
      expect(nodes[0].outputs).toEqual(["img1"]);
    });

    it("should identify transform step dependencies", () => {
      const steps: PipelineStep[] = [
        { kind: "generate", generator: "shapes", params: {}, out: "img1" },
        { kind: "transform", in: "img1", op: "resize", params: {}, out: "img2" },
      ];

      const nodes = buildDependencyGraph(steps);

      expect(nodes).toHaveLength(2);
      expect(nodes[1].dependencies.has("img1")).toBe(true);
      expect(nodes[1].outputs).toEqual(["img2"]);
    });

    it("should identify save step dependencies", () => {
      const steps: PipelineStep[] = [
        { kind: "generate", generator: "shapes", params: {}, out: "img1" },
        { kind: "save", in: "img1", destination: "output.png" },
      ];

      const nodes = buildDependencyGraph(steps);

      expect(nodes).toHaveLength(2);
      expect(nodes[1].dependencies.has("img1")).toBe(true);
      expect(nodes[1].outputs).toEqual([]); // save with no out
    });

    it("should identify save step with optional output", () => {
      const steps: PipelineStep[] = [
        { kind: "generate", generator: "shapes", params: {}, out: "img1" },
        { kind: "save", in: "img1", destination: "output.png", out: "saved" },
      ];

      const nodes = buildDependencyGraph(steps);

      expect(nodes[1].outputs).toEqual(["saved"]);
    });
  });

  describe("computeExecutionWaves", () => {
    it("should group independent steps in same wave", () => {
      const steps: PipelineStep[] = [
        { kind: "generate", generator: "shapes", params: {}, out: "img1" },
        { kind: "generate", generator: "shapes", params: {}, out: "img2" },
        { kind: "generate", generator: "shapes", params: {}, out: "img3" },
      ];

      const nodes = buildDependencyGraph(steps);
      const waves = computeExecutionWaves(nodes);

      expect(waves).toHaveLength(1);
      expect(waves[0].steps).toHaveLength(3);
    });

    it("should put dependent steps in later waves", () => {
      const steps: PipelineStep[] = [
        { kind: "generate", generator: "shapes", params: {}, out: "img1" },
        { kind: "transform", in: "img1", op: "resize", params: {}, out: "img2" },
      ];

      const nodes = buildDependencyGraph(steps);
      const waves = computeExecutionWaves(nodes);

      expect(waves).toHaveLength(2);
      expect(waves[0].steps).toHaveLength(1);
      expect(waves[0].steps[0].step.kind).toBe("generate");
      expect(waves[1].steps).toHaveLength(1);
      expect(waves[1].steps[0].step.kind).toBe("transform");
    });

    it("should handle fan-out pattern (1 generate -> 2 transforms)", () => {
      const steps: PipelineStep[] = [
        { kind: "generate", generator: "shapes", params: {}, out: "original" },
        { kind: "transform", in: "original", op: "resize", params: { width: 100 }, out: "small" },
        { kind: "transform", in: "original", op: "resize", params: { width: 500 }, out: "large" },
      ];

      const nodes = buildDependencyGraph(steps);
      const waves = computeExecutionWaves(nodes);

      expect(waves).toHaveLength(2);
      expect(waves[0].steps).toHaveLength(1); // generate
      expect(waves[1].steps).toHaveLength(2); // both transforms in parallel
    });

    it("should handle sequential chain", () => {
      const steps: PipelineStep[] = [
        { kind: "generate", generator: "shapes", params: {}, out: "img1" },
        { kind: "transform", in: "img1", op: "blur", params: {}, out: "img2" },
        { kind: "transform", in: "img2", op: "resize", params: {}, out: "img3" },
        { kind: "save", in: "img3", destination: "output.png" },
      ];

      const nodes = buildDependencyGraph(steps);
      const waves = computeExecutionWaves(nodes);

      expect(waves).toHaveLength(4);
      waves.forEach((wave) => expect(wave.steps).toHaveLength(1));
    });

    it("should detect circular/missing dependencies", () => {
      const steps: PipelineStep[] = [
        { kind: "transform", in: "nonexistent", op: "resize", params: {}, out: "img1" },
      ];

      const nodes = buildDependencyGraph(steps);

      // Pipeline runner still detects missing dependencies at execution planning stage
      // (even if SDK validation catches this earlier at client.run() level)
      expect(() => computeExecutionWaves(nodes)).toThrow(/Circular dependency or missing input/);
    });

    it("should handle multiple independent chains", () => {
      const steps: PipelineStep[] = [
        // Chain 1
        { kind: "generate", generator: "shapes", params: {}, out: "chain1_img" },
        { kind: "transform", in: "chain1_img", op: "resize", params: {}, out: "chain1_resized" },
        // Chain 2
        { kind: "generate", generator: "qr", params: {}, out: "chain2_img" },
        { kind: "transform", in: "chain2_img", op: "blur", params: {}, out: "chain2_blurred" },
      ];

      const nodes = buildDependencyGraph(steps);
      const waves = computeExecutionWaves(nodes);

      expect(waves).toHaveLength(2);
      expect(waves[0].steps).toHaveLength(2); // both generates
      expect(waves[1].steps).toHaveLength(2); // both transforms
    });

    it("should treat preSatisfied variables as already completed", () => {
      // Transform that references a pre-satisfied variable (e.g., from initialVariables)
      const steps: PipelineStep[] = [
        { kind: "transform", in: "uploaded_img", op: "resize", params: {}, out: "resized" },
        { kind: "save", in: "resized", destination: "output.png" },
      ];

      const nodes = buildDependencyGraph(steps);

      // Without preSatisfied, this would throw (missing input)
      expect(() => computeExecutionWaves(nodes)).toThrow(/missing input/);

      // With preSatisfied, the transform can run in wave 0
      const preSatisfied = new Set(["uploaded_img"]);
      const waves = computeExecutionWaves(nodes, preSatisfied);

      expect(waves).toHaveLength(2);
      expect(waves[0].steps).toHaveLength(1);
      expect(waves[0].steps[0].step.kind).toBe("transform");
      expect(waves[1].steps).toHaveLength(1);
      expect(waves[1].steps[0].step.kind).toBe("save");
    });

    it("should allow multiple steps to use same preSatisfied variable", () => {
      // Fan-out from a pre-loaded image
      const steps: PipelineStep[] = [
        { kind: "transform", in: "input_img", op: "resize", params: { width: 100 }, out: "small" },
        { kind: "transform", in: "input_img", op: "resize", params: { width: 500 }, out: "large" },
        { kind: "transform", in: "input_img", op: "blur", params: {}, out: "blurred" },
      ];

      const nodes = buildDependencyGraph(steps);
      const preSatisfied = new Set(["input_img"]);
      const waves = computeExecutionWaves(nodes, preSatisfied);

      // All transforms can run in parallel since they all depend on pre-satisfied input
      expect(waves).toHaveLength(1);
      expect(waves[0].steps).toHaveLength(3);
    });

    it("should work with mix of preSatisfied and generated variables", () => {
      const steps: PipelineStep[] = [
        // This uses pre-loaded input
        { kind: "transform", in: "uploaded_img", op: "resize", params: {}, out: "resized" },
        // This generates a new image
        { kind: "generate", generator: "shapes", params: {}, out: "generated" },
        // This composites both together
        {
          kind: "transform",
          in: "resized",
          op: "composite",
          params: { overlay: "generated" },
          out: "final",
        },
      ];

      const nodes = buildDependencyGraph(steps);
      const preSatisfied = new Set(["uploaded_img"]);
      const waves = computeExecutionWaves(nodes, preSatisfied);

      // Wave 0: resize (uses preSatisfied) and generate (no deps) can run in parallel
      expect(waves).toHaveLength(2);
      expect(waves[0].steps).toHaveLength(2);
      // Wave 1: composite depends on both outputs
      expect(waves[1].steps).toHaveLength(1);
      expect(waves[1].steps[0].step.kind).toBe("transform");
    });
  });

  describe("executeWithConcurrency", () => {
    it("should execute all tasks in parallel with Infinity concurrency", async () => {
      const executionOrder: number[] = [];
      const tasks = [1, 2, 3].map((n) => async () => {
        executionOrder.push(n);
        return n * 2;
      });

      const results = await executeWithConcurrency(tasks, Infinity);

      expect(results).toEqual([2, 4, 6]);
    });

    it("should respect concurrency limit", async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const tasks = [1, 2, 3, 4].map((n) => async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 10)); // Small delay
        concurrent--;
        return n;
      });

      const results = await executeWithConcurrency(tasks, 2);

      expect(results).toEqual([1, 2, 3, 4]);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it("should handle empty task list", async () => {
      const results = await executeWithConcurrency([], 5);
      expect(results).toEqual([]);
    });

    it("should handle single task", async () => {
      const results = await executeWithConcurrency([async () => 42], 1);
      expect(results).toEqual([42]);
    });

    it("should preserve order of results", async () => {
      const tasks = [100, 50, 10].map((delay) => async () => {
        await new Promise((r) => setTimeout(r, delay));
        return delay;
      });

      // With batch processing, results should be in original order
      const results = await executeWithConcurrency(tasks, 3);
      expect(results).toEqual([100, 50, 10]);
    });
  });
});
