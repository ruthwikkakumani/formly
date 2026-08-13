"use client";

import Link from "next/link";
import { useState } from "react";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormDefinition } from "@/lib/types";
import { RenameModal } from "./RenameModal";

export function FormCard({
  form,
  onRename,
  onDuplicate,
  onPublish,
  onDelete,
  onCopyLink,
}: {
  form: FormDefinition;
  onRename: (id: number, title: string) => Promise<void>;
  onDuplicate: (id: number) => Promise<void>;
  onPublish: (form: FormDefinition) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCopyLink: (slug: string) => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);

  return (
    <article className="formcard">
      <div className="cardtop">
        <StatusBadge status={form.status} />
        <div className="menuwrap">
          <button className="dots" onClick={() => setMenu((open) => !open)} aria-label="Form actions">
            ⋯
          </button>
          {menu && (
            <div className="menu">
              <button onClick={() => { setRenaming(true); setMenu(false); }}>Rename</button>
              <button onClick={() => { void onDuplicate(form.id); setMenu(false); }}>Duplicate</button>
              {form.status === "published" && (
                <button onClick={() => { void onCopyLink(form.slug); setMenu(false); }}>Copy link</button>
              )}
              <button
                className="danger"
                onClick={() => {
                  if (confirm("Delete this form and its responses?")) void onDelete(form.id);
                  setMenu(false);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <Link href={`/builder/${form.id}`}>
        <div className="cardpreview">{form.questions[0]?.title || "Untitled question"}</div>
        <h2>{form.title}</h2>
        <p>{form.description || "No description yet"}</p>
      </Link>
      <footer>
        <span>{form.response_count} responses</span>
        <span>{form.updated_by ? `Edited by ${form.updated_by}` : `${form.questions.length} questions`}</span>
      </footer>
      <div className="cardactions">
        <button onClick={() => void onPublish(form)}>
          {form.status === "draft" ? "Publish" : "Unpublish"}
        </button>
        {form.status === "published" && (
          <Link href={`/f/${form.slug}`} target="_blank">
            Open ↗
          </Link>
        )}
        <Link href={`/builder/${form.id}`}>Edit</Link>
      </div>
      {renaming && (
        <RenameModal title={form.title} onClose={() => setRenaming(false)} onSave={(title) => onRename(form.id, title)} />
      )}
    </article>
  );
}
