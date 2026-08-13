import { ReactNode } from "react";

import { displayAnswer } from "@/lib/answers";
import { QUESTION_TYPES } from "@/lib/constants";
import { FormResponse, Question, QuestionStat, QuestionType } from "@/lib/types";

const CHOICE_TYPES = new Set<QuestionType>(["multiple_choice", "dropdown", "yes_no"]);

function typeLabel(type: QuestionType) {
  return QUESTION_TYPES.find((item) => item.value === type)?.label || type;
}

function percent(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function choiceRows(stat: QuestionStat, question?: Question) {
  const seen = new Set<string>();
  const rows: Array<{ label: string; count: number }> = [];
  for (const option of question?.options || []) {
    seen.add(option);
    rows.push({ label: option, count: stat.counts[option] || 0 });
  }
  for (const [label, count] of Object.entries(stat.counts)) {
    if (!seen.has(label)) rows.push({ label, count });
  }
  return rows;
}

function ratingRows(counts: Record<string, number>) {
  return ["1", "2", "3", "4", "5"].map((label) => ({ label, count: counts[label] || 0 }));
}

function ratingAverage(counts: Record<string, number>) {
  let sum = 0;
  let total = 0;
  for (const [value, count] of Object.entries(counts)) {
    const rating = Number(value);
    if (!count || !Number.isFinite(rating)) continue;
    sum += rating * count;
    total += count;
  }
  return total ? Math.round((sum / total) * 10) / 10 : null;
}

function recentSnippets(questionId: number, responses: FormResponse[]) {
  const snippets: string[] = [];
  for (const response of responses) {
    const text = displayAnswer(response.answers[questionId]);
    if (text !== "—") snippets.push(text);
  }
  return snippets;
}

function numericAverage(questionId: number, responses: FormResponse[]) {
  const values: number[] = [];
  for (const response of responses) {
    const raw = (response.answers[questionId] || "").trim();
    if (!raw) continue;
    const value = Number(raw);
    if (Number.isFinite(value)) values.push(value);
  }
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

const CHART_COLORS = ["#ff6d5a", "#191919", "#c4b49a", "#6f6f6c", "#e8b86d", "#5f7a6a", "#8a6a58"];

function ChoiceChart({ rows, total }: { rows: Array<{ label: string; count: number }>; total: number }) {
  if (!rows.length) return <p className="insightEmpty">No options yet</p>;
  const radius = 36;
  let start = 0;
  const slices = rows.map((row, index) => {
    const pct = percent(row.count, total);
    const slice = {
      ...row,
      color: CHART_COLORS[index % CHART_COLORS.length],
      pct,
      start,
    };
    start += pct;
    return slice;
  });

  return (
    <div className="choiceChart">
      <div className="choiceDonutWrap" role="img" aria-label={slices.map((row) => `${row.label} ${row.pct}%`).join(", ")}>
        <svg viewBox="0 0 100 100" className="choiceDonut" aria-hidden="true">
          <g transform="rotate(-90 50 50)">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1efe8" strokeWidth="14" />
            {slices.map((slice) =>
              slice.count ? (
                <circle
                  key={slice.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="14"
                  pathLength={100}
                  strokeDasharray={`${slice.pct} ${Math.max(0, 100 - slice.pct)}`}
                  strokeDashoffset={-slice.start}
                />
              ) : null,
            )}
          </g>
        </svg>
        <div className="choiceDonutCenter">
          <strong>{total}</strong>
          <small>{total === 1 ? "answer" : "answers"}</small>
        </div>
      </div>
      <ul className="insightList choiceLegend">
        {slices.map((row) => (
          <li key={row.label}>
            <i style={{ background: row.color }} aria-hidden="true" />
            <span title={row.label}>{row.label}</span>
            <small>
              {row.count} · {row.pct}%
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RatingChart({ counts, total }: { counts: Record<string, number>; total: number }) {
  const average = ratingAverage(counts);
  const rows = ratingRows(counts);
  const max = Math.max(...rows.map((row) => row.count), 0);
  const filled = average ? Math.round(average) : 0;
  return (
    <div className="ratingInsight">
      <div className="ratingAvg">
        <strong>{average ?? "—"}</strong>
        <div>
          <span className="ratingStars" aria-hidden="true">
            {"★★★★★".slice(0, filled)}
            <span>{"★★★★★".slice(filled)}</span>
          </span>
          <small>{total ? "average" : "No ratings yet"}</small>
        </div>
      </div>
      <div className="ratingDist" role="img" aria-label={average ? `Average ${average} of 5` : "No ratings yet"}>
        {rows.map((row) => {
          const height = max ? Math.max(8, Math.round((row.count / max) * 100)) : 0;
          return (
            <div key={row.label} className="ratingCol">
              <span className="ratingCount">{row.count}</span>
              <span className="ratingBar">
                <span style={{ height: `${row.count ? height : 0}%` }} />
              </span>
              <span>{row.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpenAnswers({
  snippets,
  average,
  empty,
}: {
  snippets: string[];
  average?: number | null;
  empty: string;
}) {
  return (
    <div className="openAnswers">
      {average != null ? (
        <p className="openAvg">
          Average <b>{average}</b>
        </p>
      ) : null}
      {snippets.length ? (
        <ul className="insightList snippets">
          {snippets.map((snippet, index) => (
            <li key={`${index}-${snippet}`} title={snippet}>
              {snippet}
            </li>
          ))}
        </ul>
      ) : (
        <p className="insightEmpty">{empty}</p>
      )}
    </div>
  );
}

export function QuestionInsight({
  stat,
  question,
  responses,
}: {
  stat: QuestionStat;
  question?: Question;
  responses: FormResponse[];
}) {
  const total = stat.responses;
  let body: ReactNode;
  if (stat.type === "yes_no") {
    body = (
      <ChoiceChart
        rows={[
          { label: "Yes", count: stat.counts.Yes || 0 },
          { label: "No", count: stat.counts.No || 0 },
        ]}
        total={total}
      />
    );
  } else if (stat.type === "rating") {
    body = <RatingChart counts={stat.counts} total={total} />;
  } else if (CHOICE_TYPES.has(stat.type)) {
    body = <ChoiceChart rows={choiceRows(stat, question)} total={total} />;
  } else {
    body = (
      <OpenAnswers
        snippets={recentSnippets(stat.question_id, responses)}
        average={stat.type === "number" ? numericAverage(stat.question_id, responses) : null}
        empty={total ? "Open to read answers" : "No answers yet"}
      />
    );
  }

  return (
    <article className="insight">
      <header>
        <p title={stat.title}>{stat.title}</p>
        <small>
          {typeLabel(stat.type)} · {total} {total === 1 ? "answer" : "answers"}
        </small>
      </header>
      <div className="insightBody">{body}</div>
    </article>
  );
}
