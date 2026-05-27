"use client";

import PressableButton from "./PressableButton";

interface ContextMenuProps {
    ref?: React.Ref<HTMLDivElement>;
    contextMenuPosition: { x: number; y: number };
    onDelete: () => void;

}

export default function ContextMenu({ 
  ref, 
  contextMenuPosition, 
  onDelete 
}: ContextMenuProps) {
  return (
    <div
      ref={ref}
      className="fixed bg-white px-3 py-4 shadow-md"
      style={{
        left: `${contextMenuPosition.x-90}px`,
        top: `${contextMenuPosition.y-70}px`,
      }}
    >
      <PressableButton variant="menu" onClick={onDelete}>
        Delete
      </PressableButton>
    </div>
  );
}

