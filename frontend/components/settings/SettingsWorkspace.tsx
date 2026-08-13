"use client";

import { useEffect, useState } from "react";

import { AccountSettings } from "@/components/settings/AccountSettings";
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

export function SettingsWorkspace() {
  const [section, setSection] = useState<SettingsSection>("account");

  useEffect(() => {
    setSection(sectionFromHash());
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function show(next: SettingsSection) {
    setSection(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  const copy = COPY[section];

  return (
    <div className={`settings-page${section === "team" ? " settings-page-wide" : ""}`}>
      <header className="settings-head">
        <div className="settings-head-bar">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>Settings</h1>
          </div>
          <nav className="settings-nav" aria-label="Settings sections">
            {SECTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={section === item ? "tabon" : ""}
                aria-current={section === item ? "page" : undefined}
                onClick={() => show(item)}
              >
                {item === "account" ? "Account" : item === "password" ? "Password" : "Team"}
              </button>
            ))}
          </nav>
        </div>
        <p className="lede">{copy.lede}</p>
      </header>
      {section === "account" ? <AccountSettings panel="profile" /> : null}
      {section === "password" ? <AccountSettings panel="password" /> : null}
      {section === "team" ? <TeamView embedded /> : null}
    </div>
  );
}
