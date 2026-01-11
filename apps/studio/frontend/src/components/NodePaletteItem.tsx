import type { ReactNode } from "react";
import type { NodeDefinition } from "@teamflojo/floimg-studio-shared";

export type NodePaletteColorVariant =
  | "amber"
  | "blue"
  | "teal"
  | "pink"
  | "cyan"
  | "orange"
  | "emerald";

export interface NodePaletteItemProps {
  /** The node definition to render */
  definition: NodeDefinition;
  /** Color variant for the palette item */
  colorVariant: NodePaletteColorVariant;
  /** Handler for drag start - receives the definition to serialize */
  onDragStart: (e: React.DragEvent, definition: NodeDefinition) => void;
  /** Handler for double-click - adds node to canvas */
  onDoubleClick: (definition: NodeDefinition) => void;
  /** Whether this node is disabled (prevents drag/add) */
  disabled?: boolean;
  /** Handler for when a disabled node is clicked */
  onDisabledClick?: (definition: NodeDefinition) => void;
  /** Custom badge to render (e.g., icon, tag) */
  badge?: ReactNode;
  /** Message to display instead of description when disabled */
  alternateMessage?: string;
}

/**
 * A single item in the node palette. Renders with themed CSS classes
 * for consistent styling.
 *
 * Extension features (disabled state, badges) are opt-in via props.
 */
export function NodePaletteItem({
  definition,
  colorVariant,
  onDragStart,
  onDoubleClick,
  disabled = false,
  onDisabledClick,
  badge,
  alternateMessage,
}: NodePaletteItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onDragStart(e, definition);
  };

  const handleDoubleClick = () => {
    if (disabled && onDisabledClick) {
      onDisabledClick(definition);
      return;
    }
    if (!disabled) {
      onDoubleClick(definition);
    }
  };

  const handleClick = () => {
    if (disabled && onDisabledClick) {
      onDisabledClick(definition);
    }
  };

  // Base class + color variant + disabled state
  const className = [
    "floimg-palette-item",
    `floimg-palette-item--${colorVariant}`,
    disabled && "floimg-palette-item--disabled",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDoubleClick={handleDoubleClick}
      onClick={disabled ? handleClick : undefined}
      className={className}
    >
      <div className="floimg-palette-item__header">
        <div className="floimg-palette-item__title">{definition.label}</div>
        {badge}
      </div>
      {definition.description && !disabled && (
        <div className="floimg-palette-item__desc">{definition.description}</div>
      )}
      {disabled && alternateMessage && (
        <div className="floimg-palette-item__alternate-message">{alternateMessage}</div>
      )}
    </div>
  );
}
