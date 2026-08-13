import Link from "next/link";

import { FormDefinition, FormEditor, WorkspaceMember } from "@/lib/types";

export function BuilderHeader({
  form,
  tab,
  editors,
  current,
  dirty,
  onTab,
  onTitle,
  onSave,
  onPublish,
  onCopyLink,
}: {
  form: FormDefinition;
  tab: "Build" | "Results" | "Settings";
  editors: FormEditor[];
  current?: WorkspaceMember;
  dirty: boolean;
  onTab: (tab: "Build" | "Results" | "Settings") => void;
  onTitle: (title: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onCopyLink: () => void;
}) {
  const others = editors.filter(
    (editor) => editor.email !== current?.email.toLowerCase() && editor.email !== current?.email,
  );

  return (
    <header className="builderhead">
      <Link href="/" className="brand">
        formly<span>•</span>
      </Link>
      <input
        value={form.title}
        onChange={(event) => onTitle(event.target.value)}
        className="titleinput"
        aria-label="Form title"
      />
      <div className="presence">
        {others.length ? (
          <span className="livepill">{others.map((editor) => editor.name).join(", ")} editing</span>
        ) : (
          <span className="livepill quiet">Only you</span>
        )}
        <span className="savedby">{dirty ? "Unsaved changes" : `Last saved by ${form.updated_by || "—"}`}</span>
      </div>
      <nav>
        {(["Build", "Results", "Settings"] as const).map((item) => (
          <button className={tab === item ? "active" : ""} onClick={() => onTab(item)} key={item}>
            {item}
          </button>
        ))}
      </nav>
      <button className="save" onClick={onSave}>
        Save
      </button>
      {form.status === "published" && (
        <button className="save" onClick={onCopyLink}>
          Copy link
        </button>
      )}
      <button className="primary" onClick={onPublish}>
        {form.status === "draft" ? "Publish" : "Unpublish"}
      </button>
    </header>
  );
}
