"use client";

import { useCallback, useEffect, useState } from "react";

import { canEditForms } from "@/lib/access";
import { formsApi } from "@/lib/api";
import { createQuestion } from "@/lib/constants";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { FormTemplate, templateCreatePayload } from "@/lib/templates";
import { FormDefinition } from "@/lib/types";
import { useCurrentUser } from "./useCurrentUser";
import { useToast } from "./useToast";

export function useForms() {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const { toast, showToast, flashToast } = useToast();
  const { actor, current } = useCurrentUser();
  const canEdit = canEditForms(current);

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
    if (!canEdit) {
      showToast(MESSAGES.viewOnly, "error");
      return;
    }
    try {
      await action();
      showToast(ok);
      await load();
    } catch (err) {
      showToast(messageFromUnknown(err), "error");
    }
  }

  async function createForm() {
    if (!canEdit) {
      showToast(MESSAGES.viewOnly, "error");
      return;
    }
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

  async function createFromTemplate(template: FormTemplate) {
    if (!canEdit) {
      showToast(MESSAGES.viewOnly, "error");
      return;
    }
    if (creatingTemplateId) return;
    setCreatingTemplateId(template.id);
    try {
      const form = await formsApi.create(templateCreatePayload(template, actor));
      flashToast("Created from template");
      window.location.href = `/builder/${form.id}`;
    } catch (err) {
      setCreatingTemplateId(null);
      showToast(messageFromUnknown(err, MESSAGES.formCreateFailed), "error");
    }
  }

  return {
    forms,
    loading,
    error,
    toast,
    canEdit,
    creatingTemplateId,
    createForm,
    createFromTemplate,
    renameForm,
    duplicateForm,
    togglePublish,
    deleteForm,
    copyLink,
  };
}
