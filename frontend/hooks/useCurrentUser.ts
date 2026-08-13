"use client";

import { useEffect, useState } from "react";

import { apiBase, teamApi } from "@/lib/api";
import { WorkspaceMember } from "@/lib/types";

const KEY = "formly-current-user";

export function useCurrentUser() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [current, setCurrent] = useState<WorkspaceMember>();
  const [error, setError] = useState("");

  useEffect(() => {
    void teamApi
      .list()
      .then((list) => {
        setMembers(list);
        setError("");
        const saved = sessionStorage.getItem(KEY);
        setCurrent(list.find((member) => member.email === saved) || list[0]);
      })
      .catch(() => {
        setError(`Can't reach API at ${apiBase()}`);
      });
  }, []);

  function switchUser(email: string) {
    const next = members.find((member) => member.email === email);
    if (!next) return;
    sessionStorage.setItem(KEY, next.email);
    setCurrent(next);
  }

  return {
    members,
    current,
    error,
    switchUser,
    actor: {
      actor_name: current?.name || "",
      actor_email: current?.email || "",
    },
  };
}
