"use client";

import { FORM_TEMPLATES, FormTemplate } from "@/lib/templates";
import { TemplateCard } from "./TemplateCard";

export function TemplatesGallery({
  creatingId,
  onUse,
}: {
  creatingId: string | null;
  onUse: (template: FormTemplate) => void;
}) {
  return (
    <section className="formgrid">
      {FORM_TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          busy={Boolean(creatingId)}
          creating={creatingId === template.id}
          onUse={onUse}
        />
      ))}
    </section>
  );
}
