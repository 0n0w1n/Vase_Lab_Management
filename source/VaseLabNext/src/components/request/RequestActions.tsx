"use client";

import { useActionState, useEffect, useState } from "react";
import { cn } from "cn";
import { loadRequestDetails, removeRequest, updateRequest } from "@/app/(main)/request/actions";
import { Field, PRIORITY_OPTIONS, errorProps, inputBox } from "@/components/request/NewRequestForm";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { ItemActions } from "@/components/ui/ItemActions";
import { Modal, ModalCancel, saveButton } from "@/components/ui/Modal";
import { useAlert } from "@/components/ui/Alert";
import type { EditRequestState, RequestSummary } from "@/types/request";

/** A list row has no details text; the detail page passes it in. */
type EditableRequest = RequestSummary & { details?: string };

type Props = {
  request: EditableRequest;
  /** "buttons" on the detail page, "hover" on a list row */
  variant: "buttons" | "hover";
};

/** Edit + Delete for one request. Only render it for the owner, lab managers and admins. */
export default function RequestActions({ request, variant }: Props) {
  return (
    <ItemActions
      variant={variant}
      dialogs={(open, close) => (
        <>
          <Modal
            open={open === "edit"}
            onClose={close}
            title={`Edit Request #${request.id}`}
            description={`Requested by ${request.requestedBy}`}
          >
            <DetailsLoader request={request} onDone={close} />
          </Modal>
          <ConfirmDeleteModal
            open={open === "delete"}
            onClose={close}
            title={`Delete Request #${request.id}?`}
            description={`"${request.title}" will be permanently removed.`}
            onConfirm={() => removeRequest(request.id)}
            successText={`Request #${request.id} deleted`}
            redirectTo={variant === "buttons" ? "/request" : undefined}
          />
        </>
      )}
    />
  );
}

/** Fetches the details text first when it wasn't passed in, so saving can't blank it. */
function DetailsLoader({ request, onDone }: { request: EditableRequest; onDone: () => void }) {
  const [details, setDetails] = useState(request.details);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (details !== undefined) return;
    loadRequestDetails(request.id).then((text) => {
      if (text === null) setFailed(true);
      else setDetails(text);
    });
  }, [details, request.id]);

  if (failed) return <p className="pt-4 text-sm text-red-600">Couldn&apos;t load this request.</p>;
  if (details === undefined) return <p className="pt-4 text-sm text-muted-foreground">Loading…</p>;
  return <EditRequestForm request={{ ...request, details }} onDone={onDone} />;
}

function EditRequestForm({ request, onDone }: { request: EditableRequest & { details: string }; onDone: () => void }) {
  const showAlert = useAlert();
  const [state, formAction, pending] = useActionState(
    async (prev: EditRequestState, formData: FormData) => {
      const next = await updateRequest(request.id, request.deadline, prev, formData);
      if (next.ok) {
        showAlert("success", `Request #${request.id} updated`);
        onDone();
      } else if (next.message) {
        showAlert("error", next.message);
      }
      return next;
    },
    {
      values: {
        title: request.title,
        details: request.details,
        priority: request.priority,
        deadline: request.deadline ?? "",
      },
      errors: {},
    }
  );
  const { values, errors } = state;

  return (
    <form action={formAction} className="flex flex-col gap-4 pt-4">
      <Field id="title" label="Header" error={errors.title}>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={255}
          defaultValue={values.title}
          className={cn(inputBox, "h-10")}
          {...errorProps("title", errors.title)}
        />
      </Field>

      {/* Priority and deadline side by side */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Field id="priority" label="Priority" error={errors.priority}>
            <select
              id="priority"
              name="priority"
              required
              defaultValue={values.priority}
              className={cn(inputBox, "h-10")}
              {...errorProps("priority", errors.priority)}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex-1">
          <Field id="deadline" label="Deadline" error={errors.deadline}>
            <input
              id="deadline"
              name="deadline"
              type="date"
              required
              defaultValue={values.deadline}
              className={cn(inputBox, "h-10")}
              {...errorProps("deadline", errors.deadline)}
            />
          </Field>
        </div>
      </div>

      <Field id="details" label="Details" error={errors.details}>
        <textarea
          id="details"
          name="details"
          maxLength={2000}
          defaultValue={values.details}
          className={cn(inputBox, "h-28 resize-none py-2.5")}
          {...errorProps("details", errors.details)}
        />
      </Field>

      <div className="flex justify-end gap-3 pt-1">
        <ModalCancel />
        <button type="submit" disabled={pending} className={saveButton}>
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
