"use client";

import { useEffect, useState } from "react";

import { teamApi } from "@/lib/api";
import { WorkspaceMember } from "@/lib/types";

const KEY = "formly-current-user";

export function useCurrentUser() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [current, setCurrent] = useState<WorkspaceMember>();

  useEffect(() => {
    void teamApi.list().then((list) => {
      setMembers(list);
      const saved = sessionStorage.getItem(KEY);
      setCurrent(list.find((member) => member.email === saved) || list[0]);
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
    switchUser,
    actor: {
      actor_name: current?.name || "",
      actor_email: current?.email || "",
    },
  };
}
