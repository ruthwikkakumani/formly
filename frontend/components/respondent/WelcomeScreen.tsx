import { FormDefinition } from "@/lib/types";

export function WelcomeScreen({ form, onStart }: { form: FormDefinition; onStart: () => void }) {
  return (
    <div className="welcome">
      <p className="brand">
        formly<span>•</span>
      </p>
      <h1>{form.title}</h1>
      <p>{form.description || "A few questions. Honest answers. That’s it."}</p>
      <button onClick={onStart}>
        Start <kbd>↵</kbd>
      </button>
    </div>
  );
}
