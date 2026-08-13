import { authHeaders, getToken } from "./auth";
import { contextFromPath, messageFromDetail, messageFromNetworkError, messageFromStatus, MESSAGES } from "./errors";
import {
  FormActivity,
  FormDefinition,
  FormEditor,
  FormResponse,
  FormStats,
  InviteCreateResult,
  WorkspaceInvite,
  WorkspaceMember,
} from "./types";

declare global {
  interface Window {
    __FORMLY_API__?: string;
  }
}

export function apiBase(): string {
  if (typeof window !== "undefined" && window.__FORMLY_API__) {
    return window.__FORMLY_API__.replace(/\/$/, "");
  }
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  } catch (error) {
    throw new Error(messageFromNetworkError(error));
  }
  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    !path.startsWith("/auth/") &&
    !path.startsWith("/public/") &&
    !path.startsWith("/invites/")
  ) {
    window.localStorage.removeItem("formly-token");
    const route = window.location.pathname;
    if (!["/login", "/register", "/invite", "/f/"].some((prefix) => route.startsWith(prefix))) {
      window.location.href = "/login";
    }
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(messageFromStatus(response.status, messageFromDetail(payload.detail), contextFromPath(path)));
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function json(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export const formsApi = {
  list: () => request<FormDefinition[]>("/forms"),
  get: (id: string | number) => request<FormDefinition>(`/forms/${id}`),
  create: (form: unknown) => request<FormDefinition>("/forms", json("POST", form)),
  update: (id: string | number, form: unknown) => request<FormDefinition>(`/forms/${id}`, json("PUT", form)),
  rename: (id: number, title: string, actor?: unknown) =>
    request<FormDefinition>(`/forms/${id}`, json("PATCH", { title, ...(actor as object) })),
  remove: (id: number) => request<{ ok: boolean }>(`/forms/${id}`, { method: "DELETE" }),
  duplicate: (id: number) => request<FormDefinition>(`/forms/${id}/duplicate`, { method: "POST" }),
  togglePublish: (id: string | number, actor?: unknown) =>
    request<FormDefinition>(`/forms/${id}/publish`, json("POST", actor || {})),
  responses: (id: string | number) => request<FormResponse[]>(`/forms/${id}/responses`),
  stats: (id: string | number) => request<FormStats>(`/forms/${id}/stats`),
  exportCsv: async (id: string | number) => {
    let response: Response;
    try {
      response = await fetch(`${apiBase()}/forms/${id}/responses.csv`, { headers: authHeaders() });
    } catch (error) {
      throw new Error(messageFromNetworkError(error));
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(
        messageFromStatus(response.status, messageFromDetail(payload.detail), "form") || MESSAGES.exportFailed,
      );
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `form-${id}-responses.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },
  heartbeat: (id: string | number, actor: unknown) => request<FormEditor[]>(`/forms/${id}/presence`, json("POST", actor)),
  editors: (id: string | number) => request<FormEditor[]>(`/forms/${id}/presence`),
  activity: (id: string | number) => request<FormActivity[]>(`/forms/${id}/activity`),
};

export const teamApi = {
  list: () => request<WorkspaceMember[]>("/workspace/members"),
  invites: () => request<WorkspaceInvite[]>("/workspace/invites"),
  invite: (body: { name: string; email: string; role: string }) =>
    request<InviteCreateResult>("/workspace/invites", json("POST", body)),
  revokeInvite: (id: number) => request<{ ok: boolean }>(`/workspace/invites/${id}`, { method: "DELETE" }),
  remove: (id: number) => request<{ ok: boolean }>(`/workspace/members/${id}`, { method: "DELETE" }),
};

export const inviteApi = {
  preview: (token: string) => request<{ name: string; email: string; role: string }>(`/invites/${token}`),
  accept: (token: string, password: string) =>
    request<{ token: string; user: WorkspaceMember }>(`/invites/${token}/accept`, json("POST", { password })),
};

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: WorkspaceMember }>("/auth/register", json("POST", body)),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: WorkspaceMember }>("/auth/login", json("POST", body)),
  me: () => request<WorkspaceMember>("/auth/me"),
};

export const publicFormsApi = {
  get: (slug: string) => request<FormDefinition>(`/public/${slug}`),
  submit: (slug: string, body: unknown) => request<{ id: number }>(`/public/${slug}/responses`, json("POST", body)),
  savePartial: (slug: string, body: unknown) =>
    request<{ ok: boolean }>(`/public/${slug}/partial`, json("POST", body)),
  upload: async (slug: string, file: File) => {
    const data = new FormData();
    data.append("file", file);
    const result = await request<{ url: string }>(`/public/${slug}/upload`, { method: "POST", body: data });
    return `${apiBase().replace(/\/api$/, "")}${result.url}`;
  },
};
