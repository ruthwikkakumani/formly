import { FormActivity, FormDefinition, FormEditor, FormResponse, FormStats, WorkspaceMember } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, init);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Request failed");
  }
  return response.json();
}

function json(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
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
  exportUrl: (id: string | number) => `${API}/forms/${id}/responses.csv`,
  heartbeat: (id: string | number, actor: unknown) => request<FormEditor[]>(`/forms/${id}/presence`, json("POST", actor)),
  editors: (id: string | number) => request<FormEditor[]>(`/forms/${id}/presence`),
  activity: (id: string | number) => request<FormActivity[]>(`/forms/${id}/activity`),
};

export const teamApi = {
  list: () => request<WorkspaceMember[]>("/workspace/members"),
  invite: (body: { name: string; email: string; role: string }) =>
    request<WorkspaceMember>("/workspace/members", json("POST", body)),
  remove: (id: number) => request<{ ok: boolean }>(`/workspace/members/${id}`, { method: "DELETE" }),
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
    return `${API.replace(/\/api$/, "")}${result.url}`;
  },
};
