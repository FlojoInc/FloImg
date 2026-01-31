---
tags: [bug, studio, export]
status: backlog
priority: p2
created: 2026-01-30
repo: floimg
---

# BUG-2026-013: YAML Export Missing Node Parameters

## Bug Details

| Field    | Value        |
| -------- | ------------ |
| ID       | BUG-2026-013 |
| Priority | P2           |
| Created  | 2026-01-30   |
| Status   | Backlog      |

## Description

The YAML export feature in FloImg Studio produces minimal output with only step names and types, missing all node configuration including parameters, inputs, and connections.

## Reproduction Steps

1. Create a workflow with configured nodes (e.g., resize with width/height)
2. Click Export → YAML
3. Observe output only contains:
   ```yaml
   steps:
     - name: step_1
       type: generator
     - name: step_2
       type: transform
   ```

## Expected Behavior

Full workflow export including:

- Node type specifics (e.g., `generator:gemini-generate`)
- Parameters (e.g., `width: 800, height: 600`)
- Input references (e.g., `in: step_1`)
- All configuration needed to recreate the workflow

## Root Cause

The YAML export function in FSC only serializes basic node metadata, not the full `StudioNode` configuration.

## Fix Approach

Update the `/api/export/yaml` endpoint to serialize complete node data including:

- `data.params` for each node
- Edge connections as input references
- Generator/transform provider names

## Files to Modify

- `floimg-cloud/packages/api/src/routes/export.ts` (or wherever YAML export lives)

## Acceptance Criteria

- [ ] YAML export includes full node parameters
- [ ] YAML export includes node type specifics
- [ ] YAML export includes input/output connections
- [ ] Exported YAML can be imported back into Studio
- [ ] Exported YAML works with `floimg run` CLI
