import { WorkspaceMember } from "./types";

export function isOwner(user?: WorkspaceMember | null): boolean {
  return user?.role === "owner";
}

export function isViewer(user?: WorkspaceMember | null): boolean {
  return user?.role === "viewer";
}

export function canEditForms(user?: WorkspaceMember | null): boolean {
  return Boolean(user) && user?.role !== "viewer";
}
