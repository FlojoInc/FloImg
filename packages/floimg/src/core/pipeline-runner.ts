/**
 * Pipeline execution engine with parallel step support
 *
 * This module provides dependency analysis and parallel execution for floimg pipelines.
 * Steps are grouped into "waves" based on their dependencies, and each wave is executed
 * concurrently (bounded by the pipeline's concurrency setting).
 */

import type { PipelineStep } from "./types.js";

/**
 * Represents a step with its dependency information
 */
export interface StepNode {
  /** Original index in the pipeline steps array */
  index: number;
  /** The pipeline step */
  step: PipelineStep;
  /** Variable names this step depends on (inputs) */
  dependencies: Set<string>;
  /** Variable names this step produces (outputs) */
  outputs: string[];
}

/**
 * A group of steps that can be executed in parallel
 */
export interface ExecutionWave {
  /** Steps that can run concurrently */
  steps: StepNode[];
}

/**
 * Build a dependency graph from pipeline steps
 *
 * Analyzes each step to determine:
 * - What variables it depends on (from `in` field)
 * - What variables it produces (from `out` field)
 *
 * @param steps - Array of pipeline steps
 * @returns Array of step nodes with dependency information
 */
export function buildDependencyGraph(steps: PipelineStep[]): StepNode[] {
  return steps.map((step, index) => {
    const dependencies = new Set<string>();
    const outputs: string[] = [];

    if (step.kind === "generate") {
      // Generate steps have no inputs, only output
      outputs.push(step.out);
    } else if (step.kind === "transform") {
      // Transform steps depend on their input variable
      dependencies.add(step.in);
      outputs.push(step.out);
    } else if (step.kind === "save") {
      // Save steps depend on their input variable
      dependencies.add(step.in);
      // Save steps may optionally produce an output
      if (step.out) {
        outputs.push(step.out);
      }
    } else if (step.kind === "vision") {
      // Vision steps depend on their input image
      dependencies.add(step.in);
      outputs.push(step.out);
    } else if (step.kind === "text") {
      // Text steps may optionally depend on context from previous step
      if (step.in) {
        dependencies.add(step.in);
      }
      outputs.push(step.out);
    }

    return { index, step, dependencies, outputs };
  });
}

/**
 * Compute execution waves from the dependency graph
 *
 * Groups steps into "waves" where:
 * - All steps in a wave have their dependencies satisfied
 * - All steps in a wave can run in parallel
 * - Waves are executed sequentially
 *
 * @param nodes - Step nodes with dependency information
 * @param preSatisfied - Optional set of variable names that are already available (e.g., from initialVariables)
 * @returns Array of execution waves
 * @throws Error if circular dependency is detected
 */
export function computeExecutionWaves(
  nodes: StepNode[],
  preSatisfied?: Set<string>
): ExecutionWave[] {
  const waves: ExecutionWave[] = [];
  const completed = new Set<string>(preSatisfied); // Start with pre-satisfied variables
  const remaining = new Set(nodes);

  while (remaining.size > 0) {
    const wave: StepNode[] = [];

    for (const node of remaining) {
      // Check if all dependencies are satisfied
      const satisfied = [...node.dependencies].every((dep) => completed.has(dep));
      if (satisfied) {
        wave.push(node);
      }
    }

    if (wave.length === 0) {
      // No progress can be made - circular dependency or missing input
      const unsatisfied = [...remaining].map((n) => ({
        step: n.step.kind,
        needs: [...n.dependencies].filter((d) => !completed.has(d)),
      }));
      throw new Error(
        `Circular dependency or missing input detected in pipeline. ` +
          `Unsatisfied steps: ${JSON.stringify(unsatisfied)}`
      );
    }

    // Remove wave nodes from remaining, add their outputs to completed
    for (const node of wave) {
      remaining.delete(node);
      node.outputs.forEach((out) => completed.add(out));
    }

    waves.push({ steps: wave });
  }

  return waves;
}

/**
 * Execute tasks with bounded concurrency
 *
 * Runs tasks in parallel but limits the number of concurrent executions.
 * If concurrency is Infinity, all tasks run in parallel.
 *
 * @param tasks - Array of async task functions
 * @param concurrency - Maximum number of concurrent tasks
 * @returns Array of results in the same order as tasks
 */
export async function executeWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  if (concurrency === Infinity || concurrency >= tasks.length) {
    // Run all tasks in parallel
    return Promise.all(tasks.map((fn) => fn()));
  }

  // Run tasks in batches
  const results: T[] = [];

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }

  return results;
}
