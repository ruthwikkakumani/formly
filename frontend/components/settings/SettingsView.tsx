import { THEME_FONTS } from "@/lib/constants";
import { FormDefinition } from "@/lib/types";

export function SettingsView({
  form,
  readOnly = false,
  onChange,
  onSave,
}: {
  form: FormDefinition;
  readOnly?: boolean;
  onChange: (patch: Partial<FormDefinition>) => void;
  onSave: () => void;
}) {
  const theme = form.theme || {};
  const update = (key: string, value: string | boolean) => onChange({ theme: { ...theme, [key]: value } });

  return (
    <section className="settings">
      <h2>Settings</h2>
      <p>
        {readOnly
          ? "View only — ask the owner to make you an editor to change this form."
          : "Theme, thank-you screen, and integrations for this form."}
      </p>
      <fieldset className="settingsgrid" disabled={readOnly}>
        <article>
          <h3>Form details</h3>
          <p className="hint">Shown on the welcome screen and on your workspace cards.</p>
          <label className="stack">
            Description
            <textarea
              rows={5}
              value={form.description || ""}
              onChange={(event) => onChange({ description: event.target.value })}
              placeholder="A few questions. Honest answers."
            />
          </label>
          <button className="primary" onClick={onSave}>
            Save details
          </button>
        </article>
        <article>
          <h3>Theme</h3>
          <label>
            Background
            <input type="color" value={theme.background || "#f7f6f3"} onChange={(event) => update("background", event.target.value)} />
          </label>
          <label>
            Text color
            <input type="color" value={theme.color || "#191919"} onChange={(event) => update("color", event.target.value)} />
          </label>
          <label>
            Accent
            <input type="color" value={theme.accent || "#0445af"} onChange={(event) => update("accent", event.target.value)} />
          </label>
          <label>
            Font
            <select value={theme.font || "DM Sans"} onChange={(event) => update("font", event.target.value)}>
              {THEME_FONTS.map((font) => (
                <option value={font} key={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <label className="toggle">
            Dark response experience
            <input type="checkbox" checked={Boolean(theme.darkMode)} onChange={(event) => update("darkMode", event.target.checked)} />
          </label>
          <button className="primary" onClick={onSave}>
            Save theme
          </button>
        </article>
        <article>
          <h3>Thank-you screen</h3>
          <textarea
            value={theme.thankYou || "Your response has been submitted."}
            onChange={(event) => update("thankYou", event.target.value)}
          />
          <button className="primary" onClick={onSave}>
            Save message
          </button>
        </article>
        <article>
          <h3>Webhook / integration</h3>
          <p className="hint">We’ll POST each new response as JSON to this URL.</p>
          <input
            placeholder="https://example.com/hooks/formly"
            value={form.webhook_url || ""}
            onChange={(event) => onChange({ webhook_url: event.target.value })}
          />
          <button className="primary" onClick={onSave}>
            Save webhook
          </button>
        </article>
      </fieldset>
    </section>
  );
}
