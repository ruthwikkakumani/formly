"use client";

import { DragEvent, useState } from "react";

import { QUESTION_TYPES } from "@/lib/constants";
import { Question } from "@/lib/types";

export function QuestionList({
  questions,
  selected,
  onSelect,
  onReorder,
  onAdd,
}: {
  questions: Question[];
  selected: number;
  onSelect: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
}) {
  const [dragged, setDragged] = useState<number | null>(null);

  const onDrop = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (dragged !== null) onReorder(dragged, index);
    setDragged(null);
  };

  return (
    <aside className="questionlist">
      <p>CONTENT · DRAG TO REORDER</p>
      {questions.map((question, index) => (
        <button
          key={question.id ?? `new-${index}`}
          draggable
          onDragStart={() => setDragged(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDrop(event, index)}
          className={selected === index ? "selected" : ""}
          onClick={() => onSelect(index)}
        >
          <small>{QUESTION_TYPES.find((item) => item.value === question.type)?.icon || index + 1}</small>
          <span>{question.title || "Untitled question"}</span>
          <i className="draghandle">⠿</i>
        </button>
      ))}
      <button className="addline" onClick={onAdd}>
        + Add question
      </button>
    </aside>
  );
}
