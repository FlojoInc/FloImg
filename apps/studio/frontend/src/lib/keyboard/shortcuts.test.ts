/**
 * Tests for keyboard shortcut definitions
 */

import { describe, it, expect } from "vitest";
import {
  SHORTCUT_DEFINITIONS,
  CATEGORY_NAMES,
  getShortcutsByCategory,
  getDefaultShortcuts,
} from "./shortcuts";
import type { ShortcutCategory } from "./types";

describe("shortcuts", () => {
  describe("SHORTCUT_DEFINITIONS", () => {
    it("has required shortcut actions", () => {
      const actions = SHORTCUT_DEFINITIONS.map((d) => d.action);

      // Workflow shortcuts
      expect(actions).toContain("save");
      expect(actions).toContain("execute");
      expect(actions).toContain("newWorkflow");

      // Editing shortcuts
      expect(actions).toContain("duplicate");
      expect(actions).toContain("selectAll");
      expect(actions).toContain("deselect");

      // UI shortcuts
      expect(actions).toContain("commandPalette");
      expect(actions).toContain("showShortcuts");
      expect(actions).toContain("settings");
      expect(actions).toContain("toggleLibrary");
      expect(actions).toContain("toggleAIChat");

      // Canvas shortcuts
      expect(actions).toContain("zoomIn");
      expect(actions).toContain("zoomOut");
      expect(actions).toContain("zoomFit");
    });

    it("each definition has required fields", () => {
      for (const def of SHORTCUT_DEFINITIONS) {
        expect(def.action).toBeDefined();
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.category).toBeDefined();
        expect(typeof def.customizable).toBe("boolean");
      }
    });

    it("all definitions have valid categories", () => {
      const validCategories: ShortcutCategory[] = ["workflow", "editing", "canvas", "ui"];
      for (const def of SHORTCUT_DEFINITIONS) {
        expect(validCategories).toContain(def.category);
      }
    });

    it("all default bindings are valid format", () => {
      for (const def of SHORTCUT_DEFINITIONS) {
        if (def.defaultBinding) {
          // Binding should be lowercase with + and , separators (comma for multi-bindings)
          expect(def.defaultBinding).toMatch(/^[a-z0-9+,]+$/);
        }
      }
    });
  });

  describe("CATEGORY_NAMES", () => {
    it("has display names for all categories", () => {
      expect(CATEGORY_NAMES.workflow).toBeDefined();
      expect(CATEGORY_NAMES.editing).toBeDefined();
      expect(CATEGORY_NAMES.canvas).toBeDefined();
      expect(CATEGORY_NAMES.ui).toBeDefined();
    });

    it("display names are human readable", () => {
      expect(CATEGORY_NAMES.workflow).toBe("Workflow");
      expect(CATEGORY_NAMES.editing).toBe("Editing");
      expect(CATEGORY_NAMES.canvas).toBe("Canvas");
      expect(CATEGORY_NAMES.ui).toBe("Interface");
    });
  });

  describe("getShortcutsByCategory", () => {
    it("groups shortcuts by category", () => {
      const grouped = getShortcutsByCategory();

      expect(grouped.workflow).toBeDefined();
      expect(grouped.editing).toBeDefined();
      expect(grouped.canvas).toBeDefined();
      expect(grouped.ui).toBeDefined();
    });

    it("workflow category contains save and execute", () => {
      const grouped = getShortcutsByCategory();
      const workflowActions = grouped.workflow.map((d) => d.action);

      expect(workflowActions).toContain("save");
      expect(workflowActions).toContain("execute");
    });

    it("editing category contains duplicate", () => {
      const grouped = getShortcutsByCategory();
      const editingActions = grouped.editing.map((d) => d.action);

      expect(editingActions).toContain("duplicate");
    });

    it("ui category contains commandPalette and settings", () => {
      const grouped = getShortcutsByCategory();
      const uiActions = grouped.ui.map((d) => d.action);

      expect(uiActions).toContain("commandPalette");
      expect(uiActions).toContain("settings");
    });

    it("canvas category contains zoom shortcuts", () => {
      const grouped = getShortcutsByCategory();
      const canvasActions = grouped.canvas.map((d) => d.action);

      expect(canvasActions).toContain("zoomIn");
      expect(canvasActions).toContain("zoomOut");
      expect(canvasActions).toContain("zoomFit");
    });

    it("all definitions are categorized", () => {
      const grouped = getShortcutsByCategory();
      const totalGrouped =
        grouped.workflow.length +
        grouped.editing.length +
        grouped.canvas.length +
        grouped.ui.length;

      expect(totalGrouped).toBe(SHORTCUT_DEFINITIONS.length);
    });
  });

  describe("getDefaultShortcuts", () => {
    it("returns map of action to default binding", () => {
      const defaults = getDefaultShortcuts();

      expect(defaults.save).toBe("mod+s");
      expect(defaults.execute).toBe("mod+enter");
      expect(defaults.commandPalette).toBe("mod+k");
    });

    it("includes all actions with default bindings", () => {
      const defaults = getDefaultShortcuts();
      const defsWithBindings = SHORTCUT_DEFINITIONS.filter((d) => d.defaultBinding);

      for (const def of defsWithBindings) {
        expect(defaults[def.action]).toBe(def.defaultBinding);
      }
    });

    it("actions without default bindings return null", () => {
      const defaults = getDefaultShortcuts();
      const defsWithoutBindings = SHORTCUT_DEFINITIONS.filter((d) => !d.defaultBinding);

      for (const def of defsWithoutBindings) {
        // Actions without defaults have null (or undefined, depending on implementation)
        expect(defaults[def.action] ?? null).toBeNull();
      }
    });
  });
});
