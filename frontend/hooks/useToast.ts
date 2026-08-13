"use client";

import { useCallback, useEffect, useState } from "react";

import { ToastTone } from "@/components/shared/Toast";

const FLASH_KEY = "formly-flash";

export function useToast(duration = 2400) {
  const [toast, setToast] = useState({ message: "", tone: "ok" as ToastTone });

  const showToast = useCallback(
    (message: string, tone: ToastTone = "ok") => {
      setToast({ message, tone });
      window.setTimeout(() => setToast({ message: "", tone: "ok" }), tone === "error" ? 5600 : duration);
    },
    [duration],
  );

  const flashToast = useCallback((message: string) => {
    try {
      sessionStorage.setItem(FLASH_KEY, message);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  useEffect(() => {
    try {
      const flash = sessionStorage.getItem(FLASH_KEY);
      if (!flash) return;
      sessionStorage.removeItem(FLASH_KEY);
      showToast(flash);
    } catch {
      /* ignore */
    }
  }, [showToast]);

  return { toast, showToast, flashToast };
}
