"use client";

import { useEffect, useRef } from "react";

import { Question } from "@/lib/types";

export function OptionEditor({
  question,
  onChange,
}: {
  question: Question;
  onChange: (options: string[]) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const focusAt = useRef<number | null>(null);

  useEffect(() => {
    if (focusAt.current == null) return;
    const input = listRef.current?.querySelectorAll("input")[focusAt.current];
    focusAt.current = null;
    if (!(input instanceof HTMLInputElement)) return;
    input.focus();
    input.select();
    input.scrollIntoView({ block: "nearest" });
  }, [question.options.length]);

  return (
    <div className="qoptions">
      <span className="qlabel">Options</span>
      <ul className="qoptionlist" ref={listRef}>
        {question.options.map((option, index) => (
          <li className="qoptionrow" key={index}>
            <input
              value={option}
              aria-label={`Option ${index + 1}`}
              onChange={(event) => {
                const options = [...question.options];
                options[index] = event.target.value;
                onChange(options);
              }}
            />
            {question.options.length > 2 && (
              <button
                type="button"
                className="qoptionremove"
                onClick={() => onChange(question.options.filter((_, optionIndex) => optionIndex !== index))}
                aria-label="Remove option"
              >
                ×
              </button>
            )}
          </li>
        ))}
        <li className="qoptionrow is-add">
          <button
            type="button"
            className="qadd"
            onClick={() => {
              focusAt.current = question.options.length;
              onChange([...question.options, `Option ${question.options.length + 1}`]);
            }}
          >
            + Add option
          </button>
        </li>
      </ul>
    </div>
  );
}
