"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Toast } from "@/components/shared/Toast";
import { formsApi } from "@/lib/api";
import { FormResponse, FormStats, Question } from "@/lib/types";
import { useToast } from "@/hooks/useToast";
import { ResponseModal } from "./ResponseModal";
import { ResponseTable } from "./ResponseTable";
import { StatsStrip } from "./StatsStrip";

export function ResultsView({ id, questions }: { id: string; questions: Question[] }) {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [stats, setStats] = useState<FormStats>();
  const [open, setOpen] = useState<FormResponse>();
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([formsApi.responses(id), formsApi.stats(id)])
      .then(([nextResponses, nextStats]) => {
        setResponses(nextResponses);
        setStats(nextStats);
      })
      .catch((err: unknown) => {
        showToast(err instanceof Error ? err.message : "We couldn't load responses.", "error");
      })
      .finally(() => setLoading(false));
  }, [id, showToast]);

  return (
    <section className="results">
      <div className="resultshead">
        <h2>
          Responses <span>{responses.length}</span>
        </h2>
        <button
          className="save"
          type="button"
          onClick={() =>
            void formsApi
              .exportCsv(id)
              .then(() => showToast("CSV downloaded"))
              .catch((err: unknown) => showToast(err instanceof Error ? err.message : "Export failed", "error"))
          }
        >
          Export CSV
        </button>
      </div>
      <p className="completion">
        Completion rate: <b>{stats?.completion.rate || 0}%</b> · {stats?.completion.completed || 0} completed ·{" "}
        {stats?.completion.in_progress || 0} in progress
      </p>
      {loading ? (
        <p className="completion">Loading responses…</p>
      ) : responses.length ? (
        <>
          <StatsStrip stats={stats?.questions || []} />
          <ResponseTable responses={responses} questions={questions} onOpen={setOpen} />
        </>
      ) : (
        <EmptyState title="No responses yet" body="Publish the form and share the link to start collecting answers." />
      )}
      {open && <ResponseModal response={open} questions={questions} onClose={() => setOpen(undefined)} />}
      <Toast {...toast} />
    </section>
  );
}
