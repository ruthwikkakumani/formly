"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { AccountSettings } from "@/components/settings/AccountSettings";
import { SmoothHeight } from "@/components/shared/SmoothHeight";
import { TeamView } from "@/components/team/TeamView";

const SECTIONS = ["account", "password", "team"] as const;
type SettingsSection = (typeof SECTIONS)[number];

function sectionFromHash(): SettingsSection {
  if (typeof window === "undefined") return "account";
  const value = window.location.hash.replace("#", "").toLowerCase();
  return SECTIONS.includes(value as SettingsSection) ? (value as SettingsSection) : "account";
}

const COPY: Record<SettingsSection, { eyebrow: string; lede: string }> = {
  account: {
    eyebrow: "ACCOUNT",
    lede: "Your name as teammates see it. Email stays the same.",
  },
  password: {
    eyebrow: "ACCOUNT",
    lede: "Use at least 8 characters. You’ll stay signed in on this device.",
  },
  team: {
    eyebrow: "WORKSPACE",
    lede: "Who has access. The owner can invite, remove, or change a viewer to an editor.",
  },
};

const LABELS: Record<SettingsSection, string> = {
  account: "Account",
  password: "Password",
  team: "Team",
};

export function SettingsWorkspace() {
  const [section, setSection] = useState<SettingsSection>("account");
  const navRef = useRef<HTMLElement>(null);
  const [thumb, setThumb] = useState({ xs: [0, 0, 0], ws: [0, 0, 0], ready: false });

  useEffect(() => {
    setSection(sectionFromHash());
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const buttons = Array.from(nav.querySelectorAll("button"));
      if (buttons.length !== SECTIONS.length) return;
      const xs = buttons.map((button) => button.offsetLeft);
      const ws = buttons.map((button) => button.offsetWidth);
      setThumb((prev) => {
        if (
          prev.ready &&
          prev.xs.every((value, i) => value === xs[i]) &&
          prev.ws.every((value, i) => value === ws[i])
        ) {
          return prev;
        }
        return { xs, ws, ready: true };
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    nav.querySelectorAll("button").forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, []);

  function show(next: SettingsSection) {
    if (next === section) return;
    setSection(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  const copy = COPY[section];
  const index = SECTIONS.indexOf(section);

  return (
    <div className={`settings-page${section === "team" ? " settings-page-wide" : ""}`}>
      <header className="settings-head">
        <div className="settings-head-bar">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>Settings</h1>
          </div>
          <nav
            ref={navRef}
            className={`settings-nav${thumb.ready ? " has-thumb" : ""}`}
            aria-label="Settings sections"
          >
            {thumb.ready ? (
              <span
                className="settings-nav-thumb"
                aria-hidden="true"
                style={{ width: thumb.ws[index], transform: `translateX(${thumb.xs[index]}px)` }}
              />
            ) : null}
            {SECTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={section === item ? "tabon" : ""}
                aria-current={section === item ? "page" : undefined}
                onClick={() => show(item)}
              >
                {LABELS[item]}
              </button>
            ))}
          </nav>
        </div>
        <p className="lede">{copy.lede}</p>
      </header>
      <SmoothHeight>
        <div className="settings-switch">
          {section === "account" ? <AccountSettings panel="profile" /> : null}
          {section === "password" ? <AccountSettings panel="password" /> : null}
          {section === "team" ? <TeamView embedded /> : null}
        </div>
      </SmoothHeight>
    </div>
  );
}
