"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { decideAsk } from "@/lib/decisions";

export type DecisionState = {
  message?: string;
};

// Flask's error text is for the docs only, so the wording shown lives here.
const MESSAGES: Record<string, string> = {
  "30": "This request is already full. Raise its capacity first.",
  "31": "This ask was already decided.",
};

const GENERIC = "Couldn't save the decision. Please try again.";

export async function submitDecision(_prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision");
  if (decision !== "approve" && decision !== "decline") return { message: GENERIC };

  let errorCode: string | undefined;
  try {
    ({ errorCode } = await decideAsk(id, decision));
  } catch (error) {
    // Let the expired-session redirect to /login through.
    unstable_rethrow(error);
    return { message: GENERIC };
  }

  // Also on errors: "already decided" or "full" means this page is out of date.
  // "layout" covers the dashboard too, whose counts depend on the same data.
  revalidatePath("/dashboard", "layout");
  return errorCode ? { message: MESSAGES[errorCode] ?? GENERIC } : {};
}
