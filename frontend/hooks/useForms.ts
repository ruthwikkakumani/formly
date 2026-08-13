"use client";

import { useCallback, useEffect, useState } from "react";

import { formsApi } from "@/lib/api";
import { createQuestion } from "@/lib/constants";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { FormDefinition } from "@/lib/types";
import { useCurrentUser } from "./useCurrentUser";
import { useToast } from "./useToast";

export function useForms() {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();
  const { actor } = useCurrentUser();

  const load = useCallback(async () => {
    try {
      setForms(await formsApi.list());
      setError("");
    } catch (err) {
      setError(messageFromUnknown(err, MESSAGES.formsLoadFailed));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<void>, ok: string) {
    try {
      await action();
      showToast(ok);
      await load();
    } catch (err) {
      showToast(messageFromUnknown(err), "error");
    }
  }

  async function createForm() {
    try {
      const form = await formsApi.create({
        title: "Untitled form",
        description: "",
        questions: [createQuestion("short_text")],
        ...actor,
      });
      window.location.href = `/builder/${form.id}`;
    } catch (err) {
      showToast(messageFromUnknown(err, MESSAGES.formCreateFailed), "error");
    }
  }

  async function renameForm(id: number, title: string) {
    await run(() => formsApi.rename(id, title, actor).then(() => undefined), "Form renamed");
  }

  async function duplicateForm(id: number) {
    await run(() => formsApi.duplicate(id).then(() => undefined), "Form duplicated");
  }

  async function togglePublish(form: FormDefinition) {
    await run(
      () => formsApi.togglePublish(form.id, actor).then(() => undefined),
      form.status === "draft" ? "Form published" : "Form unpublished",
    );
  }

  async function deleteForm(id: number) {
    await run(() => formsApi.remove(id).then(() => undefined), "Form deleted");
  }

  async function copyLink(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`);
      showToast("Share link copied");
    } catch {
      showToast(MESSAGES.copyFailed, "error");
    }
  }

  function templatesSoon() {
    showToast("Templates are coming soon");
  }

  return {
    forms,
    loading,
    error,
    toast,
    createForm,
    renameForm,
    duplicateForm,
    togglePublish,
    deleteForm,
    copyLink,
    templatesSoon,
  };
}
