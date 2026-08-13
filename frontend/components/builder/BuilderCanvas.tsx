"use client";

import { useEffect, useState } from "react";

import { QuestionNav } from "@/components/shared/QuestionNav";
import { Question } from "@/lib/types";
import { QuestionPreview } from "./QuestionPreview";

export function BuilderCanvas({
  question,
  index,
  total,
  accent,
  thankYou,
  readOnly = false,
  onChange,
  onSelect,
}: {
  question: Question;
  index: number;
  total: number;
  accent?: string;
  thankYou?: string;
  readOnly?: boolean;
  onChange: (patch: Partial<Question>) => void;
  onSelect: (index: number) => void;
}) {
  const [showingThanks, setShowingThanks] = useState(false);

  useEffect(() => {
    setShowingThanks(false);
  }, [question.id, index]);

  function goPrev() {
    if (showingThanks) {
      setShowingThanks(false);
      return;
    }
    if (index <= 0) return;
    onSelect(index - 1);
  }

  function goNext() {
    if (showingThanks) return;
    if (index >= total - 1) {
      setShowingThanks(true);
      return;
    }
    onSelect(index + 1);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section className="canvas">
      <div className="canvasbody">
        {showingThanks ? (
          <div className="canvasthanks">
            <div className="canvasthanks-mark">✓</div>
            <h3>Thank you!</h3>
            <p>{thankYou || "Your response has been submitted."}</p>
          </div>
        ) : (
          <>
            <p className="canvasmeta" style={{ color: accent || "var(--accent)" }}>
              {index + 1} → · {index + 1} of {total}
            </p>
            <textarea
              className="questiontitle"
              value={question.title}
              readOnly={readOnly}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="Type your question"
            />
            <textarea
              className="description"
              value={question.description}
              readOnly={readOnly}
              onChange={(event) => onChange({ description: event.target.value })}
              placeholder="Add a description (optional)"
            />
            <div className="canvasanswer">
              <QuestionPreview question={question} />
            </div>
            <button type="button" className="ok" onClick={goNext}>
              OK <kbd>↵</kbd>
            </button>
          </>
        )}
      </div>
      <p className="canvascaption">Live preview — this is how respondents will see it</p>
      <QuestionNav onPrev={goPrev} onNext={goNext} prevDisabled={!showingThanks && index === 0} nextDisabled={showingThanks} />
    </section>
  );
}
