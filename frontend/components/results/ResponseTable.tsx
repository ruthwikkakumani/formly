"use client";

import { useEffect, useMemo, useState } from "react";

import { displayAnswer } from "@/lib/answers";
import { FormResponse, Question } from "@/lib/types";

const PAGE_SIZE = 10;
const PAGE_SIZES = [10, 25, 50] as const;

function formatSubmitted(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ResponseTable({
  responses,
  questions,
  onOpen,
}: {
  responses: FormResponse[];
  questions: Question[];
  onOpen: (response: FormResponse) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const columns = questions.length + 1;
  const total = responses.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageRows = useMemo(() => responses.slice(start, end), [responses, start, end]);

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(1, Math.ceil(total / pageSize) || 1)));
  }, [total, pageSize]);

  return (
    <div className="responseTableWrap">
      <div className="tablehead">
        <h3>All responses</h3>
        <span>{total ? "Select a row for full answers" : "Waiting for the first submission"}</span>
      </div>
      <div className="responseTable">
        <table>
          <thead>
            <tr>
              <th>Submitted</th>
              {questions.map((question) => (
                <th key={question.id || question.title} title={question.title}>
                  <span>{question.title}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? (
              pageRows.map((response) => (
                <tr
                  className="responseRow"
                  key={response.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(response)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(response);
                    }
                  }}
                >
                  <td className="when">{formatSubmitted(response.submitted_at)}</td>
                  {questions.map((question) => {
                    const text = displayAnswer(question.id ? response.answers[question.id] : "");
                    return (
                      <td key={question.id || question.title}>
                        <span title={text === "—" ? undefined : text} className={text === "—" ? "blank" : undefined}>
                          {text}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr className="emptyRow">
                <td colSpan={Math.max(columns, 1)}>No responses yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {total > 0 ? (
        <nav className="responsePager" aria-label="Responses pagination">
          <p aria-live="polite">
            {start + 1}–{end} of {total}
          </p>
          {total > PAGE_SIZE ? (
            <label className="responsePageSize">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                aria-label="Rows per page"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
            Previous
          </button>
          <button type="button" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
