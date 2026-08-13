import { FormStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: FormStatus }) {
  return <span className={`status ${status}`}>{status}</span>;
}
