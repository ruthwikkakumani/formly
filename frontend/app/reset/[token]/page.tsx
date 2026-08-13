"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void authApi
      .previewReset(token)
      .then((payload) => {
        setEmail(payload.email);
        setError("");
      })
      .catch((err: unknown) => setError(messageFromUnknown(err, MESSAGES.resetUnavailable)))
      .finally(() => setReady(true));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError(MESSAGES.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(MESSAGES.passwordMismatch);
      return;
    }
    setBusy(true);
    try {
      const session = await authApi.resetPassword(token, password);
      setToken(session.token);
      window.location.href = "/";
    } catch (err) {
      setError(messageFromUnknown(err, MESSAGES.resetFailed));
    } finally {
      setBusy(false);
    }
  }

  const unavailable = ready && !email;

  return (
    <main className="invite-page">
      <Link className="brand" href="/login">
        formly<span>•</span>
      </Link>
      {unavailable ? (
        <>
          <h1>Reset link unavailable</h1>
          <p className="autherr" role="alert">
            {error || MESSAGES.resetUnavailable}
          </p>
          <p>
            <Link href="/forgot-password">Request a new reset link</Link>
          </p>
        </>
      ) : (
        <>
          <p className="eyebrow">ACCOUNT</p>
          <h1>Choose a new password</h1>
          <p>{email ? `Reset the password for ${email}.` : "Loading…"}</p>
          <form className="authform" onSubmit={(event) => void submit(event)}>
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              placeholder="New password (8+ characters)"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
            />
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                if (error) setError("");
              }}
            />
            {error ? (
              <p className="autherr" role="alert">
                {error}
              </p>
            ) : null}
            <button className="primary" type="submit" disabled={!email || busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
          <p>
            <Link href="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </main>
  );
}
