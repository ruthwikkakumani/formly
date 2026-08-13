"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { BusyLabel } from "@/components/shared/BusyLabel";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { isValidEmail } from "@/lib/validation";

const REVIEWER_EMAIL = process.env.NEXT_PUBLIC_REVIEWER_EMAIL || "reviewer@formly.dev";
const REVIEWER_PASSWORD = process.env.NEXT_PUBLIC_REVIEWER_PASSWORD || "FormlyReview1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function fillReviewer() {
    setEmail(REVIEWER_EMAIL);
    setPassword(REVIEWER_PASSWORD);
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError(MESSAGES.invalidEmail);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const session = await authApi.login({ email, password });
      setToken(session.token);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(messageFromUnknown(err, MESSAGES.signInFailed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="invite-page">
      <Link className="brand" href="/login">
        formly<span>•</span>
      </Link>
      <p className="eyebrow">WORKSPACE</p>
      <h1>Sign in</h1>
      <p>Use your real account. Live editing shows whoever is actually signed in.</p>
      <form className="authform" onSubmit={(event) => void submit(event)}>
        <input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? (
          <p className="autherr" role="alert">
            {error}
          </p>
        ) : null}
        <button className={`primary${busy ? " is-busy" : ""}`} type="submit" disabled={busy}>
          <BusyLabel busy={busy} idle="Sign in" pending="Signing in" />
        </button>
      </form>
      <aside className="reviewer-note">
        <h2>Assignment reviewer</h2>
        <dl>
          <div>
            <dt>Email</dt>
            <dd>{REVIEWER_EMAIL}</dd>
          </div>
          <div>
            <dt>Password</dt>
            <dd>{REVIEWER_PASSWORD}</dd>
          </div>
        </dl>
        <button type="button" className="reviewer-fill" onClick={fillReviewer}>
          Use these credentials
        </button>
      </aside>
      <p>
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
      <p>
        First person here? <Link href="/register">Create the workspace</Link>
      </p>
    </main>
  );
}
