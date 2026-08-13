"use client";

import { FormEvent, useEffect, useState } from "react";

import { Toast } from "@/components/shared/Toast";
import { useToast } from "@/hooks/useToast";
import { teamApi } from "@/lib/api";
import { MemberRole, WorkspaceInvite, WorkspaceMember } from "@/lib/types";

export function TeamView() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [sending, setSending] = useState(false);
  const { toast, showToast } = useToast();

  async function load() {
    const [nextMembers, nextInvites] = await Promise.all([teamApi.list(), teamApi.invites()]);
    setMembers(nextMembers);
    setInvites(nextInvites);
  }

  useEffect(() => {
    void load();
  }, []);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      await teamApi.invite({ name, email, role });
      setName("");
      setEmail("");
      showToast("Invite email sent. They join only after accepting the link.");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Invite failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="team">
      <p className="eyebrow">WORKSPACE</p>
      <h1>Collaboration & sharing</h1>
      <p className="lede">
        Send an email invite. They are not added until they open the link and accept. Ignore or revoke means they stay
        out of the workspace.
      </p>
      <form className="invite" onSubmit={(event) => void invite(event)}>
        <input required placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <select value={role} onChange={(event) => setRole(event.target.value as MemberRole)}>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button className="primary" type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send invite"}
        </button>
      </form>
      {invites.length ? (
        <div className="memberlist">
          <p className="eyebrow">PENDING INVITES</p>
          {invites.map((inviteRow) => (
            <article key={inviteRow.id}>
              <div>
                <b>{inviteRow.name}</b>
                <p>
                  {inviteRow.email} · waiting to accept
                </p>
              </div>
              <span className="status">pending</span>
              <button
                className="danger"
                onClick={async () => {
                  await teamApi.revokeInvite(inviteRow.id);
                  showToast("Invite revoked");
                  await load();
                }}
              >
                Revoke
              </button>
            </article>
          ))}
        </div>
      ) : null}
      <div className="memberlist">
        <p className="eyebrow">MEMBERS</p>
        {members.map((member) => (
          <article key={member.id}>
            <div>
              <b>{member.name}</b>
              <p>{member.email}</p>
            </div>
            <span className="status">{member.role}</span>
            {member.role !== "owner" && (
              <button
                className="danger"
                onClick={async () => {
                  await teamApi.remove(member.id);
                  showToast("Member removed");
                  await load();
                }}
              >
                Remove
              </button>
            )}
          </article>
        ))}
      </div>
      <Toast message={toast} />
    </section>
  );
}
