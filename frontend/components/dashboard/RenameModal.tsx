"use client";

import { FormEvent, useState } from "react";

import { Modal } from "@/components/shared/Modal";

export function RenameModal({
  title,
  onClose,
  onSave,
}: {
  title: string;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}) {
  const [value, setValue] = useState(title);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSave(value.trim() || title);
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">RENAME FORM</p>
      <h2>Give this form a name</h2>
      <form onSubmit={submit}>
        <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} />
        <div className="modalactions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
