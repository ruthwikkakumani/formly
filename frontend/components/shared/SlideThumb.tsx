"use client";

import { RefObject, useLayoutEffect, useState } from "react";

export function SlideThumb({
  navRef,
  index,
  axis = "x",
  className,
}: {
  navRef: RefObject<HTMLElement | null>;
  index: number;
  axis?: "x" | "y";
  className?: string;
}) {
  const [thumb, setThumb] = useState({ pos: 0, size: 0, ready: false });

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const items = Array.from(nav.querySelectorAll<HTMLElement>("[data-thumb]"));
      const active = items[index];
      if (!active) return;
      const pos = axis === "y" ? active.offsetTop : active.offsetLeft;
      const size = axis === "y" ? active.offsetHeight : active.offsetWidth;
      setThumb((prev) => {
        if (prev.ready && prev.pos === pos && prev.size === size) return prev;
        return { pos, size, ready: true };
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    nav.querySelectorAll<HTMLElement>("[data-thumb]").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [navRef, index, axis]);

  if (!thumb.ready) return null;

  return (
    <span
      className={className}
      aria-hidden="true"
      style={
        axis === "y"
          ? { height: thumb.size, transform: `translateY(${thumb.pos}px)` }
          : { width: thumb.size, transform: `translateX(${thumb.pos}px)` }
      }
    />
  );
}
