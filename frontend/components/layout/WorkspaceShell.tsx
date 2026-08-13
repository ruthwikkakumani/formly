"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const item = (href: string, label: string) => (
    <Link href={href} className={path === href || (href !== "/" && path.startsWith(href)) ? "navon" : ""}>
      {label}
    </Link>
  );

  return (
    <div className="workspace">
      <aside className="sidenav">
        <Link href="/" className="brand">
          formly<span>•</span>
        </Link>
        <nav>
          {item("/", "Home")}
          {item("/team", "Workspace")}
        </nav>
        <div className="sidecard">
          <b>My workspace</b>
          <p>Default creator · RK</p>
        </div>
      </aside>
      <div className="workmain">{children}</div>
    </div>
  );
}
