"use client";

import { useCallback, useState } from "react";

import { ToastTone } from "@/components/shared/Toast";

export function useToast(duration = 2400) {
  const [toast, setToast] = useState({ message: "", tone: "ok" as ToastTone });

  const showToast = useCallback(
    (message: string, tone: ToastTone = "ok") => {
      setToast({ message, tone });
      window.setTimeout(() => setToast({ message: "", tone: "ok" }), tone === "error" ? 5600 : duration);
    },
    [duration],
  );

  return { toast, showToast };
}
