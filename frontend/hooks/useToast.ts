"use client";

import { useCallback, useState } from "react";

export function useToast(duration = 2400) {
  const [toast, setToast] = useState("");

  const showToast = useCallback(
    (message: string) => {
      setToast(message);
      window.setTimeout(() => setToast(""), duration);
    },
    [duration],
  );

  return { toast, showToast };
}
