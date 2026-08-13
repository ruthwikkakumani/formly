"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { inviteApi } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void inviteApi
      .preview(token)
      .then((invite) => {
        setName(invite.name);
        setEmail(invite.email);
        setRole(invite.role);
      })
      .catch((err: Error) => setError(err.message || "Invite not found"));
  }, [token]);

  async function accept(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const session = await inviteApi.accept(token, password);
      setToken(session.token);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't accept this invite. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="invite-page">
      <a className="brand" href="/login">
        formly<span>•</span>
      </a>
      {error && !email ? (
        <>
          <h1>Invite unavailable</h1>
          <p>{error}</p>
        </>
      ) : (
        <>
          <p className="eyebrow">WORKSPACE INVITE</p>
          <h1>Join as {role || "…"}</h1>
          <p>
            {name ? `${name} (${email})` : "Loading…"} — set a password to create your account. You are not a member
            until you accept.
          </p>
          <form className="authform" onSubmit={(event) => void accept(event)}>
            <input required minLength={8} type="password" placeholder="Choose a password" value={password} onChange={(event) => setPassword(event.target.value)} />
            {error ? <p className="autherr">{error}</p> : null}
            <button className="primary" disabled={!email || busy} type="submit">
              {busy ? "Joining…" : "Accept invite"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
