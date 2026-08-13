"use client";

import { useEffect, useState } from "react";

import { authApi, teamApi } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { WorkspaceMember } from "@/lib/types";

export function useCurrentUser() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [current, setCurrent] = useState<WorkspaceMember>();
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    void Promise.all([authApi.me(), teamApi.list()])
      .then(([user, list]) => {
        setCurrent(user);
        setMembers(list);
        setError("");
      })
      .catch((err: Error) => {
        setError(err.message);
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
