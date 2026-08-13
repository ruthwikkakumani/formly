"use client";

import { useState } from "react";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { Toast } from "@/components/shared/Toast";
import { useForms } from "@/hooks/useForms";
import { FormCard } from "./FormCard";
import { TemplatesGallery } from "./TemplatesGallery";

export function DashboardView() {
  const workspace = useForms();
  const [tab, setTab] = useState<"forms" | "templates">("forms");

  return (
    <WorkspaceShell>
      <main className="dashboard">
        <section className="dashhead">
          <div>
            <p className="eyebrow">MY WORKSPACE</p>
            <h1>Forms</h1>
          </div>
          <button className="primary" onClick={() => void workspace.createForm()}>
            + Create form
          </button>
        </section>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" className={tab === "forms" ? "tabon" : ""} aria-selected={tab === "forms"} onClick={() => setTab("forms")}>
            All forms
          </button>
          <button type="button" role="tab" className={tab === "templates" ? "tabon" : ""} aria-selected={tab === "templates"} onClick={() => setTab("templates")}>
            Templates
          </button>
        </div>
        {tab === "templates" ? (
          <TemplatesGallery creatingId={workspace.creatingTemplateId} onUse={workspace.createFromTemplate} />
        ) : workspace.loading ? (
          <div className="empty">Loading your workspace…</div>
        ) : workspace.error ? (
          <EmptyState title="We couldn't load your forms" body={workspace.error} />
        ) : workspace.forms.length ? (
          <section className="formgrid">
            {workspace.forms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                onRename={workspace.renameForm}
                onDuplicate={workspace.duplicateForm}
                onPublish={workspace.togglePublish}
                onDelete={workspace.deleteForm}
                onCopyLink={workspace.copyLink}
              />
            ))}
          </section>
        ) : (
          <EmptyState title="No forms yet" body="Create a form to start collecting responses." />
        )}
        <Toast {...workspace.toast} />
      </main>
    </WorkspaceShell>
  );
}
