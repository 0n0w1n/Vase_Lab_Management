"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { authFetch } from "@/lib/auth";

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

const UPLOAD_MESSAGES: Record<string, string> = {
  "12": "You can't add files to this request.",
  "23": "This request is no longer open.",
  "30": "That file name isn't allowed.",
  "31": "Only PDF, JPG, PNG, ZIP and RAR files are allowed.",
  "32": "Files must be 10 MB or smaller.",
  "34": "That file is empty.",
};

const GENERIC = "Something went wrong. Please try again.";

export async function postComment(requestId: string, formData: FormData): Promise<ActionState> {
  if (!/^\d+$/.test(requestId)) return { message: "Request not found." };
  const body = formData.get("body");
  if (typeof body !== "string" || !body.trim()) return { message: "Enter a message." };

  try {
    const res = await authFetch(`/request/${requestId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Comment: body }),
    });
    if (res.status === 403) return { message: "You can't post to this request." };
    if (res.status === 404) return { message: "Request not found." };
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      if (error?.errorCode === "30") return { message: "Enter a message." };
      if (error?.errorCode === "31") return { message: "Use 1000 characters or fewer." };
      return { message: GENERIC };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { message: GENERIC };
  }

  revalidatePath(`/request/${requestId}/messages`);
  return {};
}

export async function downloadAttachment(fileId: number): Promise<
  { data: ArrayBuffer; type: string } | { message: string }
> {
  if (!Number.isSafeInteger(fileId) || fileId <= 0) return { message: "File not found." };

  try {
    const res = await authFetch(`/file/download/${fileId}`, { cache: "no-store" });
    if (!res.ok) return { message: res.status === 404 ? "File not found." : GENERIC };
    return {
      data: await res.arrayBuffer(),
      type: res.headers.get("Content-Type") ?? "application/octet-stream",
    };
  } catch (error) {
    unstable_rethrow(error);
    return { message: GENERIC };
  }
}

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

export async function uploadAttachment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const requestId = String(formData.get("requestId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.name === "") return { message: "Choose a file to upload." };

  const upload = new FormData();
  upload.append("file", file);

  try {
    const res = await authFetch(`/file/upload/${encodeURIComponent(requestId)}`, {
      method: "POST",
      body: upload,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { message: UPLOAD_MESSAGES[String(body?.errorCode)] ?? GENERIC };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { message: GENERIC };
  }

  revalidatePath(`/request/${requestId}`, "layout");
  return {};
}

const ASSIGN_MESSAGES: Record<string, string> = {
  "12": "Only the lab manager can change who works on this.",
  "30": "That person isn't a TA.",
  "31": "This request is no longer open.",
  "32": "They're already on this request.",
  "33": "This request is full. Raise its capacity first.",
};

const UNASSIGN_MESSAGES: Record<string, string> = {
  "12": "Only the lab manager can change who works on this.",
  "31": "This request is no longer open.",
  "32": "They're no longer on this request.",
};

const LEAVE_MESSAGES: Record<string, string> = {
  "31": "This request is no longer open.",
  "32": "You're not on this request.",
  "33": "You've already asked to leave.",
};

/** POST a team change, then refresh the request and dashboard pages that show it. */
async function postTeamChange(
  path: string,
  requestId: string,
  body: object | undefined,
  messages: Record<string, string>
): Promise<ActionState> {
  try {
    const res = await authFetch(`${path}/${encodeURIComponent(requestId)}`, {
      method: "POST",
      ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      return { message: messages[String(error?.errorCode)] ?? GENERIC };
    }
  } catch (error) {
    // Let the expired-session redirect to /login through.
    unstable_rethrow(error);
    return { message: GENERIC };
  }

  revalidatePath(`/request/${requestId}`, "layout");
  revalidatePath("/dashboard", "layout");
  return {};
}

/** Lab manager: put a TA on the request straight away. */
export async function assignTa(requestId: string, taId: string): Promise<ActionState> {
  return postTeamChange("/request/assign", requestId, { taId: Number(taId) }, ASSIGN_MESSAGES);
}

/** Lab manager: take a TA off the request straight away. */
export async function unassignTa(requestId: string, taId: string): Promise<ActionState> {
  return postTeamChange("/request/unassign", requestId, { taId: Number(taId) }, UNASSIGN_MESSAGES);
}

/** Approved TA: ask the lab manager to take them off the request. */
export async function askToLeave(requestId: string): Promise<ActionState> {
  return postTeamChange("/request/leave", requestId, undefined, LEAVE_MESSAGES);
}
