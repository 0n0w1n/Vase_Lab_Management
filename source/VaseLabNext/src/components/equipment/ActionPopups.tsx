"use client"

import { updateEquipment, removeEquipment } from "@/app/(main)/equipment/actions";
import { STATE_OPTIONS } from "@/components/equipment/NewEquipmentForm";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { SelectInput, TextArea, TextInput } from "@/components/ui/FormFields";
import { ItemActions } from "@/components/ui/ItemActions";
import { Modal, ModalFormButtons } from "@/components/ui/Modal";
import { useModalForm } from "@/components/ui/useModalForm";
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
  const [{ values, errors }, formAction, pending] = useModalForm<EditEquipmentState>(
    updateEquipment.bind(null, item.id),
    {
      values: {
        name: item.name,
        model: item.model ?? "",
        state: item.state,
        description: item.description ?? "",
      },
      errors: {},
    },
    `${formatEquipmentId(item.id)} updated`,
    onDone
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 pt-4">
      <div className="flex gap-3 *:flex-1">
        <TextInput name="name" label="Name" required maxLength={140} defaultValue={values.name} error={errors.name} />
        <TextInput name="model" label="Model" maxLength={140} defaultValue={values.model} error={errors.model} />
      </div>

      <SelectInput name="state" label="State" options={STATE_OPTIONS} required defaultValue={values.state} error={errors.state} />

      <TextArea name="description" label="Description" defaultValue={values.description} error={errors.description} />

      <ModalFormButtons pending={pending} />
    </form>
  );
}
