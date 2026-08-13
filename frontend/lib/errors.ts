export type ErrorContext = "login" | "register" | "invite" | "form" | "api";

export const MESSAGES = {
  network: "We couldn't connect right now. Check your internet and try again.",
  timeout: "This is taking longer than usual. Please try again.",
  cancelled: "The request was cancelled. Please try again.",
  login: "That email or password is incorrect.",
  unauthenticated: "Sign in to continue.",
  sessionExpired: "Your session expired. Sign in again.",
  forbidden: "You don't have access to do that. Ask a teammate for an invite.",
  registerExists: "An account with this email already exists. Sign in instead.",
  registerOwnerExists:
    "This workspace already has an owner. Sign in with that account, or ask them to send you an invite.",
  conflict: "That email is already in use.",
  notFound: "We couldn't find that. It may have expired or been removed.",
  formUnavailable: "This form isn't available. It may be unpublished or have been removed.",
  inviteUnavailable: "This invite is no longer available. It may have expired or been revoked.",
  validation: "Please check the form and try again.",
  invalidEmail: "Enter a valid email address.",
  missingName: "Enter a name.",
  rateLimited: "Too many attempts. Please wait a moment and try again.",
  tooLarge: "That file is too large. Please choose a file under 10MB.",
  server: "Something went wrong on our side. Please try again in a moment.",
  generic: "Something went wrong. Please try again.",
  signInFailed: "We couldn't sign you in. Please try again.",
  registerFailed: "We couldn't create your account. Please try again.",
  inviteAcceptFailed: "We couldn't accept this invite. Please try again.",
  formsLoadFailed: "We couldn't load your forms.",
  formCreateFailed: "We couldn't create the form. Please try again.",
  formSaveFailed: "We couldn't save just now. Please try again.",
  publishFailed: "We couldn't update publish status. Please try again.",
  responsesLoadFailed: "We couldn't load responses.",
  exportFailed: "We couldn't export responses just now. Please try again.",
  uploadFailed: "We couldn't upload that file. Please try again.",
  teamLoadFailed: "We couldn't load the workspace team.",
  inviteSendFailed: "We couldn't send that invite. Please try again.",
  inviteRevokeFailed: "We couldn't revoke that invite.",
  memberRemoveFailed: "We couldn't remove that teammate.",
  copyFailed: "We couldn't copy the link. Please copy it from the address bar instead.",
} as const;

const NETWORK_MARKERS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "load failed",
  "err_network",
  "err_internet_disconnected",
  "err_connection_refused",
  "err_connection_reset",
  "err_connection_timed_out",
  "err_name_not_resolved",
  "econnrefused",
  "econnreset",
  "enotfound",
  "net::err_",
];

const TECHNICAL_VALIDATION = /^(field required|input should|value error|string should|value is not a valid)/i;

function rawText(error: unknown): string {
  if (error instanceof Error) return error.message || "";
  if (typeof error === "string") return error;
  return String(error || "");
}

function looksInternal(text: string): boolean {
  const value = text.trim();
  const lower = value.toLowerCase();
  if (!value) return true;
  if (value.startsWith("{") || value.startsWith("[") || value.startsWith("<")) return true;
  if (lower.includes("traceback") || /file ".*", line \d+/.test(lower)) return true;
  if (/\b(smtp_|resend_|database_url|auth_secret|api_key)\b/i.test(value)) return true;
  if (/\b(valueerror|typeerror|keyerror|attributeerror|internal server error)\b/i.test(value)) return true;
  if (/\bat https?:\/\//i.test(value) || value.includes("\n    at ")) return true;
  if (value.length > 280) return true;
  return false;
}

export function sanitizeUserText(text: string): string {
  const value = (text || "").trim();
  if (!value || looksInternal(value)) return "";
  return value;
}

function isEmailValidation(detail: unknown, text: string): boolean {
  return /not a valid email|valid email address|value is not a valid email|enter a valid email/i.test(
    `${JSON.stringify(detail)} ${text}`,
  );
}

export function messageFromDetail(detail: unknown): string {
  if (typeof detail === "string" && detail.trim()) {
    if (isEmailValidation(detail, detail)) return MESSAGES.invalidEmail;
    return sanitizeUserText(detail);
  }
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (typeof first === "string") {
      if (isEmailValidation(detail, first)) return MESSAGES.invalidEmail;
      return sanitizeUserText(first);
    }
    if (first && typeof first === "object" && "msg" in first) {
      const msg = String((first as { msg: string }).msg);
      if (isEmailValidation(detail, msg)) return MESSAGES.invalidEmail;
      const human = msg.replace(/^value error,\s*/i, "").trim();
      return sanitizeUserText(human || msg);
    }
  }
  return "";
}

export function messageFromStatus(status: number, detail: string, context: ErrorContext = "api"): string {
  const cleaned = sanitizeUserText(detail);
  if (status === 422 && isEmailValidation(detail, cleaned || detail)) return MESSAGES.invalidEmail;
  if (cleaned && !(status === 422 && TECHNICAL_VALIDATION.test(cleaned))) return cleaned;
  if (status === 401) return context === "login" ? MESSAGES.login : MESSAGES.unauthenticated;
  if (status === 403) return context === "register" ? MESSAGES.registerOwnerExists : MESSAGES.forbidden;
  if (status === 404) {
    if (context === "invite") return MESSAGES.inviteUnavailable;
    if (context === "form") return MESSAGES.formUnavailable;
    return MESSAGES.notFound;
  }
  if (status === 409) return context === "register" || context === "login" ? MESSAGES.registerExists : MESSAGES.conflict;
  if (status === 413) return MESSAGES.tooLarge;
  if (status === 422) return MESSAGES.validation;
  if (status === 429) return MESSAGES.rateLimited;
  if (status >= 500) return context === "invite" ? MESSAGES.inviteSendFailed : MESSAGES.server;
  return MESSAGES.generic;
}

export function messageFromNetworkError(error: unknown): string {
  const lower = rawText(error).toLowerCase();
  if (NETWORK_MARKERS.some((marker) => lower.includes(marker))) return MESSAGES.network;
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("err_timed_out")) {
    return MESSAGES.timeout;
  }
  if (lower.includes("abort")) return MESSAGES.cancelled;
  return sanitizeUserText(rawText(error)) || MESSAGES.generic;
}

export function messageFromUnknown(error: unknown, fallback = MESSAGES.generic): string {
  const raw = rawText(error);
  const lower = raw.toLowerCase();
  if (NETWORK_MARKERS.some((marker) => lower.includes(marker))) return MESSAGES.network;
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("err_timed_out")) {
    return MESSAGES.timeout;
  }
  if (lower.includes("abort")) return MESSAGES.cancelled;
  return sanitizeUserText(raw) || fallback;
}

export function contextFromPath(path: string): ErrorContext {
  if (path.startsWith("/auth/login")) return "login";
  if (path.startsWith("/auth/register")) return "register";
  if (path.startsWith("/invites/") || path.startsWith("/workspace/invites")) return "invite";
  if (path.startsWith("/public/") || path.startsWith("/forms/")) return "form";
  return "api";
}
