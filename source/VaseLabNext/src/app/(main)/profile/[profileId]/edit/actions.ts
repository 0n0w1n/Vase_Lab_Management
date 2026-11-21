"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { authFetch } from "@/lib/auth";

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

export type AdminUserState = {
  values: { name: string; email: string; organization: string; role: string };
  errors: Partial<Record<"name" | "email" | "organization" | "role" | "newPassword" | "confirmPassword", string>>;
  message?: string;
};

/** POST /user/update/<id>; returns the parsed error body when it fails. */
async function postUpdate(userId: string, body: object) {
  const response = await authFetch(`/user/update/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) return null;
  const error = await response.json().catch(() => ({}));
  return { status: response.status, errorCode: String(error.errorCode ?? "") };
}

export async function updateProfile(
  userId: string, _previous: ProfileState, formData: FormData,
): Promise<ProfileState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    organization: String(formData.get("organization") ?? "").trim(),
  };
  const errors: ProfileState["errors"] = {};
  if (!values.name || values.name.length > 255) errors.name = "Enter 1 to 255 characters.";
  if (values.organization.length > 150) errors.organization = "Use at most 150 characters.";
  if (Object.keys(errors).length) return { values, errors };

  try {
    const failure = await postUpdate(userId, values);
    if (failure) {
      if (["30", "31"].includes(failure.errorCode)) return { values, errors: { name: "Enter 1 to 255 characters." } };
      if (failure.errorCode === "32") return { values, errors: { organization: "Use at most 150 characters." } };
      throw new Error("Profile update failed");
    }
  } catch (error) {
    unstable_rethrow(error);
    return { values, errors: {}, message: "Couldn't save your profile. Please try again." };
  }
  revalidatePath("/(main)", "layout");
  redirect(`/profile/${userId}`);
}

export async function updatePassword(
  userId: string, _previous: PasswordState, formData: FormData,
): Promise<PasswordState> {
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
    const failure = await postUpdate(userId, { currentPassword, newPassword });
    if (failure) {
      const fieldErrors: Record<string, PasswordState["errors"]> = {
        "33": { currentPassword: "Enter your current password." },
        "34": { currentPassword: "That isn't your current password." },
        "35": { newPassword: "Use 12 to 128 characters." },
        "36": { newPassword: "Use 12 to 128 characters." },
        "37": { newPassword: "Choose a password different from your current one." },
      };
      if (fieldErrors[failure.errorCode]) return { errors: fieldErrors[failure.errorCode] };
      throw new Error("Password update failed");
    }
    return { errors: {}, success: true, message: "Your password has been updated." };
  } catch (error) {
    unstable_rethrow(error);
    return { errors: {}, message: "Couldn't change your password. Please try again." };
  }
}

/** Admin only: edit anyone's profile, other admins and their own included. A blank password leaves it unchanged. */
export async function adminUpdateUser(
  userId: string, _previous: AdminUserState, formData: FormData,
): Promise<AdminUserState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    organization: String(formData.get("organization") ?? "").trim(),
    role: String(formData.get("role") ?? ""),
  };
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const errors: AdminUserState["errors"] = {};
  if (!values.name || values.name.length > 255) errors.name = "Enter 1 to 255 characters.";
  if (!/^[^\s@]+@[^\s@]+$/.test(values.email) || values.email.length > 254) errors.email = "Enter a valid email address.";
  if (values.organization.length > 150) errors.organization = "Use at most 150 characters.";
  if (newPassword && (newPassword.length < 12 || newPassword.length > 128)) errors.newPassword = "Use 12 to 128 characters.";
  if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  if (Object.keys(errors).length) return { values, errors };

  try {
    const failure = await postUpdate(userId, { ...values, ...(newPassword && { newPassword }) });
    if (failure) {
      const fieldErrors: Record<string, AdminUserState["errors"]> = {
        "30": { name: "Enter 1 to 255 characters." },
        "31": { name: "Enter 1 to 255 characters." },
        "32": { organization: "Use at most 150 characters." },
        "35": { newPassword: "Use 12 to 128 characters." },
        "36": { newPassword: "Use 12 to 128 characters." },
        "38": { email: "Enter a valid email address." },
        "39": { role: "Choose a valid role." },
        "50": { email: "Another account already uses this email." },
      };
      if (fieldErrors[failure.errorCode]) return { values, errors: fieldErrors[failure.errorCode] };
      if (failure.status === 403) return { values, errors: {}, message: "Only admins can edit other users." };
      throw new Error("Admin user update failed");
    }
  } catch (error) {
    unstable_rethrow(error);
    return { values, errors: {}, message: "Couldn't save this user. Please try again." };
  }
  revalidatePath("/(main)", "layout");
  redirect(`/profile/${userId}`);
}
