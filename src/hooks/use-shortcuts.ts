import { useEffect, useRef } from "react";

export function useShortcuts(
  combinations: string[],
  callbacks: (() => void)[]
) {
  // Store the latest callbacks in a ref so we don't need them in dependencies
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check each combination
      for (let i = 0; i < combinations.length; i++) {
        const combination = combinations[i];
        const callback = callbacksRef.current[i];

        const keys = combination.toLowerCase().split("+");
        const actualKey = keys[keys.length - 1];

        // Check if all required modifier keys are pressed
        const requiresCmd = keys.includes("cmd") || keys.includes("meta");
        const requiresShift = keys.includes("shift");

        // Check if the actual key matches (handle special cases)
        let keyMatches = false;
        if (actualKey === "k" && event.key.toLowerCase() === "k") {
          keyMatches = true;
        } else if (actualKey === "o" && event.key.toLowerCase() === "o") {
          keyMatches = true;
        } else if (event.key.toLowerCase() === actualKey) {
          keyMatches = true;
        }

        // Check if all conditions are met
        const cmdMatch = !requiresCmd || event.metaKey || event.ctrlKey; // Handle both Mac (metaKey) and PC (ctrlKey)
        const shiftMatch = !requiresShift || event.shiftKey;

        if (keyMatches && cmdMatch && shiftMatch) {
          event.preventDefault();
          callback();
          break; // Exit loop after first match
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [combinations]); // Only depend on combinations, not callbacks
}
