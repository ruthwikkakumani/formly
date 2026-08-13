"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function RouteFade({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="routefade" key={path}>
      {children}
    </div>
  );
}
