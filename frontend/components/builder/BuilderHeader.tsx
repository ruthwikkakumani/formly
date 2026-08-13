import Link from "next/link";

import { FormDefinition, FormEditor, WorkspaceMember } from "@/lib/types";

const TABS = ["Build", "Results", "Settings"] as const;

export function BuilderHeader({
  form,
  tab,
  editors,
  current,
  dirty,
  readOnly = false,
  onTab,
  onTitle,
  onSave,
  onPublish,
  onCopyLink,
}: {
  form: FormDefinition;
  tab: "Build" | "Results" | "Settings";
  editors: FormEditor[];
  current?: WorkspaceMember | null;
  dirty: boolean;
  readOnly?: boolean;
  onTab: (tab: "Build" | "Results" | "Settings") => void;
  onTitle: (title: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onCopyLink: () => void;
}) {
  const selfEmail = (current?.email || "").trim().toLowerCase();
  const others = selfEmail
    ? editors.filter((editor) => (editor.email || "").trim().toLowerCase() !== selfEmail)
    : [];

  return (
    <header className="builderhead">
      <div className="builderid">
        <Link href="/" className="builderback" aria-label="Back to forms">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Forms
        </Link>
        <input
          value={form.title}
          onChange={(event) => onTitle(event.target.value)}
          className="titleinput"
          aria-label="Form title"
          readOnly={readOnly}
        />
      </div>
      <div className="presence">
        {others.length ? (
          <span className="livepill">{others.map((editor) => editor.name).join(", ")} editing</span>
        ) : (
          <span className="livepill quiet">Only you</span>
        )}
        <span
          className="savedby"
          title={dirty ? "Unsaved changes" : `Last saved by ${form.updated_by || "—"}`}
        >
          {dirty ? "Unsaved changes" : `Last saved by ${form.updated_by || "—"}`}
        </span>
      </div>
      <nav className="buildertabs" aria-label="Builder sections">
        {TABS.map((item) => (
          <button
            type="button"
            className={tab === item ? "active" : ""}
            aria-current={tab === item ? "page" : undefined}
            onClick={() => onTab(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="builderactions">
        {readOnly ? (
          <span className="livepill viewonly">View only</span>
        ) : (
          <button type="button" className={`btnsave${dirty ? " is-dirty" : ""}`} onClick={onSave} disabled={!dirty}>
            Save
          </button>
        )}
        {form.status === "published" && (
          <button type="button" className="btncopy" onClick={onCopyLink}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6.7 9.3 9.3 6.7M7.2 11.4l-.9.9a2.6 2.6 0 1 1-3.6-3.6l.9-.9M8.8 4.6l.9-.9a2.6 2.6 0 1 1 3.6 3.6l-.9.9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Copy link
          </button>
        )}
        {readOnly ? null : (
          <button type="button" className="primary" onClick={onPublish}>
            {form.status === "draft" ? "Publish" : "Unpublish"}
          </button>
        )}
      </div>
    </header>
  );
}
