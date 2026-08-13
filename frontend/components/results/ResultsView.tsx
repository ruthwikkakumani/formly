"use client";

import { useEffect, useState } from "react";

import { formsApi } from "@/lib/api";
import { FormResponse, FormStats, Question } from "@/lib/types";
import { ResponseModal } from "./ResponseModal";
import { ResponseTable } from "./ResponseTable";
import { StatsStrip } from "./StatsStrip";

export function ResultsView({ id, questions }: { id: string; questions: Question[] }) {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [stats, setStats] = useState<FormStats>();
  const [open, setOpen] = useState<FormResponse>();

  useEffect(() => {
    void formsApi.responses(id).then(setResponses);
    void formsApi.stats(id).then(setStats);
  }, [id]);

  return (
    <section className="results">
      <div className="resultshead">
        <h2>
          Responses <span>{responses.length}</span>
        </h2>
        <a className="save" href={formsApi.exportUrl(id)}>
          Export CSV
        </a>
      </div>
      <p className="completion">
        Completion rate: <b>{stats?.completion.rate || 0}%</b> · {stats?.completion.completed || 0} completed ·{" "}
        {stats?.completion.in_progress || 0} in progress
      </p>
      <StatsStrip stats={stats?.questions || []} />
      <ResponseTable responses={responses} questions={questions} onOpen={setOpen} />
      {open && <ResponseModal response={open} questions={questions} onClose={() => setOpen(undefined)} />}
    </section>
  );
}
