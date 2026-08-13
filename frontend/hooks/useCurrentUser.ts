"use client";

import { useEffect, useState } from "react";

import { authApi, teamApi } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { MESSAGES, messageFromUnknown } from "@/lib/errors";
import { WorkspaceMember } from "@/lib/types";

export function useCurrentUser() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [current, setCurrent] = useState<WorkspaceMember | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setCurrent(null);
      setReady(true);
      return;
    }
    void Promise.all([authApi.me(), teamApi.list()])
      .then(([user, list]) => {
        setCurrent(user);
        setMembers(list);
        setError("");
      })
      .catch((err: unknown) => {
        setCurrent(null);
        setError(messageFromUnknown(err, MESSAGES.unauthenticated));
        clearToken();
      })
      .finally(() => setReady(true));
  }, []);

  function logout() {
    clearToken();
    window.location.href = "/login";
  }

  return {
    members,
    current,
    error,
    ready,
    logout,
    actor: {
      actor_name: current?.name || "",
      actor_email: current?.email || "",
    },
  };
}
