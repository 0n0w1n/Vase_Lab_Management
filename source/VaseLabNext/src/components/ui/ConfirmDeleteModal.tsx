"use client"

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalCancel, dangerButton } from "@/components/ui/Modal";
import { useAlert } from "@/components/ui/Alert";
import type { ActionResult } from "@/types/action";

type Props = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description: React.ReactNode;
  /** The Server Action that does the delete */
  onConfirm: () => Promise<ActionResult>;
  /** Shown in the alert once it worked */
  successText: string;
  /** Where to go afterwards; leave out to stay and refresh (list pages) */
  redirectTo?: string;
};

/** "Are you sure?" modal shared by every delete. */
export function ConfirmDeleteModal({ open, onClose, title, description, onConfirm, successText, redirectTo }: Props) {
  const [pending, startTransition] = useTransition();
  const showAlert = useAlert();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.ok) {
        showAlert("error", result.message);
        return;
      }
      showAlert("success", successText);
      onClose();
      // The deleted page would 404, so leave it before refreshing anything.
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-3 pt-5">
        <ModalCancel />
        <button type="button" onClick={handleDelete} disabled={pending} className={dangerButton}>
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
