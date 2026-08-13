"use client";

import { useEffect, useRef, useState } from "react";

import { isViewer } from "@/lib/access";
import { formsApi } from "@/lib/api";
import { createQuestion } from "@/lib/constants";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { FormActivity, FormDefinition, FormEditor, FormResults, Question, QuestionType } from "@/lib/types";
import { useCurrentUser } from "./useCurrentUser";
import { useToast } from "./useToast";

export function useBuilder(id: string, initialTab: "Build" | "Results" | "Settings" = "Build") {
  const [form, setForm] = useState<FormDefinition>();
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"Build" | "Results" | "Settings">(initialTab);
  const [editors, setEditors] = useState<FormEditor[]>([]);
  const [activity, setActivity] = useState<FormActivity[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FormResults>();
  const { toast, showToast } = useToast();
  const { actor, current } = useCurrentUser();
  const readOnly = isViewer(current);
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
    void formsApi.results(id).then(setResults).catch(() => undefined);
  }, [id]);

  useEffect(() => {
    const email = (current?.email || actor.actor_email || "").trim();
    if (!email) return;
    const presenceActor = {
      actor_name: current?.name || actor.actor_name || "",
      actor_email: email,
    };
    const tick = () => {
      if (current?.role === "viewer") {
        void formsApi.editors(id).then(setEditors).catch(() => undefined);
      } else {
        void formsApi.heartbeat(id, presenceActor).then(setEditors).catch(() => undefined);
      }
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
    const leave = () => {
      void formsApi.leave(id);
    };
    tick();
    const timer = window.setInterval(tick, 4000);
    window.addEventListener("beforeunload", leave);
    window.addEventListener("pagehide", leave);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [id, current?.email, current?.name, current?.role, actor.actor_email, actor.actor_name, showToast]);

  const change = (patch: Partial<FormDefinition>) => {
    if (!form || readOnly) return;
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
    if (!form || readOnly) return;
    const questions = [...form.questions, createQuestion(type)];
    change({ questions });
    setSelected(questions.length - 1);
  };

  const reorder = (from: number, to: number) => {
    if (!form || readOnly || from === to || to < 0 || to >= form.questions.length) return;
    const questions = [...form.questions];
    const [item] = questions.splice(from, 1);
    questions.splice(to, 0, item);
    change({ questions });
    setSelected(to);
  };

  const removeQuestion = () => {
    if (!form || readOnly) return;
    if (form.questions.length === 1) {
      showToast("A form needs at least one question");
      return;
    }
    change({ questions: form.questions.filter((_, index) => index !== selected) });
    setSelected(Math.max(0, selected - 1));
  };

  async function save() {
    if (!form) return;
    if (readOnly) {
      showToast(MESSAGES.viewOnly, "error");
      return;
    }
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!form) return;
    if (readOnly) {
      showToast(MESSAGES.viewOnly, "error");
      return;
    }
    setPublishing(true);
    try {
      if (dirtyRef.current) await save();
      const next = await formsApi.togglePublish(id, actor);
      setForm(next);
      loadedAt.current = next.updated_at || "";
      setActivity(await formsApi.activity(id));
      showToast(form.status === "draft" ? "Your form is live" : "Form unpublished");
    } catch (err) {
      showToast(messageFromUnknown(err, MESSAGES.publishFailed), "error");
    } finally {
      setPublishing(false);
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
    results,
    selected,
    setSelected,
    tab,
    setTab,
    toast,
    editors,
    activity,
    current,
    readOnly,
    dirty,
    saving,
    publishing,
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
