"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRequest } from "@/lib/requests";
import type { NewRequestInput, RequestPriority } from "@/types/request";

const PRIORITIES: RequestPriority[] = ["low", "medium", "high"];

/** Matches `RequestTitle = db.String(255)` in the Flask model. */
const TITLE_MAX = 255;

export type NewRequestField = keyof NewRequestInput;

export type NewRequestState = {
  /** Echoed back so the form keeps what the user typed after a failed submit. */
  values: Record<NewRequestField, string>;
  errors: Partial<Record<NewRequestField, string>>;
  /** Failure that isn't tied to one field, e.g. the backend being down. */
  message?: string;
};

function isPriority(value: string): value is RequestPriority {
  return (PRIORITIES as string[]).includes(value);
}

export async function submitNewRequest(
  _prev: NewRequestState,
  formData: FormData
): Promise<NewRequestState> {
  // TODO: check the signed-in user here once auth exists — Server Actions can
  // be hit by a direct POST, not only through this form.

  const values = {
    title: String(formData.get("title") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    priority: String(formData.get("priority") ?? ""),
    deadline: String(formData.get("deadline") ?? ""),
  };

  const errors: NewRequestState["errors"] = {};

  if (!values.title) errors.title = "Please enter a header.";
  else if (values.title.length > TITLE_MAX)
    errors.title = `Header must be ${TITLE_MAX} characters or fewer.`;

  if (!isPriority(values.priority)) errors.priority = "Please select a priority.";

  // Compared against today's UTC date, so it can be a few hours lenient around
  // midnight — good enough as a sanity check; the backend owns the real rule.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.deadline))
    errors.deadline = "Please select a deadline.";
  else if (values.deadline < new Date().toISOString().slice(0, 10))
    errors.deadline = "Deadline can't be in the past.";

  if (Object.keys(errors).length > 0) return { values, errors };

  try {
    await createRequest({
      ...values,
      priority: values.priority as RequestPriority,
    });
  } catch {
    return {
      values,
      errors: {},
      message: "Couldn't submit the request. Please try again.",
    };
  }

  revalidatePath("/Request");
  redirect("/Request");
}
