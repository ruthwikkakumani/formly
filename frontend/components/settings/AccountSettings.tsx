"use client";

import { FormEvent, useEffect, useState } from "react";

import { Toast } from "@/components/shared/Toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { authApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountSettings({ panel = "all" }: { panel?: "all" | "profile" | "password" }) {
  const { current, ready } = useCurrentUser();
  const showProfile = panel === "all" || panel === "profile";
  const showPassword = panel === "all" || panel === "password";
  const compact = panel !== "all";
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (current?.name) setName(current.name);
  }, [current?.name]);

  async function saveName(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setProfileError(MESSAGES.missingName);
      return;
    }
    setProfileError("");
    setSavingName(true);
    try {
      const updated = await authApi.updateProfile({ name: trimmed });
      setName(updated.name);
      showToast("Account details saved");
    } catch (error) {
      showToast(messageFromUnknown(error, MESSAGES.profileSaveFailed), "error");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError(MESSAGES.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(MESSAGES.passwordMismatch);
      return;
    }
    setPasswordError("");
    setSavingPassword(true);
    try {
      const result = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(result.message || "Your password has been updated.");
    } catch (error) {
      showToast(messageFromUnknown(error, MESSAGES.passwordChangeFailed), "error");
    } finally {
      setSavingPassword(false);
    }
  }

  if (!ready || !current) {
    return <div className="loader">Loading account…</div>;
  }

  return (
    <section className={compact ? "account-panel" : "team account-settings"}>
      {compact ? null : (
        <>
          <p className="eyebrow">ACCOUNT</p>
          <h1>Settings</h1>
          <p className="lede">Update your name and password. Your email stays the same.</p>
        </>
      )}
      {showProfile ? (
        <article className="settings-card">
          <header className="settings-card-head">
            <span className="settings-avatar" aria-hidden="true">
              {initials(current.name)}
            </span>
            <div>
              <h3>Profile</h3>
              <p className="hint">Shown to teammates while editing forms.</p>
            </div>
          </header>
          <form className="settings-fields" onSubmit={(event) => void saveName(event)}>
            <div className="settings-field">
              <label htmlFor="settings-name">Name</label>
              <div className="settings-field-control">
                <input
                  id="settings-name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (profileError) setProfileError("");
                  }}
                />
              </div>
            </div>
            <div className="settings-field">
              <label htmlFor="settings-email">Email</label>
              <div className="settings-field-control">
                <input id="settings-email" type="email" value={current.email} readOnly aria-readonly="true" />
                <p className="hint">Read only · used to sign in</p>
              </div>
            </div>
            {profileError ? (
              <p className="autherr settings-field-error" role="alert">
                {profileError}
              </p>
            ) : null}
            <div className="settings-card-actions">
              <button className="primary" type="submit" disabled={savingName}>
                {savingName ? "Saving…" : "Save details"}
              </button>
            </div>
          </form>
        </article>
      ) : null}
      {showPassword ? (
        <article className="settings-card">
          <header className="settings-card-head">
            <div>
              <h3>Password</h3>
              <p className="hint">Choose something you don’t use elsewhere. At least 8 characters.</p>
            </div>
          </header>
          <form className="settings-fields" onSubmit={(event) => void savePassword(event)}>
            <div className="settings-field">
              <label htmlFor="settings-current-password">Current password</label>
              <div className="settings-field-control">
                <input
                  id="settings-current-password"
                  required
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                />
              </div>
            </div>
            <div className="settings-field">
              <label htmlFor="settings-new-password">New password</label>
              <div className="settings-field-control">
                <input
                  id="settings-new-password"
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                />
              </div>
            </div>
            <div className="settings-field">
              <label htmlFor="settings-confirm-password">Confirm new password</label>
              <div className="settings-field-control">
                <input
                  id="settings-confirm-password"
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                />
              </div>
            </div>
            {passwordError ? (
              <p className="autherr settings-field-error" role="alert">
                {passwordError}
              </p>
            ) : null}
            <div className="settings-card-actions">
              <button className="primary" type="submit" disabled={savingPassword}>
                {savingPassword ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </article>
      ) : null}
      <Toast {...toast} />
    </section>
  );
}
