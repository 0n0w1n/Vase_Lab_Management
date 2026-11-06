'use server'

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { createEquipment, EquipmentValidationError, parseEquipmentForm } from "@/lib/equipment";
import type { NewEquipmentState } from "@/types/equipment";

export async function SendForm(
  _previousState: NewEquipmentState,
  formData: FormData
): Promise<NewEquipmentState> {
  const { values, errors, input } = parseEquipmentForm(formData);
  if (!input) return { values, errors };

  try {
    await createEquipment(input);
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
