"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { useCurrentUser } from "@/hooks/useCurrentUser";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { members, current, switchUser } = useCurrentUser();
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
          <b>Signed in as</b>
          <select
            value={current?.email || ""}
            onChange={(event) => switchUser(event.target.value)}
            aria-label="Current teammate"
          >
            {members.map((member) => (
              <option value={member.email} key={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
          <p>Switch user to simulate two people editing.</p>
        </div>
      </aside>
      <div className="workmain">{children}</div>
    </div>
  );
}
