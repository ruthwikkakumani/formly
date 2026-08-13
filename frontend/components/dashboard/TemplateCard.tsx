"use client";

import { QUESTION_TYPES } from "@/lib/constants";
import { FormTemplate } from "@/lib/templates";

export function TemplateCard({
  template,
  busy,
  creating,
  canUse = true,
  onUse,
}: {
  template: FormTemplate;
  busy: boolean;
  creating: boolean;
  canUse?: boolean;
  onUse: (template: FormTemplate) => void;
}) {
  const types = [...new Set(template.questions.map((question) => question.type))];
  const labels = types
    .map((type) => QUESTION_TYPES.find((item) => item.value === type)?.label)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <article className="formcard tmplcard">
      <button className="tmplhit" type="button" disabled={busy || !canUse} onClick={() => onUse(template)}>
        <div className="cardpreview" style={{ background: `${template.accent}14`, color: template.accent }}>
          {template.questions[0]?.title || "Starter questions"}
        </div>
        <h2>{template.title}</h2>
        <p>{template.description}</p>
        <div className="tmplchips">
          {labels.map((label) => (
            <span className="tmplchip" key={label}>
              {label}
            </span>
          ))}
        </div>
      </button>
      <footer>
        <span>{template.questions.length} questions</span>
        <button type="button" disabled={busy || !canUse} onClick={() => onUse(template)}>
          {creating ? "Creating…" : canUse ? "Use template" : "View only"}
        </button>
      </footer>
    </article>
  );
}
