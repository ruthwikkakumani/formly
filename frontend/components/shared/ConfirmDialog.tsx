import { BusyLabel } from "@/components/shared/BusyLabel";
import { Modal } from "@/components/shared/Modal";

export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Remove",
  pendingLabel = "Removing…",
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  pendingLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={busy ? () => undefined : onClose}>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="modalactions">
        <button type="button" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="confirm-danger" onClick={onConfirm} disabled={busy}>
          <BusyLabel busy={busy} idle={confirmLabel} pending={pendingLabel} />
        </button>
      </div>
    </Modal>
  );
}
