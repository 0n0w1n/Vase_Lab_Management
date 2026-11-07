"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { authFetch, getCurrentUser, isManager } from "@/lib/auth";
import {
  deleteRequest,
  editRequest,
  parseManagerFields,
  parseRequestForm,
  RequestValidationError,
} from "@/lib/requests";
import type { ActionResult } from "@/types/action";
import type { EditRequestInput, EditRequestState } from "@/types/request";

// Flask's error text is for the docs only, so the wording shown lives here.
const DELETE_MESSAGES: Record<string, string> = {
  "12": "You don't have permission to delete this request.",
  "13": "This request no longer exists.",
};

/** Bound to the request: updateRequest.bind(null, id, savedDeadline) */
export async function updateRequest(
  id: string,
  keepDeadline: string | null,
  _prev: EditRequestState,
  formData: FormData
): Promise<EditRequestState> {
  const base = parseRequestForm(formData, keepDeadline);
  // Checked here, not trusted from the form: a member could add the fields by hand.
  const manager = isManager(await getCurrentUser())
    ? parseManagerFields(formData)
    : { values: { status: "", capacity: "" }, errors: {}, input: {} };

  const values = { ...base.values, ...manager.values };
  const errors = { ...base.errors, ...manager.errors };
  if (!base.input || !manager.input) return { values, errors };
  const input: EditRequestInput = { ...base.input, ...manager.input };

  try {
    await editRequest(id, input);
  } catch (error) {
    // Let the expired-session redirect to /login through.
    unstable_rethrow(error);
    if (error instanceof RequestValidationError) {
      return error.field
        ? { values, errors: { [error.field]: error.message } }
        : { values, errors: {}, message: error.message };
    }
    return { values, errors: {}, message: "Couldn't save the changes. Please try again." };
  }

  revalidatePath("/request");
  revalidatePath(`/request/${id}`, "layout");
  revalidatePath("/dashboard", "layout");
  return { values, errors: {}, ok: true };
}

// No revalidatePath here: it would re-render the deleted detail page into a 404.
// The modal navigates away or refreshes the list itself.
export async function removeRequest(id: string): Promise<ActionResult> {
  try {
    await deleteRequest(id);
  } catch (error) {
    unstable_rethrow(error);
    const code = error instanceof RequestValidationError ? error.errorCode : "";
    return { ok: false, message: DELETE_MESSAGES[code] ?? "Couldn't delete the request. Please try again." };
  }
  return { ok: true };
}

/** The list rows don't carry details or capacity, so the edit modal loads them on open. */
export async function loadRequestDetails(
  id: string
): Promise<{ details: string; capacity: number } | null> {
  try {
    const res = await authFetch(`/request/details/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    return {
      details: typeof body?.details === "string" ? body.details : "",
      capacity: typeof body?.capacity === "number" ? body.capacity : 1,
    };
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
