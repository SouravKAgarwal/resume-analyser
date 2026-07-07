"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps a visual in a `relative` frame and lays a transparent `absolute inset-0`
 * guard over it. The guard blocks the context menu and drag-to-save gestures and
 * disables selection, deterring casual download of the artwork. It is
 * pointer-events-auto by design (it must catch the gestures), so only use this
 * around non-interactive media — never over links or buttons.
 */
export function ProtectedMedia({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative select-none", className)}>
      {children}
      <div
        aria-hidden
        className="absolute inset-0 z-10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
