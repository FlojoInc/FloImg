/**
 * Tests for keyboard platform utilities
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  bindingToDisplay,
  bindingToKeys,
  keyEventToBinding,
  keyEventToDisplay,
  isMac,
  getModifierKey,
  getOptionKey,
} from "./platformUtils";

// Mock navigator for platform detection tests
const mockNavigator = (platform: string) => {
  Object.defineProperty(global, "navigator", {
    value: { platform },
    writable: true,
  });
};

describe("platformUtils", () => {
  describe("isMac", () => {
    afterEach(() => {
      // Reset navigator
      Object.defineProperty(global, "navigator", {
        value: undefined,
        writable: true,
      });
    });

    it("returns true for Mac platform", () => {
      mockNavigator("MacIntel");
      expect(isMac()).toBe(true);
    });

    it("returns true for Mac ARM", () => {
      mockNavigator("MacARM");
      expect(isMac()).toBe(true);
    });

    it("returns false for Windows", () => {
      mockNavigator("Win32");
      expect(isMac()).toBe(false);
    });

    it("returns false for Linux", () => {
      mockNavigator("Linux x86_64");
      expect(isMac()).toBe(false);
    });

    it("returns false when navigator is undefined", () => {
      Object.defineProperty(global, "navigator", {
        value: undefined,
        writable: true,
      });
      expect(isMac()).toBe(false);
    });
  });

  describe("getModifierKey", () => {
    it("returns ⌘ on Mac", () => {
      mockNavigator("MacIntel");
      expect(getModifierKey()).toBe("⌘");
    });

    it("returns Ctrl on Windows/Linux", () => {
      mockNavigator("Win32");
      expect(getModifierKey()).toBe("Ctrl");
    });
  });

  describe("getOptionKey", () => {
    it("returns ⌥ on Mac", () => {
      mockNavigator("MacIntel");
      expect(getOptionKey()).toBe("⌥");
    });

    it("returns Alt on Windows/Linux", () => {
      mockNavigator("Win32");
      expect(getOptionKey()).toBe("Alt");
    });
  });

  describe("bindingToDisplay", () => {
    beforeEach(() => {
      mockNavigator("MacIntel");
    });

    it("converts mod+s to ⌘S on Mac", () => {
      expect(bindingToDisplay("mod+s")).toBe("⌘S");
    });

    it("converts mod+shift+s to ⌘⇧S", () => {
      expect(bindingToDisplay("mod+shift+s")).toBe("⌘⇧S");
    });

    it("converts mod+enter to ⌘⏎", () => {
      expect(bindingToDisplay("mod+enter")).toBe("⌘⏎");
    });

    it("converts escape to Esc", () => {
      expect(bindingToDisplay("escape")).toBe("Esc");
    });

    it("converts delete to Del", () => {
      expect(bindingToDisplay("delete")).toBe("Del");
    });

    it("handles empty binding", () => {
      expect(bindingToDisplay("")).toBe("");
    });

    it("handles arrow keys", () => {
      expect(bindingToDisplay("arrowup")).toBe("↑");
      expect(bindingToDisplay("arrowdown")).toBe("↓");
      expect(bindingToDisplay("arrowleft")).toBe("←");
      expect(bindingToDisplay("arrowright")).toBe("→");
    });

    it("converts comma key", () => {
      expect(bindingToDisplay("mod+comma")).toBe("⌘,");
    });

    it("converts slash key", () => {
      expect(bindingToDisplay("mod+slash")).toBe("⌘/");
    });

    it("handles Windows platform", () => {
      mockNavigator("Win32");
      expect(bindingToDisplay("mod+s")).toBe("CtrlS");
      expect(bindingToDisplay("alt+s")).toBe("AltS");
    });
  });

  describe("bindingToKeys", () => {
    beforeEach(() => {
      mockNavigator("MacIntel");
    });

    it("splits binding into array of keys", () => {
      expect(bindingToKeys("mod+s")).toEqual(["⌘", "S"]);
    });

    it("handles modifier combinations", () => {
      expect(bindingToKeys("mod+shift+s")).toEqual(["⌘", "⇧", "S"]);
    });

    it("handles special keys", () => {
      expect(bindingToKeys("mod+enter")).toEqual(["⌘", "⏎"]);
    });

    it("returns empty array for empty binding", () => {
      expect(bindingToKeys("")).toEqual([]);
    });

    it("handles alt key", () => {
      expect(bindingToKeys("alt+s")).toEqual(["⌥", "S"]);
    });

    it("handles ctrl key explicitly", () => {
      expect(bindingToKeys("ctrl+s")).toEqual(["⌃", "S"]);
    });
  });

  describe("keyEventToBinding", () => {
    const createKeyEvent = (key: string, options: Partial<KeyboardEvent> = {}): KeyboardEvent => {
      return {
        key,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        ...options,
      } as KeyboardEvent;
    };

    it("converts Cmd+S to mod+s", () => {
      const event = createKeyEvent("s", { metaKey: true });
      expect(keyEventToBinding(event)).toBe("mod+s");
    });

    it("converts Ctrl+S to mod+s", () => {
      const event = createKeyEvent("s", { ctrlKey: true });
      expect(keyEventToBinding(event)).toBe("mod+s");
    });

    it("converts Cmd+Shift+S to mod+shift+s", () => {
      const event = createKeyEvent("s", { metaKey: true, shiftKey: true });
      expect(keyEventToBinding(event)).toBe("mod+shift+s");
    });

    it("converts Enter to enter", () => {
      const event = createKeyEvent("Enter");
      expect(keyEventToBinding(event)).toBe("enter");
    });

    it("converts space bar", () => {
      const event = createKeyEvent(" ");
      expect(keyEventToBinding(event)).toBe("space");
    });

    it("converts comma", () => {
      const event = createKeyEvent(",", { metaKey: true });
      expect(keyEventToBinding(event)).toBe("mod+comma");
    });

    it("converts slash", () => {
      const event = createKeyEvent("/", { metaKey: true });
      expect(keyEventToBinding(event)).toBe("mod+slash");
    });

    it("returns empty string for modifier-only", () => {
      const event = createKeyEvent("Meta", { metaKey: true });
      expect(keyEventToBinding(event)).toBe("");
    });

    it("returns empty string for Shift only", () => {
      const event = createKeyEvent("Shift", { shiftKey: true });
      expect(keyEventToBinding(event)).toBe("");
    });

    it("handles Alt modifier", () => {
      const event = createKeyEvent("s", { altKey: true });
      expect(keyEventToBinding(event)).toBe("alt+s");
    });

    it("handles complex combinations", () => {
      const event = createKeyEvent("s", { metaKey: true, altKey: true, shiftKey: true });
      expect(keyEventToBinding(event)).toBe("mod+alt+shift+s");
    });
  });

  describe("keyEventToDisplay", () => {
    beforeEach(() => {
      mockNavigator("MacIntel");
    });

    it("converts keyboard event directly to display string", () => {
      const event = {
        key: "s",
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      } as KeyboardEvent;

      expect(keyEventToDisplay(event)).toBe("⌘S");
    });
  });
});
