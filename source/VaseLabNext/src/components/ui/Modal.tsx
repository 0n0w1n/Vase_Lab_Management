"use client"

import { Dialog } from "@base-ui/react/dialog";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The modal body, usually a form */
  children: React.ReactNode;
};

// Fixed to the middle of the screen.
const popup =
  "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/10 outline-none";

export const cancelButton =
  "h-10 rounded-lg border border-[#44607F]/40 bg-white/70 px-6 text-sm font-semibold text-[#44607F]";

export const saveButton =
  "h-10 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white disabled:opacity-60";

export const dangerButton =
  "h-10 rounded-lg bg-red-600 px-6 text-sm font-semibold text-white disabled:opacity-60";

/**
 * A centered modal. The parent owns `open`, so whatever opened it (a button,
 * a menu item) and whatever finishes inside it (a saved form) can close it.
 */
export function Modal({ open, onClose, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className={popup}>
          <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="pt-1 text-sm text-muted-foreground">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Closes the Modal it sits inside. */
export function ModalCancel() {
  return <Dialog.Close className={cancelButton}>Cancel</Dialog.Close>;
}
