import { WorkspaceMember } from "./types";

export function isOwner(user?: WorkspaceMember | null): boolean {
  return user?.role === "owner";
}
