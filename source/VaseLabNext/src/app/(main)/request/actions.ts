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
import { getEquipment } from "@/lib/equipment";
import type { ActionResult } from "@/types/action";
import type { Equipment } from "@/types/equipment";
import type { EditRequestInput, EditRequestState, RequestStatus } from "@/types/request";

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
  const user = await getCurrentUser();
  const manager = isManager(user)
    ? parseManagerFields(formData)
    : { values: { status: "", capacity: "" }, errors: {}, input: {} };

  const values = { ...base.values, ...manager.values };
  const errors = { ...base.errors, ...manager.errors };
  if (!base.input || !manager.input) return { values, errors };
  const input: EditRequestInput = { ...base.input, ...manager.input };
  // A TA may move in-progress to review. Flask checks the move.
  if (user?.role === "lab_ta" && formData.has("status")) {
    input.status = String(formData.get("status")) as RequestStatus;
  }

  // "" is None; left out entirely when the form has no equipment field
  const equipmentId = formData.has("equipmentId") ? Number(formData.get("equipmentId")) || null : undefined;

  try {
    await editRequest(id, input, equipmentId);
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

/** What the edit modal loads on open: fields the list rows don't carry, plus the equipment to pick from. */
export async function loadRequestDetails(id: string): Promise<{
  details: string;
  capacity: number;
  assignedCount: number;
  equipmentId: number | null;
  equipment: Pick<Equipment, "id" | "name" | "state">[];
} | null> {
  try {
    const [res, equipment] = await Promise.all([
      authFetch(`/request/details/${encodeURIComponent(id)}`, { cache: "no-store" }),
      getEquipment(),
    ]);
    if (!res.ok) return null;
    const body = await res.json();
    return {
      details: typeof body?.details === "string" ? body.details : "",
      capacity: typeof body?.capacity === "number" ? body.capacity : 1,
      assignedCount: typeof body?.assignedCount === "number" ? body.assignedCount : 0,
      equipmentId: typeof body?.equipment?.id === "number" ? body.equipment.id : null,
      equipment: equipment.map(({ id, name, state }) => ({ id, name, state })),
    };
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
