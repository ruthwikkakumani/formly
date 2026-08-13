"use client";

import { useMemo } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { FORM_TEMPLATES, FormTemplate } from "@/lib/templates";
import { TemplateCard } from "./TemplateCard";

export function TemplatesGallery({
  query = "",
  creatingId,
  canUse = true,
  onUse,
}: {
  query?: string;
  creatingId: string | null;
  canUse?: boolean;
  onUse: (template: FormTemplate) => void;
}) {
  const templates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return FORM_TEMPLATES;
    return FORM_TEMPLATES.filter((template) => template.title.toLowerCase().includes(needle));
  }, [query]);

  if (!templates.length) {
    return (
      <EmptyState
        title="No matching templates"
        body="No template names match that search. Try another keyword or clear the field."
      />
    );
  }

  return (
    <section className="formgrid">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          busy={Boolean(creatingId) || !canUse}
          creating={creatingId === template.id}
          canUse={canUse}
          onUse={onUse}
        />
      ))}
    </section>
  );
}
