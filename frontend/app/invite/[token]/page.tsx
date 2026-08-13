"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { BusyLabel } from "@/components/shared/BusyLabel";
import { inviteApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";

export default function AcceptInvitePage() {
  const router = useRouter();
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
      .catch((err: unknown) => setError(messageFromUnknown(err, MESSAGES.inviteUnavailable)));
  }, [token]);

  async function accept(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const session = await inviteApi.accept(token, password);
      setToken(session.token);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(messageFromUnknown(err, MESSAGES.inviteAcceptFailed));
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
          <p className="autherr" role="alert">
            {error}
          </p>
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
            {error ? (
              <p className="autherr" role="alert">
                {error}
              </p>
            ) : null}
            <button className={`primary${busy ? " is-busy" : ""}`} disabled={!email || busy} type="submit">
              <BusyLabel busy={busy} idle="Accept invite" pending="Joining" />
            </button>
          </form>
        </>
      )}
    </main>
  );
}
