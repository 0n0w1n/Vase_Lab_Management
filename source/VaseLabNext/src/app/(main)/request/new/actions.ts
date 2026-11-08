"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { createRequest, parseRequestForm, RequestValidationError } from "@/lib/requests";
import type { NewRequestState } from "@/types/request";

export type { NewRequestField, NewRequestState } from "@/types/request";

export async function submitNewRequest(
  _prev: NewRequestState,
  formData: FormData
): Promise<NewRequestState> {
  // No user check needed here: createRequest sends the token cookie and Flask
  // rejects the call without a valid one, even on a direct POST to this action.
  const { values, errors, input } = parseRequestForm(formData);
  if (!input) return { values, errors };

  try {
    await createRequest(input);
  } catch (error) {
    // Let the expired-session redirect to /login through.
    unstable_rethrow(error);
    if (error instanceof RequestValidationError) {
      return error.field ? { values, errors: { [error.field]: error.message } } : { values, errors: {}, message: error.message };
    }
    return {
      values,
      errors: {},
      message: "Couldn't submit the request. Please try again.",
    };
  }

  revalidatePath("/request");
  redirect("/request");
}
