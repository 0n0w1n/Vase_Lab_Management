"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  deleteEquipment,
  editEquipment,
  EquipmentValidationError,
  parseEquipmentForm,
} from "@/lib/equipment";
import type { ActionResult } from "@/types/action";
import type { EditEquipmentState } from "@/types/equipment";

// Flask's error text is for the docs only, so the wording shown lives here.
const DELETE_MESSAGES: Record<string, string> = {
  "12": "You don't have permission to delete equipment.",
  "13": "This equipment no longer exists.",
  "30": "It's still used by an open request.",
};

/** Bound to the item's id: updateEquipment.bind(null, id) */
export async function updateEquipment(
  id: number,
  _prev: EditEquipmentState,
  formData: FormData
): Promise<EditEquipmentState> {
  const { values, errors, input } = parseEquipmentForm(formData);
  if (!input) return { values, errors };

  try {
    await editEquipment(id, input);
  } catch (error) {
    // Let the expired-session redirect to /login through.
    unstable_rethrow(error);
    if (error instanceof EquipmentValidationError) {
      return error.field
        ? { values, errors: { [error.field]: error.message } }
        : { values, errors: {}, message: error.message };
    }
    return { values, errors: {}, message: "Couldn't save the changes. Please try again." };
  }

  revalidatePath("/equipment");
  revalidatePath(`/equipment/${id}`, "layout");
  return { values, errors: {}, ok: true };
}

// No revalidatePath here: it would re-render the deleted detail page into a 404.
// The modal navigates away or refreshes the list itself.
export async function removeEquipment(id: number): Promise<ActionResult> {
  try {
    await deleteEquipment(id);
  } catch (error) {
    unstable_rethrow(error);
    const code = error instanceof EquipmentValidationError ? error.errorCode : "";
    return { ok: false, message: DELETE_MESSAGES[code] ?? "Couldn't delete the equipment. Please try again." };
  }
  return { ok: true };
}
