"use client";

import { useEffect, useRef } from "react";

import { FormDefinition } from "@/lib/types";

export function WelcomeScreen({ form, onStart }: { form: FormDefinition; onStart: () => void }) {
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    startRef.current?.focus();
  }, []);

  return (
    <div className="welcome">
      <p className="brand">
        formly<span>•</span>
      </p>
      <h1>{form.title}</h1>
      <p>{form.description || "A few questions. Honest answers. That’s it."}</p>
      <button ref={startRef} type="button" onClick={onStart}>
        Start <kbd>↵</kbd>
      </button>
    </div>
  );
}
