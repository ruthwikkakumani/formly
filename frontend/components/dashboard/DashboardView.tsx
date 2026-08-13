"use client";

import { useMemo, useRef, useState } from "react";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { Toast } from "@/components/shared/Toast";
import { useForms } from "@/hooks/useForms";
import { FormDefinition, FormStatus } from "@/lib/types";
import { FormCard } from "./FormCard";
import { TemplatesGallery } from "./TemplatesGallery";

type StatusFilter = "all" | FormStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

function matchesQuery(query: string, ...fields: string[]) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field.toLowerCase().includes(needle));
}

function filterForms(forms: FormDefinition[], query: string, status: StatusFilter) {
  return forms.filter((form) => {
    if (status !== "all" && form.status !== status) return false;
    return matchesQuery(query, form.title, form.description || "");
  });
}

export function DashboardView() {
  const workspace = useForms();
  const searchRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"forms" | "templates">("forms");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }

  const visibleForms = useMemo(
    () => filterForms(workspace.forms, query, status),
    [workspace.forms, query, status],
  );

  return (
    <WorkspaceShell>
      <main className="dashboard">
        <section className="dashhead">
          <div>
            <p className="eyebrow">MY WORKSPACE</p>
            <h1>Forms</h1>
          </div>
          {workspace.canEdit ? (
            <button className="primary" onClick={() => void workspace.createForm()}>
              + Create form
            </button>
          ) : (
            <p className="viewonly-note">View only — ask the owner to make you an editor to create or change forms.</p>
          )}
        </section>
        <div className="dashbar">
          <div className="tabs" role="tablist">
            <button type="button" role="tab" className={tab === "forms" ? "tabon" : ""} aria-selected={tab === "forms"} onClick={() => setTab("forms")}>
              All forms
            </button>
            <button type="button" role="tab" className={tab === "templates" ? "tabon" : ""} aria-selected={tab === "templates"} onClick={() => setTab("templates")}>
              Templates
            </button>
          </div>
          <div className="dashtools">
            <label className="dashsearch">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tab === "templates" ? "Search templates" : "Search forms"}
                aria-label={tab === "templates" ? "Search templates" : "Search forms"}
                autoComplete="off"
                spellCheck={false}
              />
              {query ? (
                <button
                  type="button"
                  className="dashsearch-clear"
                  aria-label="Clear search"
                  onClick={clearSearch}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                    <path
                      d="M1.5 1.5l7 7M8.5 1.5l-7 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              ) : null}
            </label>
            {tab === "forms" ? (
              <div className="dashfilter" role="group" aria-label="Filter by status">
                {STATUS_FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={status === option.value ? "filteron" : ""}
                    aria-pressed={status === option.value}
                    onClick={() => setStatus(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {tab === "templates" ? (
          <TemplatesGallery
            query={query}
            creatingId={workspace.creatingTemplateId}
            canUse={workspace.canEdit}
            onUse={workspace.createFromTemplate}
          />
        ) : workspace.loading ? (
          <div className="empty">Loading your workspace…</div>
        ) : workspace.error ? (
          <EmptyState title="We couldn't load your forms" body={workspace.error} />
        ) : workspace.forms.length === 0 ? (
          <EmptyState title="No forms yet" body="Create a form to start collecting responses." />
        ) : visibleForms.length ? (
          <section className="formgrid">
            {visibleForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                canEdit={workspace.canEdit}
                onRename={workspace.renameForm}
                onDuplicate={workspace.duplicateForm}
                onPublish={workspace.togglePublish}
                onDelete={workspace.deleteForm}
                onCopyLink={workspace.copyLink}
              />
            ))}
          </section>
        ) : (
          <EmptyState
            title="No matching forms"
            body="Nothing matches that search or filter. Try another title or switch to All."
          />
        )}
        <Toast {...workspace.toast} />
      </main>
    </WorkspaceShell>
  );
}
