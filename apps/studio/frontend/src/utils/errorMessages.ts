/**
 * Error message dictionary for validation errors
 *
 * Maps SDK validation codes to user-friendly messages with titles,
 * descriptions, and suggested fixes.
 */

export interface ErrorMessage {
  /** Short title for the error */
  title: string;
  /** User-friendly description of what went wrong */
  description: string;
  /** Actionable fix suggestion */
  suggestedFix: string;
}

/**
 * User-friendly error messages keyed by validation code
 */
export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Prompt/input errors
  MISSING_PROMPT_SOURCE: {
    title: "Missing Prompt",
    description: "This AI generator needs a prompt to create an image.",
    suggestedFix: "Add a prompt in the node settings, or connect a Text node to provide one.",
  },
  MISSING_REQUIRED_PARAM: {
    title: "Missing Required Field",
    description: "A required parameter is not set.",
    suggestedFix: "Fill in the required field in the node settings panel.",
  },
  INVALID_PARAM_TYPE: {
    title: "Invalid Value Type",
    description: "The value provided is not the expected type.",
    suggestedFix: "Check that the value matches the expected format (text, number, etc.).",
  },
  INVALID_PARAM_VALUE: {
    title: "Invalid Value",
    description: "The value is outside the allowed range or options.",
    suggestedFix: "Check the allowed values and adjust accordingly.",
  },

  // Connection/reference errors
  UNDEFINED_VARIABLE: {
    title: "Missing Connection",
    description: "This node expects input from another node that doesn't exist.",
    suggestedFix: "Connect an upstream node to provide the required input.",
  },
  MISSING_IMAGE_INPUT: {
    title: "No Image Input",
    description: "This transform needs an image to work on.",
    suggestedFix: "Connect a generator or another image source to this node.",
  },

  // Fan-out/flow errors
  MISSING_ARRAY_PROPERTY: {
    title: "Missing Array Property",
    description: "Fan-out in array mode needs to know which property contains the array.",
    suggestedFix:
      'Set the "Array Property" to the name of the array in the upstream text node\'s output (e.g., "prompts").',
  },

  // Provider errors
  UNKNOWN_GENERATOR: {
    title: "Unknown Generator",
    description: "The specified generator is not available.",
    suggestedFix: "Choose a generator from the available options in the node palette.",
  },
  UNKNOWN_TRANSFORM: {
    title: "Unknown Transform",
    description: "The specified transform operation is not available.",
    suggestedFix: "Choose a transform from the available options in the node palette.",
  },
  UNKNOWN_PROVIDER: {
    title: "Unknown Provider",
    description: "The specified provider is not configured.",
    suggestedFix: "Check that the required API keys are set up.",
  },

  // Structural errors
  CIRCULAR_DEPENDENCY: {
    title: "Circular Connection",
    description: "The workflow has a loop that would run forever.",
    suggestedFix: "Remove the connection that creates the cycle.",
  },
  EMPTY_PIPELINE: {
    title: "Empty Workflow",
    description: "The workflow has no steps to execute.",
    suggestedFix: "Add at least one generator or input node.",
  },

  // Format compatibility errors
  INCOMPATIBLE_INPUT_FORMAT: {
    title: "Incompatible Image Format",
    description: "This operation requires a specific image format that doesn't match the input.",
    suggestedFix: "Add a Convert node before this operation to change the format.",
  },
};

/**
 * Get user-friendly error message for a validation code
 *
 * Falls back to a generic message if the code is not in the dictionary.
 */
export function getErrorMessage(code: string): ErrorMessage {
  return (
    ERROR_MESSAGES[code] || {
      title: "Validation Error",
      description: "There's an issue with this node's configuration.",
      suggestedFix: "Review the node settings and connections.",
    }
  );
}

/**
 * Get severity-appropriate color class
 */
export function getErrorColorClass(severity: "error" | "warning"): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  if (severity === "error") {
    return {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-300",
      icon: "text-red-500",
    };
  }
  return {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    icon: "text-amber-500",
  };
}
