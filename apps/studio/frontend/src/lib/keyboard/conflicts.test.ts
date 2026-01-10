/**
 * Tests for keyboard shortcut conflict detection
 */

import { describe, it, expect } from "vitest";
import {
  isBrowserReserved,
  isReactFlowDefault,
  checkShortcutConflict,
  isValidBinding,
  BROWSER_RESERVED,
  REACT_FLOW_DEFAULTS,
} from "./conflicts";
import type { ShortcutAction } from "./types";

describe("conflicts", () => {
  describe("BROWSER_RESERVED", () => {
    it("includes common browser shortcuts", () => {
      expect(BROWSER_RESERVED).toContain("mod+w");
      expect(BROWSER_RESERVED).toContain("mod+t");
      expect(BROWSER_RESERVED).toContain("mod+r");
      expect(BROWSER_RESERVED).toContain("mod+q");
      expect(BROWSER_RESERVED).toContain("f5");
      expect(BROWSER_RESERVED).toContain("f12");
    });
  });

  describe("REACT_FLOW_DEFAULTS", () => {
    it("includes delete keys", () => {
      expect(REACT_FLOW_DEFAULTS).toContain("delete");
      expect(REACT_FLOW_DEFAULTS).toContain("backspace");
    });
  });

  describe("isBrowserReserved", () => {
    it("returns true for Cmd+W", () => {
      expect(isBrowserReserved("mod+w")).toBe(true);
    });

    it("returns true for Cmd+T", () => {
      expect(isBrowserReserved("mod+t")).toBe(true);
    });

    it("returns true for F5", () => {
      expect(isBrowserReserved("f5")).toBe(true);
    });

    it("returns true for F12", () => {
      expect(isBrowserReserved("f12")).toBe(true);
    });

    it("returns false for Cmd+S", () => {
      expect(isBrowserReserved("mod+s")).toBe(false);
    });

    it("returns false for Cmd+K", () => {
      expect(isBrowserReserved("mod+k")).toBe(false);
    });

    it("handles uppercase input", () => {
      expect(isBrowserReserved("MOD+W")).toBe(true);
    });

    it("handles whitespace in binding", () => {
      // The normalize function removes all whitespace, so these should match
      expect(isBrowserReserved(" mod+w ")).toBe(true);
      expect(isBrowserReserved("mod + w")).toBe(true);
    });
  });

  describe("isReactFlowDefault", () => {
    it("returns true for delete", () => {
      expect(isReactFlowDefault("delete")).toBe(true);
    });

    it("returns true for backspace", () => {
      expect(isReactFlowDefault("backspace")).toBe(true);
    });

    it("returns false for other keys", () => {
      expect(isReactFlowDefault("mod+d")).toBe(false);
      expect(isReactFlowDefault("escape")).toBe(false);
    });

    it("handles comma-separated bindings", () => {
      expect(isReactFlowDefault("delete,backspace")).toBe(true);
    });
  });

  describe("checkShortcutConflict", () => {
    it("detects browser reserved shortcuts", () => {
      const result = checkShortcutConflict("mod+w", {});
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe("browser");
      expect(result.message).toContain("browser");
    });

    it("detects React Flow defaults", () => {
      const result = checkShortcutConflict("delete", {});
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe("reactflow");
      expect(result.message).toContain("canvas");
    });

    it("detects internal conflicts", () => {
      const currentShortcuts: Partial<Record<ShortcutAction, string>> = {
        save: "mod+s",
      };
      const result = checkShortcutConflict("mod+s", currentShortcuts);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe("internal");
      expect(result.message).toContain("Save");
      expect(result.conflictingAction).toBe("save");
    });

    it("excludes specified action from conflict check", () => {
      const currentShortcuts: Partial<Record<ShortcutAction, string>> = {
        save: "mod+s",
      };
      const result = checkShortcutConflict("mod+s", currentShortcuts, "save");
      expect(result.hasConflict).toBe(false);
    });

    it("returns no conflict for unused shortcuts", () => {
      const currentShortcuts: Partial<Record<ShortcutAction, string>> = {
        save: "mod+s",
      };
      const result = checkShortcutConflict("mod+k", currentShortcuts);
      expect(result.hasConflict).toBe(false);
    });

    it("handles comma-separated bindings in conflict check", () => {
      const currentShortcuts: Partial<Record<ShortcutAction, string>> = {
        save: "mod+s,mod+shift+s",
      };
      const result = checkShortcutConflict("mod+shift+s", currentShortcuts);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe("internal");
    });

    it("handles empty shortcuts object", () => {
      const result = checkShortcutConflict("mod+s", {});
      expect(result.hasConflict).toBe(false);
    });

    it("handles null/undefined shortcuts in object", () => {
      const currentShortcuts: Partial<Record<ShortcutAction, string>> = {
        save: undefined as unknown as string,
      };
      const result = checkShortcutConflict("mod+s", currentShortcuts);
      expect(result.hasConflict).toBe(false);
    });
  });

  describe("isValidBinding", () => {
    it("validates simple bindings", () => {
      expect(isValidBinding("mod+s")).toBe(true);
      expect(isValidBinding("mod+shift+s")).toBe(true);
      expect(isValidBinding("escape")).toBe(true);
    });

    it("validates function keys", () => {
      expect(isValidBinding("f1")).toBe(true);
      expect(isValidBinding("f9")).toBe(true);
      expect(isValidBinding("f10")).toBe(true);
      expect(isValidBinding("f12")).toBe(true);
    });

    it("validates special keys", () => {
      expect(isValidBinding("enter")).toBe(true);
      expect(isValidBinding("escape")).toBe(true);
      expect(isValidBinding("backspace")).toBe(true);
      expect(isValidBinding("delete")).toBe(true);
      expect(isValidBinding("space")).toBe(true);
      expect(isValidBinding("tab")).toBe(true);
    });

    it("validates arrow keys", () => {
      expect(isValidBinding("arrowup")).toBe(true);
      expect(isValidBinding("arrowdown")).toBe(true);
      expect(isValidBinding("arrowleft")).toBe(true);
      expect(isValidBinding("arrowright")).toBe(true);
    });

    it("validates punctuation keys", () => {
      expect(isValidBinding("mod+comma")).toBe(true);
      expect(isValidBinding("mod+slash")).toBe(true);
      expect(isValidBinding("mod+equal")).toBe(true);
      expect(isValidBinding("mod+minus")).toBe(true);
      expect(isValidBinding("mod+period")).toBe(true);
    });

    it("rejects invalid bindings", () => {
      expect(isValidBinding("")).toBe(false);
      expect(isValidBinding("   ")).toBe(false);
      expect(isValidBinding("mod")).toBe(false); // Modifier only
      expect(isValidBinding("shift")).toBe(false); // Modifier only
      expect(isValidBinding("mod+shift")).toBe(false); // Modifiers only
    });

    it("rejects invalid key names", () => {
      expect(isValidBinding("mod+invalid")).toBe(false);
      expect(isValidBinding("mod+@")).toBe(false);
      expect(isValidBinding("f13")).toBe(false); // F keys only go to F12
      expect(isValidBinding("mod+ab")).toBe(false); // Multi-char non-special
    });

    it("validates number keys", () => {
      expect(isValidBinding("mod+0")).toBe(true);
      expect(isValidBinding("mod+1")).toBe(true);
      expect(isValidBinding("mod+9")).toBe(true);
    });

    it("validates letter keys", () => {
      expect(isValidBinding("mod+a")).toBe(true);
      expect(isValidBinding("mod+z")).toBe(true);
    });
  });
});
