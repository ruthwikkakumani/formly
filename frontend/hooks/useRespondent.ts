"use client";

import { useEffect, useRef, useState } from "react";

import { apiBase, publicFormsApi } from "@/lib/api";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import {
  FillDraft,
  FillStep,
  clearFillDraft,
  hasFillThanks,
  markFillThanks,
  readFillDraft,
  resumeFill,
  visitorIdFor,
  writeFillDraft,
} from "@/lib/fillDraft";
import { FormDefinition, Question } from "@/lib/types";
import { nextIndex, validateAnswer } from "@/lib/validation";

type Step = "loading" | "error" | FillStep;

const PARTIAL_SAVE_MS = 280;
const NAV_GUARD_MS = 500;

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;
  const type = ((el as HTMLInputElement).type || "text").toLowerCase();
  return !["button", "submit", "checkbox", "radio", "file", "hidden"].includes(type);
}

function asPartialAnswers(answers: Record<number, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(answers).map(([id, value]) => [String(id), value]));
}

function remoteAnswers(payload?: { answers?: Record<string, string> } | null): Record<number, string> {
  const next: Record<number, string> = {};
  for (const [key, value] of Object.entries(payload?.answers || {})) {
    const id = Number(key);
    if (Number.isFinite(id)) next[id] = value == null ? "" : String(value);
  }
  return next;
}

