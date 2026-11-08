"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { authFetch, getCurrentUser } from "@/lib/auth";

export type SeedUserState = {
  message?: string;
  userId?: string;
};

export async function seedUser(_previous: SeedUserState, formData: FormData): Promise<SeedUserState> {
  try {
    const admin = await getCurrentUser();
    if (!admin) redirect("/login");
    if (admin.role !== "admin") return { message: "Only admins can create users." };

    // Explicit fields prevent extra submitted values from reaching the API.
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      organization: String(formData.get("organization") ?? "").trim(),
      role: String(formData.get("role") ?? "visitor"),
    };
    const response = await authFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (response.status === 403) return { message: "Only admins can create users." };
    if (!response.ok) {
      const messages: Record<string, string> = {
        "30": "Please check the form values.",
        "31": "Full name must contain 1 to 255 characters.",
        "32": "Enter a valid email address.",
        "33": "Use a password containing 12 to 128 characters.",
        "34": "An account already uses this email address.",
        "35": "Choose a valid user role.",
        "36": "Organization must contain at most 150 characters.",
      };
      return { message: messages[body.errorCode] ?? "Couldn't create the user. Please try again." };
    }
    // Do not replace the admin's session or return the submitted password.
    return { userId: body.id, message: "User created. They can now sign in with the email and password you entered." };
  } catch (error) {
    unstable_rethrow(error);
    return { message: "Couldn't create the user. Please try again." };
  }
}
