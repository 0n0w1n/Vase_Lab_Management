"use client";

import { useActionState } from "react";
import { useAlert } from "@/components/ui/Alert";

type FormState = { ok?: boolean; message?: string };

/**
 * useActionState for a form inside a modal: shows a success alert and closes
 * the modal once the save works, or an error alert when it doesn't.
 */
export function useModalForm<S extends FormState>(
  action: (prev: S, formData: FormData) => Promise<S>,
  initial: Awaited<S>,
  successText: string,
  onDone: () => void
) {
  const showAlert = useAlert();
  return useActionState<S, FormData>(async (prev, formData) => {
    const next = await action(prev, formData);
    if (next.ok) {
      showAlert("success", successText);
      onDone();
    } else if (next.message) {
      showAlert("error", next.message);
    }
    return next;
  }, initial);
}
