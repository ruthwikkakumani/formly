"use client";

import { FormEvent, useEffect, useState } from "react";

import { Toast } from "@/components/shared/Toast";
import { useToast } from "@/hooks/useToast";
import { teamApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { MemberRole, WorkspaceInvite, WorkspaceMember } from "@/lib/types";
import { isValidEmail } from "@/lib/validation";

export function TeamView() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast, showToast } = useToast();

  async function load() {
    try {
      const [nextMembers, nextInvites] = await Promise.all([teamApi.list(), teamApi.invites()]);
      setMembers(nextMembers);
      setInvites(nextInvites);
    } catch (error) {
      showToast(messageFromUnknown(error, MESSAGES.teamLoadFailed), "error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function invite(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setFormError(MESSAGES.missingName);
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setFormError(MESSAGES.invalidEmail);
      return;
    }
    setFormError("");
    setSending(true);
    try {
      const result = await teamApi.invite({ name: trimmedName, email: trimmedEmail, role });
      setName("");
      setEmail("");
      if (result.email_sent) {
        setShareLink("");
        setCopied(false);
        showToast(result.message || "Invite email sent. They join only after accepting the link.");
      } else {
        setShareLink(result.accept_url);
        setCopied(false);
        showToast(
          result.message || "Invite created, but the email could not be sent. Copy the invite link and share it.",
          "error",
        );
      }
      await load();
    } catch (error) {
      showToast(messageFromUnknown(error, MESSAGES.inviteSendFailed), "error");
    } finally {
      setSending(false);
    }
  }

  async function copyShareLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(MESSAGES.copyFailed, "error");
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
      <form className="invite" noValidate onSubmit={(event) => void invite(event)}>
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (formError) setFormError("");
          }}
        />
        <input
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (formError) setFormError("");
          }}
        />
        <select value={role} onChange={(event) => setRole(event.target.value as MemberRole)}>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button className="primary" type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send invite"}
        </button>
        {formError ? (
          <p className="autherr" role="alert">
            {formError}
          </p>
        ) : null}
      </form>
      {shareLink ? (
        <div className="invite-share" role="status">
          <p>The invite was created, but the email could not be sent. Copy the link and share it directly.</p>
          <div className="invite-share-row">
            <input readOnly value={shareLink} aria-label="Invite link" onFocus={(event) => event.target.select()} />
            <button type="button" className="primary" onClick={() => void copyShareLink()}>
              {copied ? "Copied" : "Copy invite link"}
            </button>
          </div>
        </div>
      ) : null}
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
                  try {
                    await teamApi.revokeInvite(inviteRow.id);
                    showToast("Invite revoked");
                    await load();
                  } catch (error) {
                    showToast(messageFromUnknown(error, MESSAGES.inviteRevokeFailed), "error");
                  }
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
                  try {
                    await teamApi.remove(member.id);
                    showToast("Member removed");
                    await load();
                  } catch (error) {
                    showToast(messageFromUnknown(error, MESSAGES.memberRemoveFailed), "error");
                  }
                }}
              >
                Remove
              </button>
            )}
          </article>
        ))}
      </div>
      <Toast {...toast} />
    </section>
  );
}
