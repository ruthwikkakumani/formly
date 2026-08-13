"use client";

import { useEffect, useRef, useState } from "react";

import { publicFormsApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { FormDefinition, Question } from "@/lib/types";
import { nextIndex, validateAnswer } from "@/lib/validation";

type Step = "loading" | "error" | "welcome" | "question" | "thanks";

export function useRespondent(slug: string) {
  const [form, setForm] = useState<FormDefinition>();
  const [step, setStep] = useState<Step>("loading");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [visitorId] = useState(() => crypto.randomUUID());
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    publicFormsApi
      .get(slug)
      .then((payload) => {
        setForm(payload);
        setStep("welcome");
      })
      .catch((err: unknown) => {
        setError(messageFromUnknown(err, MESSAGES.formUnavailable));
        setStep("error");
      });
  }, [slug]);

  const question = form?.questions[index];

  const setAnswer = (value: string) => {
    if (!question?.id) return;
    const next = { ...answersRef.current, [question.id]: value };
    answersRef.current = next;
    setAnswers(next);
    setError("");
    void publicFormsApi.savePartial(slug, { visitor_id: visitorId, answers: next }).catch(() => undefined);
  };

  async function submitAll() {
    try {
      await publicFormsApi.submit(slug, {
        visitor_id: visitorId,
        answers: Object.entries(answersRef.current).map(([question_id, value]) => ({
          question_id: Number(question_id),
          value,
        })),
      });
      setStep("thanks");
    } catch (err) {
      setError(messageFromUnknown(err));
    }
  }

  const moveTo = (next: number | "end", dir: "up" | "down", questions: Question[]) => {
    setDirection(dir);
    setError("");
    if (next === "end" || next >= questions.length) {
      void submitAll();
      return;
    }
    setIndex(Math.max(0, next));
    setStep("question");
  };

  const advance = () => {
    if (step === "welcome") {
      setDirection("up");
      setStep("question");
      setIndex(0);
      return;
    }
    if (!form || !question) return;
    const value = question.id ? answersRef.current[question.id] || "" : "";
    const message = validateAnswer(question, value);
    if (message) {
      setError(message);
      return;
    }
    moveTo(nextIndex(form.questions, index, value), "up", form.questions);
  };

  const back = () => {
    if (step !== "question" || index === 0) return;
    setDirection("down");
    setIndex(index - 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (step === "error" || step === "thanks" || step === "loading") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const inputType = (target as HTMLInputElement | null)?.type;
      const nativeArrows = tag === "SELECT" || tag === "TEXTAREA" || inputType === "number" || inputType === "file";
      if (event.key === "Enter") {
        if (question?.type === "long_text" && !event.metaKey && !event.ctrlKey) return;
        if (inputType === "file") return;
        event.preventDefault();
        advance();
        return;
      }
      if (event.key === "ArrowRight" || (event.key === "ArrowDown" && !nativeArrows)) {
        event.preventDefault();
        advance();
        return;
      }
      if (step === "question" && (event.key === "ArrowLeft" || (event.key === "ArrowUp" && !nativeArrows))) {
        event.preventDefault();
        back();
        return;
      }
      if (question && ["multiple_choice", "yes_no"].includes(question.type) && /^[a-z]$/i.test(event.key)) {
        const options = question.type === "yes_no" ? ["Yes", "No"] : question.options;
        const choice = options[event.key.toUpperCase().charCodeAt(0) - 65];
        if (choice) setAnswer(choice);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return {
    form,
    step,
    index,
    question,
    answers,
    error,
    direction,
    setAnswer,
    advance,
    back,
  };
}
