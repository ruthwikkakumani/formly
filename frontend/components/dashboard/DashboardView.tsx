"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Toast } from "@/components/shared/Toast";
import { useForms } from "@/hooks/useForms";
import { fadeDuration, paneEase, pillSpring, stagger, staggerDelay } from "@/lib/motion";
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
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<"forms" | "templates">("forms");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [ready, setReady] = useState(false);
  const [cardsIn, setCardsIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setReady(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }

  const visibleForms = useMemo(
    () => filterForms(workspace.forms, query, status),
    [workspace.forms, query, status],
  );

  return (
    <main className={`dashboard${ready ? " is-in" : ""}`}>
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
            <label className={`dashsearch${query ? " has-query" : ""}`}>
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
              <button
                type="button"
                className="dashsearch-clear"
                aria-label="Clear search"
                tabIndex={query ? 0 : -1}
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
            </label>
            {tab === "forms" ? (
              <div className="dashfilter has-thumb" role="group" aria-label="Filter by status">
                <LayoutGroup id="dashfilter-pill">
                  {STATUS_FILTERS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={status === option.value ? "filteron" : ""}
                      aria-pressed={status === option.value}
                      onClick={() => setStatus(option.value)}
                    >
                      {status === option.value ? (
                        <motion.span
                          layoutId="dashfilter-active"
                          className="dashfilter-thumb"
                          transition={reduceMotion ? { duration: 0 } : pillSpring}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="dashfilter-label">{option.label}</span>
                    </button>
                  ))}
                </LayoutGroup>
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
          <section className="formgrid" aria-busy="true" aria-label="Loading forms">
            {Array.from({ length: 6 }, (_, index) => (
              <article className="formcard is-skel" key={index}>
                <span className="skeleton skel-chip" />
                <span className="skeleton skel-line skel-wide" />
                <span className="skeleton skel-line" />
                <span className="skeleton skel-line skel-short" />
              </article>
            ))}
          </section>
        ) : workspace.error ? (
          <EmptyState title="We couldn't load your forms" body={workspace.error} />
        ) : workspace.forms.length === 0 ? (
          <EmptyState title="No forms yet" body="Create a form to start collecting responses." />
        ) : visibleForms.length ? (
          <motion.section
            className="formgrid"
            initial={cardsIn || reduceMotion ? false : "hidden"}
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: stagger, delayChildren: staggerDelay } },
            }}
            onAnimationComplete={() => setCardsIn(true)}
          >
            {visibleForms.map((form) => (
              <motion.div
                key={form.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: fadeDuration, ease: paneEase } },
                }}
              >
                <FormCard
                  form={form}
                  canEdit={workspace.canEdit}
                  onRename={workspace.renameForm}
                  onDuplicate={workspace.duplicateForm}
                  onPublish={workspace.togglePublish}
                  onDelete={workspace.deleteForm}
                  onCopyLink={workspace.copyLink}
                />
              </motion.div>
            ))}
          </motion.section>
        ) : (
          <EmptyState
            title="No matching forms"
            body="Nothing matches that search or filter. Try another title or switch to All."
          />
        )}
        <Toast {...workspace.toast} />
    </main>
  );
}
