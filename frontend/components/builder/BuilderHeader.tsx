import Link from "next/link";

import { FormDefinition } from "@/lib/types";

export function BuilderHeader({
  form,
  tab,
  onTab,
  onTitle,
  onSave,
  onPublish,
  onCopyLink,
}: {
  form: FormDefinition;
  tab: "Build" | "Results" | "Settings";
  onTab: (tab: "Build" | "Results" | "Settings") => void;
  onTitle: (title: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onCopyLink: () => void;
}) {
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
