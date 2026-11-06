"use client"

import { useActionState } from "react";
import { cn } from "cn";
import { updateEquipment, removeEquipment } from "@/app/(main)/equipment/actions";
import { Field, STATE_OPTIONS, errorProps, inputBox } from "@/components/equipment/NewEquipmentForm";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { ItemActions } from "@/components/ui/ItemActions";
import { Modal, ModalCancel, saveButton } from "@/components/ui/Modal";
import { useAlert } from "@/components/ui/Alert";
import { formatEquipmentId } from "@/lib/format";
import type { EditEquipmentState, Equipment } from "@/types/equipment";

type Props = {
  item: Equipment;
  /** "buttons" on the detail page, "hover" on a list row */
  variant: "buttons" | "hover";
};

/** Edit + Delete for one piece of equipment. Only render it for lab managers / admins. */
export function EquipmentActions({ item, variant }: Props) {
  const id = formatEquipmentId(item.id);

  return (
    <ItemActions
      variant={variant}
      dialogs={(open, close) => (
        <>
          <Modal open={open === "edit"} onClose={close} title={`Edit ${id}`}>
            {/* Mounted only while open, so every open starts from the saved values */}
            <EditEquipmentForm item={item} onDone={close} />
          </Modal>
          <ConfirmDeleteModal
            open={open === "delete"}
            onClose={close}
            title={`Delete ${id}?`}
            description={`${item.name} will be permanently removed.`}
            onConfirm={() => removeEquipment(item.id)}
            successText={`${id} deleted`}
            redirectTo={variant === "buttons" ? "/equipment" : undefined}
          />
        </>
      )}
    />
  );
}

function EditEquipmentForm({ item, onDone }: { item: Equipment; onDone: () => void }) {
  const showAlert = useAlert();
  const [state, formAction, pending] = useActionState(
    async (prev: EditEquipmentState, formData: FormData) => {
      const next = await updateEquipment(item.id, prev, formData);
      if (next.ok) {
        showAlert("success", `${formatEquipmentId(item.id)} updated`);
        onDone();
      } else if (next.message) {
        showAlert("error", next.message);
      }
      return next;
    },
    {
      values: {
        name: item.name,
        model: item.model ?? "",
        state: item.state,
        description: item.description ?? "",
      },
      errors: {},
    }
  );
  const { values, errors } = state;

  return (
    <form action={formAction} className="flex flex-col gap-4 pt-4">
      {/* Name and model side by side, the rest stacked */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Field id="name" label="Name" error={errors.name}>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={140}
              defaultValue={values.name}
              className={cn(inputBox, "h-10")}
              {...errorProps("name", errors.name)}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field id="model" label="Model" error={errors.model}>
            <input
              id="model"
              name="model"
              type="text"
              maxLength={140}
              defaultValue={values.model}
              className={cn(inputBox, "h-10")}
              {...errorProps("model", errors.model)}
            />
          </Field>
        </div>
      </div>

      <Field id="state" label="State" error={errors.state}>
        <select
          id="state"
          name="state"
          required
          defaultValue={values.state}
          className={cn(inputBox, "h-10")}
          {...errorProps("state", errors.state)}
        >
          {STATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="description" label="Description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          className={cn(inputBox, "h-24 resize-none py-2.5")}
          {...errorProps("description", errors.description)}
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
