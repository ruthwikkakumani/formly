import { ReactNode } from "react";

export function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modalback" onClick={onClose} role="presentation">
      <article className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </article>
    </div>
  );
}
