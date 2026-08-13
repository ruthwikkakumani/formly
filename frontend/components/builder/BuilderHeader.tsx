import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { BusyLabel } from "@/components/shared/BusyLabel";
import { pillSpring } from "@/lib/motion";
import { FormDefinition, FormEditor, WorkspaceMember } from "@/lib/types";

const TABS = ["Build", "Results", "Settings"] as const;

export function BuilderHeader({
  form,
  tab,
  editors,
  current,
  dirty,
  saving = false,
  publishing = false,
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
  saving?: boolean;
  publishing?: boolean;
  readOnly?: boolean;
  onTab: (tab: "Build" | "Results" | "Settings") => void;
  onTitle: (title: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onCopyLink: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const selfEmail = (current?.email || "").trim().toLowerCase();
  const others = selfEmail
    ? editors.filter((editor) => (editor.email || "").trim().toLowerCase() !== selfEmail)
    : [];

  return (
    <header className="builderhead">
      <div className="builderid">
        <Link href="/" className="builderbrand" aria-label="formly home">
          formly<span>•</span>
        </Link>
        <Link href="/" className="builderback">
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
      <nav className="buildertabs has-thumb" aria-label="Builder sections">
        <LayoutGroup id="builder-tabs">
          {TABS.map((item) => (
            <button
              type="button"
              className={tab === item ? "active" : ""}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => onTab(item)}
              key={item}
            >
              {tab === item ? (
                <motion.span
                  layoutId="builder-tab-active"
                  className="buildertabs-thumb"
                  transition={reduceMotion ? { duration: 0 } : pillSpring}
                  aria-hidden="true"
                />
              ) : null}
              <span className="buildertabs-label">{item}</span>
            </button>
          ))}
        </LayoutGroup>
      </nav>
      <div className="builder-end">
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
        <div className="builderactions">
          {readOnly ? (
            <span className="livepill viewonly">View only</span>
          ) : (
            <button
              type="button"
              className={`btnsave${dirty ? " is-dirty" : ""}${saving ? " is-busy" : ""}`}
              onClick={onSave}
              disabled={!dirty || saving}
            >
              <BusyLabel busy={saving} idle="Save" pending="Saving" />
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
            <button type="button" className={`primary${publishing ? " is-busy" : ""}`} onClick={onPublish} disabled={publishing}>
              <BusyLabel
                busy={publishing}
                idle={form.status === "draft" ? "Publish" : "Unpublish"}
                pending={form.status === "draft" ? "Publishing" : "Unpublishing"}
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
