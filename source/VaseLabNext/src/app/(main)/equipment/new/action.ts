'use server'

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { createEquipment, EquipmentValidationError } from "@/lib/equipment";
import type { EquipmentState, NewEquipmentInput } from "@/types/equipment";
import type { NewEquipmentState } from "@/types/equipment";

const EQUIPMENT_STATES: EquipmentState[] = [
  "available",
  "in_use",
  "maintenance",
  "retired",
];

function isEquipmentState(value: string): value is EquipmentState {
  return (EQUIPMENT_STATES as string[]).includes(value);
}

export async function SendForm(
  _previousState: NewEquipmentState,
  formData: FormData
): Promise<NewEquipmentState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    model: String(formData.get("model") ?? "").trim(),
    state: String(formData.get("state") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
  };

  const errors: NewEquipmentState["errors"] = {};

  if (!values.name) errors.name = "Please enter an equipment name.";
  if (values.name.length > 140) errors.name = "Name must be 140 characters or fewer.";
  if (values.model.length > 140) errors.model = "Model must be 140 characters or fewer.";
  if (!isEquipmentState(values.state)) errors.state = "Please select a state.";

  if (Object.keys(errors).length > 0) return { values, errors };

  try {
    await createEquipment({
      ...values,
      state: values.state as EquipmentState,
      model: values.model || "",
      description: values.description || "",
    } satisfies NewEquipmentInput);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof EquipmentValidationError) {
      return error.field
        ? { values, errors: { [error.field]: error.message } }
        : { values, errors: {}, message: error.message };
    }
    return {
      values,
      errors: {},
      message: "Couldn't create the equipment. Please try again.",
    };
  }

  revalidatePath("/equipment");
  redirect("/equipment");
}