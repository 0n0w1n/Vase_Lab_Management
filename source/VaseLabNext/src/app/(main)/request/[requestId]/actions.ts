"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { authFetch } from "@/lib/auth";
import { RequestStatus } from "@/types/request"

export type ActionState = {
  message?: string;
};

// Flask's error text is for the docs only, so the wording shown lives here.
const CAPACITY_MESSAGES: Record<string, string> = {
  "30": "Enter a whole number of at least 1.",
  "31": "Can't go below the TAs already approved.",
};

const ASK_MESSAGES: Record<string, string> = {
  "30": "Keep the message under 1000 characters.",
  "31": "This request is no longer open.",
  "32": "You've already asked to work on this.",
  "33": "This request is already full.",
};

const GENERIC = "Something went wrong. Please try again.";

export async function updateCapacity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const requestId = String(formData.get("requestId") ?? "");
  const capacity = Number(formData.get("capacity"));
  if (!Number.isInteger(capacity) || capacity < 1) return { message: CAPACITY_MESSAGES["30"] };

  try {
    const res = await authFetch(`/request/capacity/${encodeURIComponent(requestId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capacity }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { message: CAPACITY_MESSAGES[String(body?.errorCode)] ?? GENERIC };
    }
  } catch (error) {
    // Let the expired-session redirect to /login through.
    unstable_rethrow(error);
    return { message: GENERIC };
  }

  // "layout" covers all three request tabs; the dashboard shows capacity too.
  revalidatePath(`/request/${requestId}`, "layout");
  revalidatePath("/dashboard", "layout");
  return {};
}

export async function askToWork(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const requestId = String(formData.get("requestId") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  try {
    const res = await authFetch(`/request/ask/${encodeURIComponent(requestId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { message: ASK_MESSAGES[String(body?.errorCode)] ?? GENERIC };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { message: GENERIC };
  }

  revalidatePath(`/request/${requestId}`, "layout");
  revalidatePath("/dashboard", "layout");
  return {};
}

export type StatusUpdateParams = {
  status: RequestStatus,
  requestId: string
}

export async function updateStatusAction(_prev: RequestStatus, next: StatusUpdateParams) {
  try {
    const res = await authFetch(`/request/status/${next.requestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({"status": next.status}),
    });
    if (!res.ok) {return _prev;};
    return next.status;

  } catch (error) {
    unstable_rethrow(error);
    return _prev;
  }

}