"use client";

import { useEffect, useState } from "react";

import { formsApi } from "@/lib/api";
import { createQuestion } from "@/lib/constants";
import { FormDefinition, Question, QuestionType } from "@/lib/types";
import { useToast } from "./useToast";

export function useBuilder(id: string) {
  const [form, setForm] = useState<FormDefinition>();
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"Build" | "Results" | "Settings">("Build");
  const { toast, showToast } = useToast();

  useEffect(() => {
    void formsApi.get(id).then(setForm);
  }, [id]);

  const change = (patch: Partial<FormDefinition>) => {
    if (!form) return;
    setForm({ ...form, ...patch });
  };

  const changeQuestion = (patch: Partial<Question>) => {
    if (!form) return;
    const questions = form.questions.map((question, index) =>
      index === selected ? { ...question, ...patch } : question,
    );
    change({ questions });
  };

  const addQuestion = (type: QuestionType = "short_text") => {
    if (!form) return;
    const questions = [...form.questions, createQuestion(type)];
    change({ questions });
    setSelected(questions.length - 1);
  };

  const reorder = (from: number, to: number) => {
    if (!form || from === to || to < 0 || to >= form.questions.length) return;
    const questions = [...form.questions];
    const [item] = questions.splice(from, 1);
    questions.splice(to, 0, item);
    change({ questions });
    setSelected(to);
  };

  const removeQuestion = () => {
    if (!form) return;
    if (form.questions.length === 1) {
      showToast("A form needs at least one question");
      return;
    }
    change({ questions: form.questions.filter((_, index) => index !== selected) });
    setSelected(Math.max(0, selected - 1));
  };

  async function save() {
    if (!form) return;
    setForm(await formsApi.update(id, form));
    showToast("All changes saved");
  }

  async function publish() {
    if (!form) return;
    const next = await formsApi.togglePublish(id);
    setForm(next);
    showToast(form.status === "draft" ? "Your form is live" : "Form unpublished");
  }

  async function copyLink() {
    if (!form) return;
    await navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`);
    showToast("Share link copied");
  }

  return {
    form,
    selected,
    setSelected,
    tab,
    setTab,
    toast,
    change,
    changeQuestion,
    addQuestion,
    reorder,
    removeQuestion,
    save,
    publish,
    copyLink,
  };
}
