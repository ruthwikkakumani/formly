"use client";

import { useEffect, useState } from "react";

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
          className="save"
          type="button"
          onClick={() =>
            void formsApi
              .exportCsv(id)
              .then(() => showToast("CSV downloaded"))
              .catch((err: unknown) => showToast(messageFromUnknown(err, MESSAGES.exportFailed), "error"))
          }
        >
          Export CSV
        </button>
      </div>
      {loading ? (
        <p className="resultsHint">Loading responses…</p>
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
