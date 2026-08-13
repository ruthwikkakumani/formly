"use client";

import { useCallback, useEffect, useState } from "react";

import { authApi, teamApi } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { isTransientError, isUnauthorizedError, MESSAGES, messageFromUnknown } from "@/lib/errors";
import { WorkspaceMember } from "@/lib/types";

const USER_CACHE_KEY = "formly-user";
const RETRY_DELAYS_MS = [2_000, 4_000];

function readCachedUser(): WorkspaceMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceMember;
    if (parsed && typeof parsed === "object" && typeof parsed.email === "string" && parsed.email) return parsed;
  } catch {
    return null;
  }
  return null;
}

function writeCachedUser(user: WorkspaceMember | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    window.sessionStorage.removeItem(USER_CACHE_KEY);
    return;
  }
  window.sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useCurrentUser() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [current, setCurrent] = useState<WorkspaceMember | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [sessionInvalid, setSessionInvalid] = useState(false);

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setCurrent(null);
      setError("");
      setSessionInvalid(true);
      setReady(true);
      return;
    }

    setReady(false);
    setError("");
    setSessionInvalid(false);

    const attempts = RETRY_DELAYS_MS.length + 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
      try {
        const user = await authApi.me();
        setCurrent(user);
        writeCachedUser(user);
        setError("");
        setSessionInvalid(false);
        setReady(true);
        void teamApi
          .list()
          .then((list) => setMembers(Array.isArray(list) ? list : []))
          .catch(() => setMembers([]));
        return;
      } catch (err: unknown) {
        if (isUnauthorizedError(err)) {
          writeCachedUser(null);
          clearToken();
          setCurrent(null);
          setError(messageFromUnknown(err, MESSAGES.sessionExpired));
          setSessionInvalid(true);
          setReady(true);
          return;
        }
        if (!isTransientError(err)) break;
      }
    }

    const cached = readCachedUser();
    if (cached) {
      setCurrent(cached);
      setError(MESSAGES.workspaceUnreachable);
      setSessionInvalid(false);
      setReady(true);
      return;
    }

    setCurrent(null);
    setError(MESSAGES.workspaceUnreachable);
    setSessionInvalid(false);
    setReady(true);
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  function logout() {
    writeCachedUser(null);
    clearToken();
    window.location.href = "/login";
  }

  return {
    members,
    current,
    error,
    ready,
    sessionInvalid,
    retry: loadUser,
    logout,
    actor: {
      actor_name: current?.name || "",
      actor_email: current?.email || "",
    },
  };
}
