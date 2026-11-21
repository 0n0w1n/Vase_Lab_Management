"use client"

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalCancel, dangerButton, saveButton } from "@/components/ui/Modal";
import { useAlert } from "@/components/ui/Alert";
import type { ActionResult } from "@/types/action";

type Props = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description: React.ReactNode;
  /** The Server Action to run once confirmed */
  onConfirm: () => Promise<ActionResult>;
  /** Confirm button text, e.g. "Delete" or "Submit for Review" */
  confirmText: string;
  /** Confirm button text while the action runs, e.g. "Deleting…" */
  pendingText: string;
  /** "danger" (red) for destructive actions, "primary" (indigo) otherwise. Defaults to "primary". */
  tone?: "primary" | "danger";
  /** Shown in the alert once it worked */
  successText: string;
  /** Where to go afterwards; leave out to stay and refresh */
  redirectTo?: string;
};

/** "Are you sure?" modal shared by every confirm-then-act action (delete, submit for review, …). */
export function ConfirmModal({
  open,
  onClose,
  title,
  description,
  onConfirm,
  confirmText,
  pendingText,
  tone = "primary",
  successText,
  redirectTo,
}: Props) {
  const [pending, startTransition] = useTransition();
  const showAlert = useAlert();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.ok) {
        showAlert("error", result.message);
        return;
      }
      showAlert("success", successText);
      onClose();
      // A deleted page would 404, so leave it before refreshing anything.
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-3 pt-5">
        <ModalCancel />
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className={tone === "danger" ? dangerButton : saveButton}
        >
          {pending ? pendingText : confirmText}
        </button>
      </div>
    </Modal>
  );
}
