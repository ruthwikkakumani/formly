import { FormDefinition } from "./types";

export type FillStep = "welcome" | "question" | "thanks";

export type FillDraft = {
  visitorId: string;
  answers: Record<number, string>;
  index: number;
  step: FillStep;
};

function storageKey(slug: string) {
  return `formly.fill.${slug}`;
}

function thanksKey(slug: string) {
  return `formly.thanks.${slug}`;
}

function asAnswers(value: unknown): Record<number, string> {
  if (!value || typeof value !== "object") return {};
  const next: Record<number, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const id = Number(key);
    if (!Number.isFinite(id)) continue;
    next[id] = item == null ? "" : String(item);
  }
  return next;
}

export function readFillDraft(slug: string): FillDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FillDraft>;
    const visitorId = typeof parsed.visitorId === "string" ? parsed.visitorId.trim() : "";
    if (!visitorId) return null;
    const step: FillStep =
      parsed.step === "question" || parsed.step === "thanks" || parsed.step === "welcome" ? parsed.step : "welcome";
    return {
      visitorId,
      answers: asAnswers(parsed.answers),
      index: Number.isFinite(Number(parsed.index)) ? Math.max(0, Number(parsed.index)) : 0,
      step,
    };
  } catch {
    return null;
  }
}

export function writeFillDraft(slug: string, draft: FillDraft) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(draft));
  } catch {
    /* private mode */
  }
}

export function clearFillDraft(slug: string) {
  try {
    localStorage.removeItem(storageKey(slug));
  } catch {
    /* private mode */
  }
}

export function visitorIdFor(slug: string): string {
  const existing = readFillDraft(slug)?.visitorId;
  if (existing) return existing;
  const visitorId = crypto.randomUUID();
  writeFillDraft(slug, { visitorId, answers: {}, index: 0, step: "welcome" });
  return visitorId;
}

export function markFillThanks(slug: string) {
  try {
    sessionStorage.setItem(thanksKey(slug), "1");
  } catch {
    /* private mode */
  }
  clearFillDraft(slug);
}

export function hasFillThanks(slug: string): boolean {
  try {
    return sessionStorage.getItem(thanksKey(slug)) === "1";
  } catch {
    return false;
  }
}

export function clampFillIndex(form: FormDefinition, index: number) {
  const last = Math.max(0, form.questions.length - 1);
  return Math.min(last, Math.max(0, index));
}

export function resumeFill(form: FormDefinition, draft: FillDraft | null, remoteAnswers: Record<number, string>) {
  const answers = { ...remoteAnswers, ...(draft?.answers || {}) };
  const known = new Set(form.questions.map((question) => question.id).filter((id): id is number => Boolean(id)));
  for (const id of Object.keys(answers)) {
    if (!known.has(Number(id))) delete answers[Number(id)];
  }
  const hasAnswers = Object.values(answers).some((value) => String(value || "").trim());
  if (!draft && !hasAnswers) {
    return { answers, index: 0, step: "welcome" as const };
  }
  const index = clampFillIndex(form, draft?.index ?? 0);
  const step: FillStep = draft?.step === "thanks" ? "thanks" : hasAnswers || draft?.step === "question" ? "question" : "welcome";
  return { answers, index: step === "welcome" ? 0 : index, step };
}
