"use client";

import { useEffect, useState } from "react";
import { loadRequestDetails, removeRequest, updateRequest } from "@/app/(main)/request/actions";
import { PRIORITY_OPTIONS } from "@/components/request/NewRequestForm";
import { STATUS } from "@/components/request/StatusPill";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { SelectInput, TextArea, TextInput } from "@/components/ui/FormFields";
import { ItemActions } from "@/components/ui/ItemActions";
import { Modal, ModalFormButtons } from "@/components/ui/Modal";
import { useModalForm } from "@/components/ui/useModalForm";
import type { UserRole } from "@/lib/auth";
import type { EditRequestState, RequestStatus, RequestSummary } from "@/types/request";

// Where each role may move a request from its current status. Flask checks the same rules.
// "open" is pending while no TA is approved, in-progress once one is.
const MANAGER_STATUSES: Record<RequestStatus, (RequestStatus | "open")[]> = {
  pending: ["pending", "close", "reject"],
  "in-progress": ["in-progress", "close", "reject"],
  review: ["open", "close", "reject"],
  close: ["open", "close", "reject"],
  reject: ["open", "close", "reject"],
};
const TA_STATUSES: Partial<Record<RequestStatus, RequestStatus[]>> = {
  "in-progress": ["review"],
};

/** Status dropdown options, current status first. Empty means hide the field. */
function statusOptions(role: UserRole, request: LoadedRequest) {
  const open = request.assignedCount > 0 ? "in-progress" : "pending";
  const allowed =
    role === "admin" || role === "lab_manager"
      ? MANAGER_STATUSES[request.status].map((status) => (status === "open" ? open : status))
      : role === "lab_ta"
        ? TA_STATUSES[request.status] ?? []
        : [];
  if (allowed.length === 0) return [];
  return [...new Set([request.status, ...allowed])].map((value) => ({ value, label: STATUS[value].label }));
}

/** A list row lacks details, capacity and assignedCount; the detail page passes them in. */
type EditableRequest = RequestSummary & { details?: string; capacity?: number; assignedCount?: number };
type LoadedRequest = RequestSummary & { details: string; capacity: number; assignedCount: number };

type Props = {
  request: EditableRequest;
  /** "buttons" on the detail page, "hover" on a list row */
  variant: "buttons" | "hover";
  /** Decides the extra fields: managers get status + capacity, TAs may get status */
  role: UserRole;
};

/** Edit + Delete for one request. Only render it for the owner, assigned TAs, lab managers and admins. */
export default function RequestActions({ request, variant, role }: Props) {
  return (
    <ItemActions
      variant={variant}
      dialogs={(open, close) => (
        <>
          <Modal open={open === "edit"} onClose={close} title={`Edit Request #${request.id}`} description={`Requested by ${request.requestedBy}`}>
            <EditRequestLoader request={request} role={role} onDone={close} />
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

type FormProps = { role: UserRole; onDone: () => void };

/** List rows lack details, capacity and assignedCount: load them first so saving can't blank them. */
function EditRequestLoader({ request, ...props }: FormProps & { request: EditableRequest }) {
  const [extra, setExtra] = useState(
    request.details !== undefined && request.capacity !== undefined && request.assignedCount !== undefined
      ? { details: request.details, capacity: request.capacity, assignedCount: request.assignedCount }
      : null
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (extra) return;
    loadRequestDetails(request.id).then((data) => (data ? setExtra(data) : setFailed(true)));
  }, [extra, request.id]);

  if (failed) return <p className="pt-4 text-sm text-red-600">Couldn&apos;t load this request.</p>;
  if (!extra) return <p className="pt-4 text-sm text-muted-foreground">Loading…</p>;
  return <EditRequestForm request={{ ...request, ...extra }} {...props} />;
}

function EditRequestForm({ request, role, onDone }: FormProps & { request: LoadedRequest }) {
  const canManage = role === "admin" || role === "lab_manager";
  const statuses = statusOptions(role, request);
  const [{ values, errors }, formAction, pending] = useModalForm<EditRequestState>(
    updateRequest.bind(null, request.id, request.deadline),
    {
      values: {
        title: request.title,
        details: request.details,
        priority: request.priority,
        deadline: request.deadline ?? "",
        status: request.status,
        capacity: String(request.capacity),
      },
      errors: {},
    },
    `Request #${request.id} updated`,
    onDone
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 pt-4">
      <TextInput name="title" label="Header" required maxLength={255} defaultValue={values.title} error={errors.title} />

      <div className="flex gap-3 *:flex-1">
        <SelectInput name="priority" label="Priority" options={PRIORITY_OPTIONS} required defaultValue={values.priority} error={errors.priority} />
        <TextInput name="deadline" label="Deadline" type="date" required defaultValue={values.deadline} error={errors.deadline} />
      </div>

      {(statuses.length > 0 || canManage) && (
        <div className="flex gap-3 *:flex-1">
          {statuses.length > 0 && (
            <SelectInput name="status" label="Status" options={statuses} required defaultValue={values.status} error={errors.status} />
          )}
          {/* Lab manager / admin only. The server action checks the role again. */}
          {canManage && (
            <TextInput name="capacity" label="TA capacity" type="number" min={1} step={1} required defaultValue={values.capacity} error={errors.capacity} />
          )}
        </div>
      )}

      <TextArea name="details" label="Details" maxLength={2000} className="h-28" defaultValue={values.details} error={errors.details} />

      <ModalFormButtons pending={pending} />
    </form>
  );
}
