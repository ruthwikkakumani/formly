"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Toast } from "@/components/shared/Toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { isOwner } from "@/lib/access";
import { teamApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { MemberRole, WorkspaceInvite, WorkspaceMember } from "@/lib/types";
import { isValidEmail } from "@/lib/validation";

const PAGE_SIZE = 10;

function asList<T>(value: T[] | T | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function TeamView({ embedded = false }: { embedded?: boolean }) {
  const { current, ready, members: fetchedMembers } = useCurrentUser();
  const owner = isOwner(current);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [membersReady, setMembersReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const { toast, showToast } = useToast();

  const total = members.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const safePage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageRows = useMemo(() => members.slice(start, end), [members, start, end]);

  const load = useCallback(async () => {
    let nextInvites: WorkspaceInvite[] = [];
    let failed = "";
    try {
      const nextMembers = await teamApi.list();
      setMembers(asList(nextMembers));
    } catch (error) {
      failed = messageFromUnknown(error, MESSAGES.teamLoadFailed);
      showToast(failed, "error");
    } finally {
      setMembersReady(true);
    }
    try {
      nextInvites = asList(await teamApi.invites());
      setInvites(nextInvites);
    } catch (error) {
      setInvites([]);
      nextInvites = [];
      if (!failed) {
        failed = messageFromUnknown(error, MESSAGES.teamLoadFailed);
        showToast(failed, "error");
      }
    }
    setLoadError(failed);
    return nextInvites;
  }, [showToast]);

  useEffect(() => {
    if (!fetchedMembers.length) return;
    setMembers((prev) => (prev.length ? prev : fetchedMembers));
    setMembersReady(true);
  }, [fetchedMembers]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, current?.role, load]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, Math.max(1, Math.ceil(members.length / PAGE_SIZE) || 1)));
  }, [members.length]);

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

  async function changeRole(memberId: number, next: MemberRole) {
    if (!owner || next === "owner") return;
    setUpdatingId(memberId);
    try {
      const updated = await teamApi.updateRole(memberId, next);
      setMembers((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      showToast(next === "editor" ? "They can now edit forms." : "They now have view-only access.");
    } catch (error) {
      showToast(messageFromUnknown(error, MESSAGES.roleUpdateFailed), "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function copyInviteLink(url: string) {
    if (!owner || !url) return;
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
    <section className={`team${embedded ? " team-embedded" : ""}`}>
      {!embedded ? (
        <>
          <p className="eyebrow">WORKSPACE</p>
          <h1>Collaboration & sharing</h1>
          <p className="lede">
            {owner
              ? "Send an email invite. They are not added until they open the link and accept. Ignore or revoke means they stay out of the workspace."
              : "Everyone in this workspace can see who has access. Only the owner can invite or remove teammates."}
          </p>
        </>
      ) : null}
      {owner ? (
        <form className={`invite${embedded ? " settings-card" : ""}`} noValidate onSubmit={(event) => void invite(event)}>
          {embedded ? (
            <header className="settings-card-head invite-copy">
              <div>
                <h3>Invite</h3>
                <p className="hint">They are not added until they open the link and accept.</p>
              </div>
            </header>
          ) : null}
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
      {invites.length ? (
        <div className={`memberlist${embedded ? " settings-card" : ""}`}>
          {embedded ? (
            <header className="settings-card-head">
              <div>
                <h3>Pending invites</h3>
                <p className="hint">Waiting to accept. Revoke if you sent it by mistake.</p>
              </div>
            </header>
          ) : (
            <p className="eyebrow">PENDING INVITES</p>
          )}
          <div className="memberlist-rows" role="list" aria-label="Pending invites">
            {invites.map((inviteRow) => (
              <article key={inviteRow.id} role="listitem">
                <div>
                  <b>{inviteRow.name}</b>
                  <p>
                    {inviteRow.email} · {inviteRow.role} · waiting to accept
                  </p>
                  {owner && inviteRow.email_error ? (
                    <p className="invite-email-error" role="status">
                      Email failed: {inviteRow.email_error}
                    </p>
                  ) : null}
                </div>
                <span className="status">pending</span>
                {owner && inviteRow.accept_url ? (
                  <button type="button" onClick={() => void copyInviteLink(inviteRow.accept_url || "")}>
                    Copy invite link
                  </button>
                ) : null}
                {owner ? (
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
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div className="memberTableWrap">
        {embedded ? (
          <header className="memberTableHead">
            <h3>Members</h3>
            <p className="hint">
              {owner
                ? "Change a role or remove someone from this workspace."
                : "Everyone in this workspace can see who has access. Only the owner can invite or remove teammates."}
            </p>
          </header>
        ) : (
          <p className="eyebrow">MEMBERS</p>
        )}
        {loadError ? (
          <p className="autherr" role="alert">
            {loadError}{" "}
            <button type="button" onClick={() => void load()}>
              Try again
            </button>
          </p>
        ) : null}
        {!loadError && membersReady && members.length === 0 ? (
          <p className="memberTableEmpty">No teammates to show yet.</p>
        ) : null}
        {members.length ? (
          <>
            <div className="memberTable">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((member) => {
                    const canManage = owner && member.role !== "owner";
                    return (
                      <tr key={member.id}>
                        <td className="member-name">{member.name}</td>
                        <td className="member-email">{member.email}</td>
                        <td className="member-role">
                          {canManage ? (
                            <select
                              className="role-select"
                              aria-label={`Role for ${member.name}`}
                              value={member.role}
                              disabled={updatingId === member.id}
                              onChange={(event) => void changeRole(member.id, event.target.value as MemberRole)}
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className={member.role === "owner" ? "rolechip" : "status"}>{member.role}</span>
                          )}
                        </td>
                        <td className="member-actions">
                          {canManage ? (
                            <button
                              className="member-remove"
                              type="button"
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
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <nav className="memberPager" aria-label="Members pagination">
              <p aria-live="polite">
                {start + 1}–{end} of {total}
              </p>
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                Previous
              </button>
              <button type="button" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>
                Next
              </button>
            </nav>
          </>
        ) : null}
      </div>
      <Toast {...toast} />
    </section>
  );
}
