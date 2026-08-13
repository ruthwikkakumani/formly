"use client";

import { ReactNode, useLayoutEffect, useRef, useState } from "react";

export function SmoothHeight({ children, className }: { children: ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useLayoutEffect(() => {
    const node = inner.current;
    if (!node) return;
    const update = () => setHeight(node.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      className={`smooth-height${className ? ` ${className}` : ""}`}
      style={{ height: height === "auto" ? undefined : height }}
    >
      <div ref={inner}>{children}</div>
    </div>
  );
}
