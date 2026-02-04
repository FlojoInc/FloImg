# AI Workflow Generator

The AI Workflow Generator allows users to describe workflows in natural language and have Gemini generate valid FloImg Studio workflows.

## Overview

Users describe what they want (e.g., "resize my image to 800x600 and convert to webp") and Gemini returns structured JSON matching the FloImg workflow schema. The generated workflow loads directly onto the Studio canvas.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Workflow Generation Flow                   │
│                                                                  │
│  User Prompt ──► Gemini 3 ──► Generated Workflow ──► Validation │
│                      │              │                     │      │
│                      ▼              ▼                     ▼      │
│              System Prompt    Studio Format         Pipeline     │
│              + Node Schema    Conversion            Validation   │
│                                                          │       │
│                                     ◄────── Retry ◄──────┘       │
│                                   (if invalid)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component                   | Location                                           | Purpose                                               |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `generateWorkflow()`        | `apps/studio/backend/src/ai/workflow-generator.ts` | Main generation function with validation-retry loop   |
| `buildSystemPrompt()`       | Same file                                          | Builds context with available nodes and examples      |
| `generatedToStudioFormat()` | Same file                                          | Converts Gemini output to Studio node/edge format     |
| `nodesToPipeline()`         | `apps/studio/shared/src/index.ts`                  | Converts Studio format to SDK Pipeline for validation |
| `validatePipelineFull()`    | `packages/floimg/src/core/validator.ts`            | SDK-level semantic validation                         |

## Validation-Retry Loop

The generator implements a validation-retry loop to improve reliability. This is critical because LLMs can produce structurally valid but semantically incorrect workflows.

### How It Works

1. **Generate**: Gemini produces a workflow from the user's prompt
2. **Validate Studio Format**: Basic structural checks (node types exist, edges reference valid nodes)
3. **Convert to Pipeline**: `nodesToPipeline()` transforms to SDK Pipeline format
4. **Validate Pipeline**: `validatePipelineFull()` checks semantic correctness
5. **Repair if Invalid**: Build a repair prompt with specific error messages
6. **Retry**: Up to `MAX_GENERATION_ATTEMPTS` (3 times)

```typescript
// Simplified flow (actual code in workflow-generator.ts)
while (attempt < MAX_GENERATION_ATTEMPTS) {
  const workflow = await generateFromGemini(prompt);

  // Studio format validation
  const studioValidation = validateWorkflow(workflow);
  if (!studioValidation.valid) {
    prompt = buildRepairPrompt(workflow, studioValidation.errors);
    continue;
  }

  // Pipeline validation (End-to-End Consistency)
  const { pipeline } = nodesToPipeline(studioNodes, studioEdges);
  const pipelineValidation = validatePipelineFull(pipeline, capabilities);
  if (!pipelineValidation.valid) {
    prompt = buildRepairPrompt(workflow, pipelineValidation.errors);
    continue;
  }

  return { success: true, workflow };
}
```

### Validation Layers

**Studio Format Validation** checks:

- All node types exist in the registry
- All edge references point to valid nodes
- Workflows have at least one source node (generator, input, or text)
- AI generators have prompt sources (static or incoming edge)
- Fan-out in array mode has `arrayProperty` set

**Pipeline Validation** checks:

- All variable references are defined (by previous steps or `initialVariables`)
- AI generators have prompt sources
- Transforms have image inputs
- Collect/router nodes have valid inputs

### Input Node Handling

Input nodes (type `input:upload`) are special - they don't create pipeline steps because their data is injected at runtime via `initialVariables`. To support this:

1. `nodesToPipeline()` tracks input node variable names
2. These are added to `pipeline.initialVariables` with placeholder values
3. The SDK validator sees these as pre-defined variables
4. At execution time, actual image data is injected via `initialVariablesBase64`

```typescript
// In nodesToPipeline()
if (node.type === "input") {
  inputNodeVars.push(varName);
  continue; // Skip step creation
}

// In return
return {
  pipeline: {
    name: "Studio Workflow",
    steps,
    initialVariables:
      inputNodeVars.length > 0
        ? Object.fromEntries(inputNodeVars.map((v) => [v, null]))
        : undefined,
  },
  nodeToVar,
};
```

### Repair Prompts

When validation fails, a repair prompt is constructed with:

- The original user request
- The current (invalid) workflow
- Specific error messages with fix suggestions

Example repair prompt:

```
The workflow you generated has validation errors that need to be fixed.

Original request: "Take my uploaded image and resize it"

Current workflow (needs fixes):
{...}

Validation errors:
1. Node "resize_1" (transform:sharp:resize): Missing image input
   Fix: Connect a generator or another transform to this node's image input

Please generate a corrected workflow that fixes ALL the validation errors above.
```

## System Prompt

The system prompt includes:

1. **Available node types** with their parameters (from the registry)
2. **Workflow structure rules** (sources, edges, connections)
3. **Examples** covering common patterns:
   - Simple: Generate and resize
   - Input nodes: Upload → transforms
   - Reference images: Upload → AI variations
   - Dynamic prompts: Text → generators
   - Structured output: Text with JSON schema → multiple generators
   - Composite transforms: Multiple images layered
   - Iterative workflows: Fan-out → collect → vision → router

## Models

The generator supports multiple Gemini models:

| Model ID                 | Name             | Description                   |
| ------------------------ | ---------------- | ----------------------------- |
| `gemini-3-pro-preview`   | Gemini 3 Pro     | Most capable, default         |
| `gemini-3-flash-preview` | Gemini 3 Flash   | Fast, good for most workflows |
| `gemini-2.5-flash`       | Gemini 2.5 Flash | Fastest, cost-effective       |

## Error Handling

Errors are categorized and handled differently:

| Error Type                   | Handling                            |
| ---------------------------- | ----------------------------------- |
| API error (rate limit, auth) | Return immediately, don't retry     |
| Parse error (invalid JSON)   | Return immediately, don't retry     |
| Validation error (semantic)  | Retry with repair prompt            |
| Exhausted attempts           | Return partial workflow with errors |

## Extending

To add new node types to the generator:

1. Register the node in `apps/studio/backend/src/floimg/registry.ts`
2. Add handling in `generatedToStudioFormat()` for the new type
3. Add an example to the system prompt showing correct usage
4. Test with the validation-retry loop to ensure it generates valid workflows

## Related Documents

- [[Studio-Real-Time-Execution]] - SSE streaming for generation progress
- [[LLM-Integration]] - How floimg works with LLMs
- [[Pipeline-Execution-Engine]] - How workflows execute
- [[Schema-Capability-System]] - Node type discovery and validation