export function useRespondent(slug: string) {
  const [form, setForm] = useState<FormDefinition>();
  const [step, setStep] = useState<Step>("loading");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [visitorId] = useState(() => visitorIdFor(slug));
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const stepRef = useRef(step);
  stepRef.current = step;
  const indexRef = useRef(index);
  indexRef.current = index;
  const formRef = useRef(form);
  formRef.current = form;
  const navGuardUntil = useRef(0);
  const partialTimer = useRef<number>(0);
  const partialAbort = useRef<AbortController | null>(null);
  const submitGen = useRef(0);

  const persist = (patch: Partial<FillDraft> = {}) => {
    const nextStep = patch.step || (stepRef.current === "thanks" ? "thanks" : stepRef.current === "question" ? "question" : "welcome");
    writeFillDraft(slug, {
      visitorId,
      answers: patch.answers || answersRef.current,
      index: patch.index ?? indexRef.current,
      step: nextStep,
    });
  };

  const flushRemote = (next = answersRef.current) => {
    const payload = JSON.stringify({ visitor_id: visitorId, answers: asPartialAnswers(next) });
    void fetch(`${apiBase()}/public/${encodeURIComponent(slug)}/partial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  };

  const queuePartialSave = (next: Record<number, string>) => {
    persist({ answers: next, step: stepRef.current === "question" ? "question" : "welcome" });
    window.clearTimeout(partialTimer.current);
    partialTimer.current = window.setTimeout(() => {
      partialAbort.current?.abort();
      const controller = new AbortController();
      partialAbort.current = controller;
      void publicFormsApi
        .savePartial(slug, { visitor_id: visitorId, answers: asPartialAnswers(next) }, controller.signal)
        .catch(() => undefined);
    }, PARTIAL_SAVE_MS);
  };

  useEffect(() => {
    let cancelled = false;
    const draft = readFillDraft(slug);
    const showThanks = hasFillThanks(slug);
    Promise.all([
      publicFormsApi.get(slug),
      draft?.visitorId ? publicFormsApi.getPartial(slug, draft.visitorId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([payload, remote]) => {
        if (cancelled) return;
        setForm(payload);
        setError("");
        if (showThanks) {
          setStep("thanks");
          return;
        }
        const resumed = resumeFill(payload, draft, remoteAnswers(remote));
        answersRef.current = resumed.answers;
        indexRef.current = resumed.index;
        stepRef.current = resumed.step;
        setAnswers(resumed.answers);
        setIndex(resumed.index);
        setStep(resumed.step);
        persist({ answers: resumed.answers, index: resumed.index, step: resumed.step });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(messageFromUnknown(err, MESSAGES.formUnavailable));
        setStep("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const onHide = () => {
      window.clearTimeout(partialTimer.current);
      persist();
      flushRemote();
    };
    const onVisible = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(partialTimer.current);
      partialAbort.current?.abort();
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [slug, visitorId]);

  const question = form?.questions[index];
  const questionRef = useRef(question);
  questionRef.current = question;

  const setAnswer = (value: string) => {
    const current = questionRef.current;
    if (!current?.id) return;
    const next = { ...answersRef.current, [current.id]: value };
    answersRef.current = next;
    setAnswers(next);
    setError("");
    if (stepRef.current !== "question") {
      stepRef.current = "question";
      setStep("question");
    }
    queuePartialSave(next);
  };

  async function submitAll() {
    const gen = ++submitGen.current;
    window.clearTimeout(partialTimer.current);
    partialAbort.current?.abort();
    persist({ step: "question" });
    flushRemote();
    try {
      await publicFormsApi.submit(slug, {
        visitor_id: visitorId,
        answers: Object.entries(answersRef.current).map(([question_id, value]) => ({
          question_id: Number(question_id),
          value,
        })),
      });
      if (gen !== submitGen.current) return;
      markFillThanks(slug);
      clearFillDraft(slug);
      setStep("thanks");
    } catch (err) {
      if (gen !== submitGen.current) return;
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
    indexRef.current = Math.max(0, next);
    stepRef.current = "question";
    setIndex(indexRef.current);
    setStep("question");
    persist({ index: indexRef.current, step: "question" });
    flushRemote();
  };

  const advance = () => {
    const currentStep = stepRef.current;
    if (currentStep === "welcome") {
      navGuardUntil.current = Date.now() + NAV_GUARD_MS;
      setDirection("up");
      stepRef.current = "question";
      indexRef.current = 0;
      setStep("question");
      setIndex(0);
      persist({ step: "question", index: 0 });
      return;
    }
    if (Date.now() < navGuardUntil.current) return;
    const currentForm = formRef.current;
    const currentQuestion = questionRef.current;
    if (!currentForm || !currentQuestion) return;
    const value = currentQuestion.id ? answersRef.current[currentQuestion.id] || "" : "";
    const message = validateAnswer(currentQuestion, value);
    if (message) {
      setError(message);
      return;
    }
    moveTo(nextIndex(currentForm.questions, indexRef.current, value), "up", currentForm.questions);
  };

  const back = () => {
    if (stepRef.current !== "question" || indexRef.current === 0) return;
    if (Date.now() < navGuardUntil.current) return;
    setDirection("down");
    indexRef.current = indexRef.current - 1;
    setIndex(indexRef.current);
    persist({ index: indexRef.current, step: "question" });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const currentStep = stepRef.current;
      if (currentStep === "error" || currentStep === "thanks" || currentStep === "loading") return;
      if (event.repeat) return;
      const currentQuestion = questionRef.current;
      const typing = isTypingTarget(event.target);
      if (event.key === "Enter") {
        if (currentStep === "welcome") {
          event.preventDefault();
          advance();
          return;
        }
        if (currentQuestion?.type === "long_text" && !event.metaKey && !event.ctrlKey) return;
        if ((event.target as HTMLInputElement | null)?.type === "file") return;
        event.preventDefault();
        advance();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        if (typing) return;
        event.preventDefault();
        advance();
        return;
      }
      if (currentStep === "question" && (event.key === "ArrowLeft" || event.key === "ArrowUp")) {
        if (typing) return;
        event.preventDefault();
        back();
        return;
      }
      if (
        typing ||
        !currentQuestion ||
        !["multiple_choice", "yes_no"].includes(currentQuestion.type) ||
        !/^[a-z]$/i.test(event.key)
      ) {
        return;
      }
      const options = currentQuestion.type === "yes_no" ? ["Yes", "No"] : currentQuestion.options;
      const choice = options[event.key.toUpperCase().charCodeAt(0) - 65];
      if (choice) setAnswer(choice);
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
