"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { AccountSettings } from "@/components/settings/AccountSettings";
import { SmoothHeight } from "@/components/shared/SmoothHeight";
import { TeamView } from "@/components/team/TeamView";
import { paneDuration, paneEase, pillSpring } from "@/lib/motion";

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
  const [from, setFrom] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setSection(sectionFromHash());
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function show(next: SettingsSection) {
    if (next === section) return;
    setFrom(SECTIONS.indexOf(section));
    setSection(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  const copy = COPY[section];
  const index = SECTIONS.indexOf(section);
  const dir = index >= from ? 1 : -1;

  return (
    <div className={`settings-page${section === "team" ? " settings-page-wide" : ""}`}>
      <header className="settings-head">
        <div className="settings-head-bar">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>Settings</h1>
          </div>
          <nav className="settings-nav has-thumb" aria-label="Settings sections">
            <LayoutGroup id="settings-pill">
              {SECTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={section === item ? "tabon" : ""}
                  aria-current={section === item ? "page" : undefined}
                  onClick={() => show(item)}
                >
                  {section === item ? (
                    <motion.span
                      layoutId="settings-active"
                      className="settings-nav-thumb"
                      transition={reduceMotion ? { duration: 0 } : pillSpring}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="settings-nav-label">{LABELS[item]}</span>
                </button>
              ))}
            </LayoutGroup>
          </nav>
        </div>
        <p className="lede">{copy.lede}</p>
      </header>
      <SmoothHeight>
        <div className="settings-switch">
          {SECTIONS.map((item, paneIndex) => {
            const on = paneIndex === index;
            return (
              <motion.div
                key={item}
                className={`settings-pane${on ? " is-on" : " is-off"}`}
                aria-hidden={!on}
                initial={false}
                animate={
                  reduceMotion
                    ? { opacity: on ? 1 : 0, x: 0 }
                    : {
                        opacity: on ? 1 : 0,
                        x: on ? 0 : dir * (paneIndex < index ? -28 : 28),
                      }
                }
                transition={{ duration: paneDuration, ease: paneEase }}
              >
                {item === "account" ? <AccountSettings panel="profile" /> : null}
                {item === "password" ? <AccountSettings panel="password" /> : null}
                {item === "team" ? <TeamView embedded /> : null}
              </motion.div>
            );
          })}
        </div>
      </SmoothHeight>
    </div>
  );
}
