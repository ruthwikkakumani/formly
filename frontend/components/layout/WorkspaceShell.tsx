"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getToken } from "@/lib/auth";
import { MESSAGES } from "@/lib/errors";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { current, error, ready, sessionInvalid, retry, logout } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const item = (href: string, label: string) => (
    <Link href={href} className={path === href || (href !== "/" && path.startsWith(href)) ? "navon" : ""}>
      {label}
    </Link>
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => {
      setIsNarrow(mq.matches);
      if (!mq.matches) setMenuOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      menuBtnRef.current?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!ready || current) return;
    if (sessionInvalid || !getToken()) router.replace("/login");
  }, [ready, current, sessionInvalid, router]);

  if (!ready) {
    return <div className="loader">Loading workspace…</div>;
  }

  if (!current) {
    if (sessionInvalid || !getToken()) {
      return (
        <div className="loader" role={error ? "alert" : undefined}>
          {error || "Loading workspace…"}
        </div>
      );
    }
    return (
      <div className="loader loader-retry" role="alert">
        <p>{error || MESSAGES.workspaceUnreachable}</p>
        <button className="primary" type="button" onClick={() => void retry()}>
          Try again
        </button>
      </div>
    );
  }

  const drawerHidden = isNarrow && !menuOpen;

  return (
    <div className={`workspace${menuOpen ? " navopen" : ""}`}>
      <header className="topbar">
        <Link href="/" className="brand">
          formly<span>•</span>
        </Link>
        <button
          ref={menuBtnRef}
          className="navtoggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="workspace-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navtoggle-bars" aria-hidden="true" />
        </button>
      </header>
      <div className="navscrim" aria-hidden="true" onClick={() => setMenuOpen(false)} />
      <aside
        id="workspace-nav"
        className="sidenav"
        aria-label="Workspace"
        aria-hidden={drawerHidden}
        inert={drawerHidden || undefined}
      >
        <div className="sidenav-head">
          <Link href="/" className="brand">
            formly<span>•</span>
          </Link>
          <button
            ref={closeBtnRef}
            className="navclose"
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav>
          {item("/", "Home")}
          {item("/team", "Workspace")}
          {item("/settings", "Settings")}
        </nav>
        <div className="sidecard">
          <div className="sidecard-user">
            <span className="sidecard-avatar" aria-hidden="true">
              {initials(current.name)}
            </span>
            <div className="sidecard-meta">
              <p className="sidecard-name">{current.name}</p>
              <p className="sidecard-email" title={current.email}>
                {current.email}
              </p>
              {current.role ? <span className="sidecard-role">{current.role}</span> : null}
            </div>
          </div>
          <div className="sidecard-actions">
            <Link href="/settings" className="sidecard-link">
              Account
            </Link>
            <button className="sidecard-logout" type="button" onClick={logout}>
              Log out
            </button>
          </div>
          {error ? (
            <div className="sidecard-alert" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => void retry()}>
                Try again
              </button>
            </div>
          ) : null}
        </div>
      </aside>
      <div className="workmain" inert={menuOpen || undefined}>
        {children}
      </div>
    </div>
  );
}
