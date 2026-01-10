import { describe, it, expect } from "vitest";
import { detectPromptType, isPromptDetailed, enhancePrompt } from "../src/prompt-enhancer.js";

describe("prompt-enhancer", () => {
  describe("detectPromptType", () => {
    it("should detect photorealistic prompts", () => {
      expect(detectPromptType("a photo of a cat")).toBe("photorealistic");
      expect(detectPromptType("realistic portrait")).toBe("photorealistic");
      expect(detectPromptType("captured with a camera")).toBe("photorealistic");
    });

    it("should detect portrait prompts", () => {
      expect(detectPromptType("portrait of a woman")).toBe("portrait");
      expect(detectPromptType("headshot of a businessman")).toBe("portrait");
    });

    it("should detect landscape prompts", () => {
      expect(detectPromptType("mountain landscape at sunset")).toBe("landscape");
      expect(detectPromptType("ocean scenery")).toBe("landscape");
    });

    it("should detect illustration prompts", () => {
      expect(detectPromptType("cartoon character")).toBe("illustration");
      expect(detectPromptType("anime style drawing")).toBe("illustration");
      expect(detectPromptType("digital art illustration")).toBe("illustration");
    });

    it("should detect logo prompts", () => {
      expect(detectPromptType("logo for a coffee shop")).toBe("logo");
      expect(detectPromptType("brand icon design")).toBe("logo");
    });

    it("should detect product prompts", () => {
      expect(detectPromptType("product photo of a bottle")).toBe("product");
      expect(detectPromptType("e-commerce mockup")).toBe("product");
    });

    it("should detect minimalist prompts", () => {
      expect(detectPromptType("minimalist design")).toBe("minimalist");
      expect(detectPromptType("simple clean composition with negative space")).toBe("minimalist");
    });

    it("should detect edit prompts", () => {
      expect(detectPromptType("change the sky to blue")).toBe("edit");
      expect(detectPromptType("remove the background")).toBe("edit");
      expect(detectPromptType("add a hat to the person")).toBe("edit");
      expect(detectPromptType("make it look vintage")).toBe("edit");
    });

    it("should return general for unrecognized prompts", () => {
      expect(detectPromptType("xyz abc 123")).toBe("general");
    });
  });

  describe("isPromptDetailed", () => {
    it("should return false for very short prompts", () => {
      expect(isPromptDetailed("cat")).toBe(false);
      expect(isPromptDetailed("a dog")).toBe(false);
      expect(isPromptDetailed("red car")).toBe(false);
    });

    it("should return true for very long prompts", () => {
      const longPrompt =
        "A photorealistic close-up portrait of an elderly Japanese ceramicist with deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a freshly glazed tea bowl. The setting is his rustic, sun-drenched workshop.";
      expect(isPromptDetailed(longPrompt)).toBe(true);
    });

    it("should detect prompts with descriptive elements as detailed", () => {
      expect(
        isPromptDetailed(
          "A cat with soft lighting in a detailed background, vibrant colors and dramatic angle"
        )
      ).toBe(true);
    });

    it("should not consider medium-length prompts without descriptive elements as detailed", () => {
      expect(isPromptDetailed("a red car on a road during daytime")).toBe(false);
    });
  });

  describe("enhancePrompt", () => {
    it("should not modify empty prompts", () => {
      expect(enhancePrompt("")).toBe("");
      expect(enhancePrompt("  ")).toBe("  "); // Whitespace-only returns as-is
    });

    it("should not modify already detailed prompts", () => {
      const detailed =
        "A photorealistic close-up portrait of an elderly Japanese ceramicist with deep wrinkles and a warm smile, soft golden hour lighting, captured with an 85mm portrait lens, detailed background with pottery wheels";
      const result = enhancePrompt(detailed);
      expect(result).toBe(detailed);
    });

    it("should enhance simple prompts", () => {
      const simple = "a cat";
      const enhanced = enhancePrompt(simple);
      expect(enhanced).not.toBe(simple);
      expect(enhanced.length).toBeGreaterThan(simple.length);
    });

    it("should enhance photorealistic prompts with photography terms", () => {
      const prompt = "photo of a mountain";
      const enhanced = enhancePrompt(prompt);
      expect(enhanced).toContain("photorealistic");
    });

    it("should enhance logo prompts with design terms", () => {
      const prompt = "logo for a tech company";
      const enhanced = enhancePrompt(prompt);
      expect(enhanced.toLowerCase()).toMatch(/modern|professional|clean|background/);
    });

    it("should enhance product prompts with photography terms", () => {
      const prompt = "e-commerce product headphones";
      const enhanced = enhancePrompt(prompt);
      expect(enhanced.toLowerCase()).toMatch(/studio|professional|lighting|focus/);
    });

    it("should enhance minimalist prompts appropriately", () => {
      const prompt = "minimalist apple";
      const enhanced = enhancePrompt(prompt);
      expect(enhanced.toLowerCase()).toMatch(/composition|negative space|lighting/);
    });

    it("should enhance edit prompts with preservation instructions", () => {
      const prompt = "add a hat";
      const enhanced = enhancePrompt(prompt, "edit");
      expect(enhanced.toLowerCase()).toMatch(/preserve|original|style/);
    });

    it("should handle edit context for edit-like prompts", () => {
      const prompt = "change the background to blue";
      const enhanced = enhancePrompt(prompt, "edit");
      expect(enhanced).toContain(prompt); // Original should be included
      expect(enhanced.length).toBeGreaterThan(prompt.length);
    });

    it("should not double-enhance prompts that already have key terms", () => {
      const prompt = "A photorealistic photo with soft lighting and detailed texture";
      const enhanced = enhancePrompt(prompt);
      // Should not add redundant "photorealistic" or excessive terms
      const photoCount = (enhanced.match(/photorealistic/gi) || []).length;
      expect(photoCount).toBeLessThanOrEqual(2); // At most one addition
    });
  });

  describe("integration scenarios", () => {
    it("should handle common user prompts appropriately", () => {
      // Simple keyword
      const cat = enhancePrompt("cat");
      expect(cat.length).toBeGreaterThan(10);

      // Partial description
      const car = enhancePrompt("a red car on a highway");
      expect(car.length).toBeGreaterThan(30);

      // Style request
      const anime = enhancePrompt("anime girl");
      expect(anime).toMatch(/illustration|detailed|composition/i);
    });

    it("should preserve user intent while adding detail", () => {
      const prompt = "sunset over mountains";
      const enhanced = enhancePrompt(prompt);

      // Should still contain the core concept
      expect(enhanced.toLowerCase()).toMatch(/sunset|mountain/);
    });

    it("should generate different enhancements for generate vs edit context", () => {
      const prompt = "add flowers";
      const editEnhanced = enhancePrompt(prompt, "edit");

      // Edit context should have preservation language
      expect(editEnhanced.toLowerCase()).toMatch(/preserve|original|unchanged/);

      // Generate context should not have edit-specific language
      const generateEnhanced = enhancePrompt(prompt, "generate");
      expect(generateEnhanced).toBeDefined();
    });
  });
});
