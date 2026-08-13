"use client";

import { FormResponse, Question, QuestionStat } from "@/lib/types";

import { QuestionInsight } from "./QuestionInsight";

export function StatsStrip({
  stats,
  questions,
  responses,
}: {
  stats: QuestionStat[];
  questions: Question[];
  responses: FormResponse[];
}) {
  if (!stats.length) return null;
  return (
    <div className="stats">
      {stats.map((stat) => (
        <div key={stat.question_id}>
          <QuestionInsight
            stat={stat}
            question={questions.find((item) => item.id === stat.question_id)}
            responses={responses}
          />
        </div>
      ))}
    </div>
  );
}
