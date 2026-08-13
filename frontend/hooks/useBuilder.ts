"use client";

import { useEffect, useRef, useState } from "react";

import { formsApi } from "@/lib/api";
import { createQuestion } from "@/lib/constants";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { FormActivity, FormDefinition, FormEditor, Question, QuestionType } from "@/lib/types";
import { useCurrentUser } from "./useCurrentUser";
import { useToast } from "./useToast";

export function useBuilder(id: string) {
  const [form, setForm] = useState<FormDefinition>();
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"Build" | "Results" | "Settings">("Build");
  const [editors, setEditors] = useState<FormEditor[]>([]);
  const [activity, setActivity] = useState<FormActivity[]>([]);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();
  const { actor, current } = useCurrentUser();
  const loadedAt = useRef("");
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  useEffect(() => {
    void formsApi
      .get(id)
      .then((payload) => {
        setForm(payload);
        loadedAt.current = payload.updated_at || "";
        setError("");
      })
      .catch((err: unknown) => setError(messageFromUnknown(err, MESSAGES.formUnavailable)));
    void formsApi.activity(id).then(setActivity).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (!current) return;
    const tick = () => {
      void formsApi.heartbeat(id, actor).then(setEditors).catch(() => undefined);
      void formsApi
        .get(id)
        .then((remote) => {
          const remoteStamp = remote.updated_at || "";
          if (remoteStamp && remoteStamp !== loadedAt.current && !dirtyRef.current) {
            setForm(remote);
            loadedAt.current = remoteStamp;
            showToast(`${remote.updated_by || "A teammate"} just saved — live update applied`);
            void formsApi.activity(id).then(setActivity);
          } else if (remoteStamp !== loadedAt.current && dirtyRef.current) {
            showToast(`${remote.updated_by || "A teammate"} saved a newer version. Save yours or reload.`);
          }
        })
        .catch(() => undefined);
    };
    tick();
    const timer = window.setInterval(tick, 4000);
    return () => window.clearInterval(timer);
  }, [id, current?.email, actor.actor_email, actor.actor_name, showToast]);

  const change = (patch: Partial<FormDefinition>) => {
    if (!form) return;
    setDirty(true);
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
    try {
      const saved = await formsApi.update(id, { ...form, ...actor });
      setForm(saved);
      loadedAt.current = saved.updated_at || "";
      setDirty(false);
      setActivity(await formsApi.activity(id));
      showToast(`Saved by ${current?.name || "you"}`);
    } catch (err) {
      showToast(messageFromUnknown(err, MESSAGES.formSaveFailed), "error");
      throw err;
    }
  }

  async function publish() {
    if (!form) return;
    try {
      if (dirtyRef.current) await save();
      const next = await formsApi.togglePublish(id, actor);
      setForm(next);
      loadedAt.current = next.updated_at || "";
      setActivity(await formsApi.activity(id));
      showToast(form.status === "draft" ? "Your form is live" : "Form unpublished");
    } catch (err) {
      showToast(messageFromUnknown(err, MESSAGES.publishFailed), "error");
    }
  }

  async function copyLink() {
    if (!form) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`);
      showToast("Share link copied");
    } catch {
      showToast(MESSAGES.copyFailed, "error");
    }
  }

  return {
    form,
    error,
    selected,
    setSelected,
    tab,
    setTab,
    toast,
    editors,
    activity,
    current,
    dirty,
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
