"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { BusyLabel } from "@/components/shared/BusyLabel";
import { authApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { isValidEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError(MESSAGES.invalidEmail);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    setResetUrl("");
    try {
      const result = await authApi.forgotPassword(email.trim());
      setMessage(result.message || "If that email is in this workspace, we've sent a reset link. Check your inbox.");
      setResetUrl(result.reset_url || "");
    } catch (err) {
      setError(messageFromUnknown(err, MESSAGES.forgotFailed));
    } finally {
      setBusy(false);
    }
  }

  async function copyResetLink() {
    if (!resetUrl) return;
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(MESSAGES.copyFailed);
    }
  }

  return (
    <main className="invite-page">
      <Link className="brand" href="/login">
        formly<span>•</span>
      </Link>
      <p className="eyebrow">ACCOUNT</p>
      <h1>Forgot password</h1>
      <p>Enter the email for your workspace account. We’ll send a reset link if it matches.</p>
      <form className="authform" noValidate onSubmit={(event) => void submit(event)}>
        <input
          required
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError("");
          }}
        />
        {error ? (
          <p className="autherr" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="authsuccess" role="status">
            {message}
          </p>
        ) : null}
        <button className={`primary${busy ? " is-busy" : ""}`} type="submit" disabled={busy}>
          <BusyLabel busy={busy} idle="Send reset link" pending="Sending" />
        </button>
      </form>
      {resetUrl ? (
        <div className="invite-share" role="status">
          <p>If the email doesn’t arrive, copy this reset link.</p>
          <div className="invite-share-row">
            <input readOnly value={resetUrl} aria-label="Password reset link" onFocus={(event) => event.target.select()} />
            <button type="button" className="primary" onClick={() => void copyResetLink()}>
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      ) : null}
      <p>
        <Link href="/login">Back to sign in</Link>
      </p>
    </main>
  );
}
