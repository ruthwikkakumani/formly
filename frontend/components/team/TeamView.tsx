"use client";

import { FormEvent, useEffect, useState } from "react";

import { Toast } from "@/components/shared/Toast";
import { useToast } from "@/hooks/useToast";
import { teamApi } from "@/lib/api";
import { MemberRole, WorkspaceMember } from "@/lib/types";

export function TeamView() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const { toast, showToast } = useToast();

  const load = () => teamApi.list().then(setMembers);
  useEffect(() => {
    void load();
  }, []);

  async function invite(event: FormEvent) {
    event.preventDefault();
    await teamApi.invite({ name, email, role });
    setName("");
    setEmail("");
    showToast("Teammate invited to the workspace");
    await load();
  }

  return (
    <section className="team">
      <p className="eyebrow">WORKSPACE</p>
      <h1>Collaboration & sharing</h1>
      <p className="lede">
        Invite editors and viewers to this workspace. Everyone here can open forms; editors can build and publish.
        Public fill links stay shareable without login.
      </p>
      <form className="invite" onSubmit={(event) => void invite(event)}>
        <input required placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <select value={role} onChange={(event) => setRole(event.target.value as MemberRole)}>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button className="primary" type="submit">
          Invite
        </button>
      </form>
      <div className="memberlist">
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
