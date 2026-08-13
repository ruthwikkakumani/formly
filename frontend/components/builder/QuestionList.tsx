"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DropAnimation,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  defaultAnimateLayoutChanges,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState } from "react";

import { QUESTION_TYPES } from "@/lib/constants";
import { Question } from "@/lib/types";

const LAYOUT_MS = 380;

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

const dropAnimation: DropAnimation = {
  duration: LAYOUT_MS,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0" } },
  }),
};

function questionIcon(question: Question, index: number) {
  return QUESTION_TYPES.find((item) => item.value === question.type)?.icon || index + 1;
}

function SortableQuestion({
  id,
  question,
  index,
  selected,
  onSelect,
}: {
  id: string;
  question: Question;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    animateLayoutChanges,
    transition: { duration: LAYOUT_MS, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={[selected ? "selected" : "", isDragging ? "is-dragging" : ""].filter(Boolean).join(" ")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <small>{questionIcon(question, index)}</small>
      <span>{question.title || "Untitled question"}</span>
      <i className="draghandle">⠿</i>
    </button>
  );
}

function useSortableIds(questions: Question[]) {
  const draftIds = useRef(new Map<Question, string>());
  const seq = useRef(0);
  const live = new Set(questions);
  for (const key of draftIds.current.keys()) {
    if (!live.has(key)) draftIds.current.delete(key);
  }
  return questions.map((question) => {
    if (question.id != null) return `q-${question.id}`;
    const existing = draftIds.current.get(question);
    if (existing) return existing;
    const id = `draft-${seq.current++}`;
    draftIds.current.set(question, id);
    return id;
  });
}

export function QuestionList({
  questions,
  selected,
  readOnly = false,
  onSelect,
  onReorder,
  onAdd,
}: {
  questions: Question[];
  selected: number;
  readOnly?: boolean;
  onSelect: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
}) {
  const items = useSortableIds(questions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeIndex = activeId ? items.indexOf(activeId) : -1;
  const activeQuestion = activeIndex >= 0 ? questions[activeIndex] : null;

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = items.indexOf(String(active.id));
    const to = items.indexOf(String(over.id));
    if (from < 0 || to < 0 || from === to) return;
    onReorder(from, to);
  };

  if (readOnly) {
    return (
      <aside className="questionlist readonly">
        <p>CONTENT</p>
        {questions.map((question, index) => (
          <button
            type="button"
            className={selected === index ? "selected" : ""}
            key={items[index]}
            onClick={() => onSelect(index)}
          >
            <small>{questionIcon(question, index)}</small>
            <span>{question.title || "Untitled question"}</span>
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside className="questionlist">
      <p>CONTENT · DRAG TO REORDER</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {questions.map((question, index) => (
            <SortableQuestion
              key={items[index]}
              id={items[index]}
              question={question}
              index={index}
              selected={selected === index}
              onSelect={() => onSelect(index)}
            />
          ))}
        </SortableContext>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeQuestion ? (
            <div className="questionlist questionlist-overlay">
              <button type="button" className={selected === activeIndex ? "selected" : ""}>
                <small>{questionIcon(activeQuestion, activeIndex)}</small>
                <span>{activeQuestion.title || "Untitled question"}</span>
                <i className="draghandle">⠿</i>
              </button>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <button type="button" className="addline" onClick={onAdd}>
        + Add question
      </button>
    </aside>
  );
}
