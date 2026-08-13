"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await authApi.register({ name, email, password });
      setToken(session.token);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
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
        {error ? <p className="autherr">{error}</p> : null}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
