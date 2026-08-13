"use client";

import { FormEvent, useEffect, useState } from "react";

import { Toast } from "@/components/shared/Toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { authApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";

export function AccountSettings() {
  const { current, ready } = useCurrentUser();
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
    <section className="team account-settings">
      <p className="eyebrow">ACCOUNT</p>
      <h1>Settings</h1>
      <p className="lede">Update your name and password. Your email stays the same.</p>
      <div className="settingsgrid">
        <article>
          <h3>Profile</h3>
          <p className="hint">Shown to teammates while editing forms.</p>
          <form className="accountform" onSubmit={(event) => void saveName(event)}>
            <label>
              Name
              <input
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (profileError) setProfileError("");
                }}
              />
            </label>
            <label>
              Email
              <input type="email" value={current.email} readOnly aria-readonly="true" />
            </label>
            {profileError ? (
              <p className="autherr" role="alert">
                {profileError}
              </p>
            ) : null}
            <button className="primary" type="submit" disabled={savingName}>
              {savingName ? "Saving…" : "Save details"}
            </button>
          </form>
        </article>
        <article>
          <h3>Password</h3>
          <p className="hint">Use at least 8 characters.</p>
          <form className="accountform" onSubmit={(event) => void savePassword(event)}>
            <label>
              Current password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  if (passwordError) setPasswordError("");
                }}
              />
            </label>
            <label>
              New password
              <input
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
            </label>
            <label>
              Confirm new password
              <input
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
            </label>
            {passwordError ? (
              <p className="autherr" role="alert">
                {passwordError}
              </p>
            ) : null}
            <button className="primary" type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </article>
      </div>
      <Toast {...toast} />
    </section>
  );
}
