/**
 * Focus trap hook for modals and dialogs
 * Keeps focus within the modal when tab navigating
 */

import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => el.offsetParent !== null); // Filter out hidden elements
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // Save the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab from first element -> go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab from last element -> go to first
      if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Defer to allow modal to render
      window.requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the previously focused element
      if (previousActiveElement.current?.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, getFocusableElements]);

  return containerRef;
}
