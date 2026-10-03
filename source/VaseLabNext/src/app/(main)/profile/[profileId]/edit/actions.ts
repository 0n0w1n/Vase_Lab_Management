"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { authFetch, type User } from "@/lib/auth";

export type ProfileState = {
  values: { name: string; organization: string };
  errors: Partial<Record<"name" | "organization", string>>;
  message?: string;
};

export type PasswordState = {
  errors: Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;
  message?: string;
  success?: boolean;
};

export async function updateProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    organization: String(formData.get("organization") ?? "").trim(),
  };
  const errors: ProfileState["errors"] = {};
  if (!values.name || values.name.length > 255) errors.name = "Enter 1 to 255 characters.";
  if (values.organization.length > 150) errors.organization = "Use at most 150 characters.";
  if (Object.keys(errors).length) return { values, errors };

  let user: User;
  try {
    const response = await authFetch("/user/update/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await response.json();
    if (!response.ok) {
      if ((response.status === 400)) {
        if (["20", "21"].includes(body.errorCode)) {
          let field: Partial<Record<"name" | "organization", string>> = {};
          if (body.errorCode === "20") {field = {"name": body.error};};
          if (body.errorCode === "21") {field = {"organization": body.error};};
          return { values, errors: field };
        }
        return { values, errors: {}, message: body.error };
      }
      throw new Error("Profile update failed");
    }
    user = body;
  } catch (error) {
    unstable_rethrow(error);
    return { values, errors: {}, message: "Couldn't save your profile. Please try again." };
  }
  revalidatePath("/(main)", "layout");
  redirect(`/profile/${user.id}`);
}

export async function updatePassword(_previous: PasswordState, formData: FormData): Promise<PasswordState> {
  // Passwords are never trimmed or returned in action state.
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const errors: PasswordState["errors"] = {};
  if (!currentPassword || currentPassword.length > 1024) errors.currentPassword = "Enter your current password.";
  if (newPassword.length < 12 || newPassword.length > 128) errors.newPassword = "Use 12 to 128 characters.";
  if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  if (Object.keys(errors).length) return { errors };

  try {
    const response = await authFetch("/user/update/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await response.json();
    if (!response.ok) {
      if (response.status === 400 && typeof body.error === "string") {
        if (["currentPassword", "newPassword"].includes(body.field)) {
          return { errors: { [body.field]: body.error } };
        }
        return { errors: {}, message: body.error };
      }
      throw new Error("Password update failed");
    }
    return { errors: {}, success: true, message: "Your password has been updated." };
  } catch (error) {
    unstable_rethrow(error);
    return { errors: {}, message: "Couldn't change your password. Please try again." };
  }
}
