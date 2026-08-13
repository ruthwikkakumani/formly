"use client";

import { useEffect, useState } from "react";

import { BusyLabel } from "@/components/shared/BusyLabel";
import { Toast } from "@/components/shared/Toast";
import { formsApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { FormResponse, FormStats, Question, QuestionStat } from "@/lib/types";
import { useToast } from "@/hooks/useToast";
import { ResponseModal } from "./ResponseModal";
import { ResponseTable } from "./ResponseTable";
import { StatsStrip } from "./StatsStrip";

function fallbackStats(questions: Question[]): QuestionStat[] {
  return questions.map((question) => ({
    question_id: question.id || 0,
    title: question.title,
    type: question.type,
    responses: 0,
    counts: {},
  }));
}

export function ResultsView({ id, questions }: { id: string; questions: Question[] }) {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [stats, setStats] = useState<FormStats>();
  const [open, setOpen] = useState<FormResponse>();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([formsApi.responses(id), formsApi.stats(id)])
      .then(([nextResponses, nextStats]) => {
        setResponses(nextResponses);
        setStats(nextStats);
      })
      .catch((err: unknown) => {
        showToast(messageFromUnknown(err, MESSAGES.responsesLoadFailed), "error");
      })
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const insights = stats?.questions?.length ? stats.questions : fallbackStats(questions);
  const rate = stats?.completion.rate || 0;
  const completed = stats?.completion.completed || 0;
  const inProgress = stats?.completion.in_progress || 0;

  return (
    <section className="results">
      <div className="resultshead">
        <div>
          <h2>
            Responses <span>{responses.length}</span>
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
      {loading ? (
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
