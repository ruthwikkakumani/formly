"use client";

import { FormEvent, useEffect, useState } from "react";

import { Toast } from "@/components/shared/Toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { isOwner } from "@/lib/access";
import { teamApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { MemberRole, WorkspaceInvite, WorkspaceMember } from "@/lib/types";
import { isValidEmail } from "@/lib/validation";

export function TeamView({ embedded = false }: { embedded?: boolean }) {
  const { current, ready } = useCurrentUser();
  const owner = isOwner(current);
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
      const nextMembers = await teamApi.list();
      setMembers(nextMembers);
      if (isOwner(current)) {
        const nextInvites = await teamApi.invites();
        setInvites(nextInvites);
        return nextInvites;
      }
      setInvites([]);
      return [] as WorkspaceInvite[];
    } catch (error) {
      showToast(messageFromUnknown(error, MESSAGES.teamLoadFailed), "error");
      return [] as WorkspaceInvite[];
    }
  }

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, current?.role]);

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!owner) return;
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
      setShareLink(result.accept_url);
      setCopied(false);
      showToast(result.message || "Invite created");
      await load();
      const invitedEmail = trimmedEmail.toLowerCase();
      let reportedMailError = false;
      const refreshMailStatus = async () => {
        if (reportedMailError) return;
        const nextInvites = await load();
        const match = nextInvites.find((row) => row.email === invitedEmail);
        if (match?.email_error) {
          reportedMailError = true;
          showToast(`Email failed: ${match.email_error}`, "error");
        }
      };
      window.setTimeout(() => void refreshMailStatus(), 2000);
      window.setTimeout(() => void refreshMailStatus(), 8000);
    } catch (error) {
      showToast(messageFromUnknown(error, MESSAGES.inviteSendFailed), "error");
      const nextInvites = await load();
      const match = nextInvites.find((row) => row.email === trimmedEmail && row.accept_url);
      if (match?.accept_url) {
        setShareLink(match.accept_url);
        setCopied(false);
      }
    } finally {
      setSending(false);
    }
  }

  async function copyInviteLink(url: string) {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setShareLink(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(MESSAGES.copyFailed, "error");
    }
  }

  return (
    <section className="team">
      {!embedded ? (
        <>
          <p className="eyebrow">WORKSPACE</p>
          <h1>Collaboration & sharing</h1>
        </>
      ) : (
        <h2>Workspace team</h2>
      )}
      <p className="lede">
        {owner
          ? "Send an email invite. They are not added until they open the link and accept. Ignore or revoke means they stay out of the workspace."
          : "Everyone in this workspace can edit forms. Only the owner can invite or remove teammates."}
      </p>
      {owner ? (
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
      ) : null}
      {owner && shareLink ? (
        <div className="invite-share" role="status">
          <p>Invite created. Copy the invite link to share it.</p>
          <div className="invite-share-row">
            <input readOnly value={shareLink} aria-label="Invite link" onFocus={(event) => event.target.select()} />
            <button type="button" className="primary" onClick={() => void copyInviteLink(shareLink)}>
              {copied ? "Copied" : "Copy invite link"}
            </button>
          </div>
        </div>
      ) : null}
      {owner && invites.length ? (
        <div className="memberlist">
          <p className="eyebrow">PENDING INVITES</p>
          {invites.map((inviteRow) => (
            <article key={inviteRow.id}>
              <div>
                <b>{inviteRow.name}</b>
                <p>
                  {inviteRow.email} · {inviteRow.role} · waiting to accept
                </p>
                {inviteRow.email_error ? (
                  <p className="invite-email-error" role="status">
                    Email failed: {inviteRow.email_error}
                  </p>
                ) : null}
              </div>
              <span className="status">pending</span>
              {inviteRow.accept_url ? (
                <button type="button" onClick={() => void copyInviteLink(inviteRow.accept_url || "")}>
                  Copy invite link
                </button>
              ) : null}
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
            {owner && member.role !== "owner" && (
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
