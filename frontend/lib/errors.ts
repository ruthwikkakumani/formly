export function messageFromDetail(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "msg" in first) return String((first as { msg: string }).msg);
  }
  return "";
}

export function messageFromStatus(status: number, detail: string): string {
  if (detail) return detail;
  if (status === 401) return "That email or password is incorrect.";
  if (status === 403) return "You don't have access to do that. Sign in, or ask a teammate for an invite.";
  if (status === 404) return "We couldn't find that. It may have expired or been removed.";
  if (status === 409) return "That email is already in use. Sign in instead.";
  if (status === 422) return "Please check the form and try again.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our side. Please try again in a moment.";
  return "Something went wrong. Please try again.";
}

export function messageFromNetworkError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  const lower = raw.toLowerCase();
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("network request failed")
  ) {
    return "We couldn't reach the Formly API. It may still be starting after a deploy — wait a few seconds and try again.";
  }
  if (lower.includes("abort")) return "The request was cancelled. Please try again.";
  return raw || "Something went wrong. Please try again.";
}
