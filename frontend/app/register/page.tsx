"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { BusyLabel } from "@/components/shared/BusyLabel";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { isValidEmail } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(MESSAGES.missingName);
      return;
    }
    if (!isValidEmail(email)) {
      setError(MESSAGES.invalidEmail);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const session = await authApi.register({ name: name.trim(), email, password });
      setToken(session.token);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(messageFromUnknown(err, MESSAGES.registerFailed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="invite-page">
      <Link className="brand" href="/login">
        formly<span>•</span>
      </Link>
      <p className="eyebrow">GET STARTED</p>
      <h1>Create your workspace</h1>
      <p>The first account becomes owner. Later teammates join only from an invite email.</p>
      <form className="authform" onSubmit={(event) => void submit(event)}>
        <input required placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
        <input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? (
          <p className="autherr" role="alert">
            {error}
          </p>
        ) : null}
        <button className={`primary${busy ? " is-busy" : ""}`} type="submit" disabled={busy}>
          <BusyLabel busy={busy} idle="Create account" pending="Creating" />
        </button>
      </form>
      <p>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
