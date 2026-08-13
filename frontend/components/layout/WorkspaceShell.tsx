"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { useCurrentUser } from "@/hooks/useCurrentUser";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { current, error, ready, logout } = useCurrentUser();
  const item = (href: string, label: string) => (
    <Link href={href} className={path === href || (href !== "/" && path.startsWith(href)) ? "navon" : ""}>
      {label}
    </Link>
  );

  useEffect(() => {
    if (ready && !current) router.replace("/login");
  }, [ready, current, router]);

  if (!ready) {
    return <div className="loader">Loading workspace…</div>;
  }

  if (!current) {
    return (
      <div className="loader" role={error ? "alert" : undefined}>
        {error || "Loading workspace…"}
      </div>
    );
  }

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
          <b>Signed in</b>
          <p className="who">
            {current.name}
            <span>{current.email}</span>
          </p>
          <button className="ghost" type="button" onClick={logout}>
            Log out
          </button>
          {error ? <p>{error}</p> : null}
        </div>
      </aside>
      <div className="workmain">{children}</div>
    </div>
  );
}
