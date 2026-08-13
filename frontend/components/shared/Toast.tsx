export type ToastTone = "ok" | "error";

export function Toast({ message, tone = "ok" }: { message: string; tone?: ToastTone }) {
  if (!message) return null;
  const error = tone === "error";
  return (
    <div className={error ? "toast danger-toast" : "toast"} role={error ? "alert" : "status"}>
      {error ? message : `✓ ${message}`}
    </div>
  );
}
