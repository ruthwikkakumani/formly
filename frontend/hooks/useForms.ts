"use client";

import { useCallback, useEffect, useState } from "react";

import { apiBase, formsApi } from "@/lib/api";
import { createQuestion } from "@/lib/constants";
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
    } catch {
      setError(`Can't reach API at ${apiBase()}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createForm() {
    const form = await formsApi.create({
      title: "Untitled form",
      questions: [createQuestion("short_text")],
      ...actor,
    });
    window.location.href = `/builder/${form.id}`;
  }

  async function renameForm(id: number, title: string) {
    await formsApi.rename(id, title, actor);
    showToast("Form renamed");
    await load();
  }

  async function duplicateForm(id: number) {
    await formsApi.duplicate(id);
    showToast("Form duplicated");
    await load();
  }

  async function togglePublish(form: FormDefinition) {
    await formsApi.togglePublish(form.id, actor);
    showToast(form.status === "draft" ? "Form published" : "Form unpublished");
    await load();
  }

  async function deleteForm(id: number) {
    await formsApi.remove(id);
    showToast("Form deleted");
    await load();
  }

  async function copyLink(slug: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`);
    showToast("Share link copied");
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
  };
}
