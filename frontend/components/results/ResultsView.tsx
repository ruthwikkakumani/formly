"use client";

import { useEffect, useRef, useState } from "react";

import { BusyLabel } from "@/components/shared/BusyLabel";
import { Toast } from "@/components/shared/Toast";
import { formsApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { FormResponse, FormResults, FormStats, Question, QuestionStat } from "@/lib/types";
import { useToast } from "@/hooks/useToast";
import { ResponseModal } from "./ResponseModal";
import { ResponseTable } from "./ResponseTable";
import { StatsStrip } from "./StatsStrip";

function sameResults(current: FormResults | null, next: FormResults) {
  if (!current) return false;
  if (current.responses.length !== next.responses.length) return false;
  if (current.stats.completion.in_progress !== next.stats.completion.in_progress) return false;
  if (current.stats.completion.completed !== next.stats.completion.completed) return false;
  return current.responses.every(
    (row, index) =>
      row.id === next.responses[index]?.id && row.submitted_at === next.responses[index]?.submitted_at,
  );
}

export function ResultsView({
  id,
  questions,
  seed,
  live = false,
}: {
  id: string;
  questions: Question[];
  seed?: FormResults;
  live?: boolean;
}) {
  const [responses, setResponses] = useState<FormResponse[]>(seed?.responses || []);
  const [stats, setStats] = useState<FormStats | undefined>(seed?.stats);
  const [open, setOpen] = useState<FormResponse>();
  const [loading, setLoading] = useState(!seed);
  const [exporting, setExporting] = useState(false);
  const { toast, showToast } = useToast();
  const snapshot = useRef<FormResults | null>(seed || null);

  useEffect(() => {
    if (!seed) return;
    if (sameResults(snapshot.current, seed)) return;
    snapshot.current = seed;
    setResponses(seed.responses);
    setStats(seed.stats);
    setLoading(false);
  }, [seed]);

  useEffect(() => {
    let cancelled = false;
    const apply = (payload: FormResults) => {
      if (sameResults(snapshot.current, payload)) return;
      snapshot.current = payload;
      setResponses(payload.responses);
      setStats(payload.stats);
    };
    const load = async (quiet: boolean) => {
      try {
        const payload = await formsApi.results(id);
        if (cancelled) return;
        apply(payload);
      } catch (err: unknown) {
        if (cancelled || quiet) return;
        showToast(messageFromUnknown(err, MESSAGES.responsesLoadFailed), "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (!snapshot.current) void load(false);
    if (!live) {
      return () => {
        cancelled = true;
      };
    }
    if (snapshot.current) void load(true);
    const timer = window.setInterval(() => void load(true), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id, live, showToast]);

  const insights: QuestionStat[] = stats?.questions?.length ? stats.questions : [];
  const rate = stats?.completion.rate || 0;
  const completed = stats?.completion.completed || 0;
  const inProgress = stats?.completion.in_progress || 0;
  const count = stats?.completion.completed ?? responses.length;

  return (
    <section className="results">
      <div className="resultshead">
        <div>
          <h2>
            Responses <span>{count}</span>
          </h2>
          <div className="resultsMeta">
            <p className="completion">
              <span>
                <b>{rate}%</b> completion
              </span>
              <span>{completed} completed</span>
              <span>{inProgress} in progress</span>
            </p>
            <div className="completionTrack" aria-hidden="true">
              <span style={{ width: `${rate}%` }} />
            </div>
          </div>
        </div>
        <button
          className={`save${exporting ? " is-busy" : ""}`}
          type="button"
          disabled={exporting}
          onClick={() => {
            setExporting(true);
            void formsApi
              .exportCsv(id)
              .then(() => showToast("CSV downloaded"))
              .catch((err: unknown) => showToast(messageFromUnknown(err, MESSAGES.exportFailed), "error"))
              .finally(() => setExporting(false));
          }}
        >
          <BusyLabel busy={exporting} idle="Export CSV" pending="Exporting" />
        </button>
      </div>
      {loading && !stats ? (
        <div className="results-skel" aria-busy="true" aria-label="Loading responses">
          <div className="stats">
            {Array.from({ length: 3 }, (_, index) => (
              <article className="insight is-skel" key={index}>
                <span className="skeleton skel-line skel-short" />
                <span className="skeleton skel-block" />
              </article>
            ))}
          </div>
          <div className="responseTable is-skel">
            <span className="skeleton skel-line skel-wide" />
            <span className="skeleton skel-line" />
            <span className="skeleton skel-line" />
            <span className="skeleton skel-line skel-short" />
          </div>
        </div>
      ) : (
        <>
          <StatsStrip stats={insights} questions={questions} responses={responses} />
          <ResponseTable responses={responses} questions={questions} onOpen={setOpen} />
        </>
      )}
      {open && <ResponseModal response={open} questions={questions} onClose={() => setOpen(undefined)} />}
      <Toast {...toast} />
    </section>
  );
}
