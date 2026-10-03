"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { User } from "@/lib/auth";
import {
  updateProfile, updatePassword, type ProfileState, type PasswordState,
} from "@/app/(main)/profile/[profileId]/edit/actions";

const inputClass = "h-11 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-black/20 focus:outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-red-500";
const buttonClass = "rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/85 disabled:opacity-60";
const cardClass = "rounded-2xl bg-white/90 p-6 ring-1 ring-black/10";

function Field({ id, label, error, children }: {
  id: string; label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

export default function EditProfileForm({ user }: { user: User }) {
  const initial: ProfileState = {
    values: { name: user.name, email: user.email, organization: user.organization ?? "" }, errors: {},
  };
  const [profile, profileAction, saving] = useActionState(updateProfile, initial);
  // Controlled profile fields preserve edits when a server action returns errors.
  const [values, setValues] = useState(initial.values);
  const [password, passwordAction, changing] = useActionState<PasswordState, FormData>(updatePassword, { errors: {} });

  return (
    <div className="flex flex-col gap-6">
      <section className={cardClass}>
        <h2 className="mb-5 text-xl font-bold">Profile details</h2>
        <form action={profileAction} className="space-y-5">
          <fieldset disabled={saving} className="space-y-5 disabled:opacity-60">
            {([
              { id: "name", label: "Full name", max: 255, autoComplete: "name" },
              { id: "email", label: "Email", max: 254, autoComplete: "email" },
              { id: "organization", label: "Organization (optional)", max: 150, autoComplete: "organization" },
            ] as const).map(({ id, label, max, autoComplete }) => (
              <Field key={id} id={id} label={label} error={profile.errors[id]}>
                <input id={id} name={id} type={id === "email" ? "email" : "text"}
                  required={id !== "organization"} maxLength={max} autoComplete={autoComplete}
                  value={values[id]} onChange={(event) => setValues({ ...values, [id]: event.target.value })}
                  className={inputClass} aria-invalid={!!profile.errors[id]}
                  aria-describedby={profile.errors[id] ? `${id}-error` : undefined} />
              </Field>
            ))}
          </fieldset>
          {profile.message && <p role="alert" className="text-sm text-red-600">{profile.message}</p>}
          <div className="flex items-center justify-end gap-4">
            <Link href={`/profile/${user.id}`} className="text-sm font-semibold">Cancel</Link>
            <button disabled={saving} className={buttonClass}>{saving ? "Saving…" : "Save profile"}</button>
          </div>
        </form>
      </section>

      <section id="password" className={`${cardClass} scroll-mt-8`}>
        <h2 className="mb-2 text-xl font-bold">Change password</h2>
        <p className="mb-5 text-sm text-muted-foreground">Use 12 to 128 characters for your new password.</p>
        <form action={passwordAction} className="space-y-5">
          <input type="text" name="username" autoComplete="username" value={user.email} readOnly hidden />
          <fieldset disabled={changing} className="space-y-5 disabled:opacity-60">
            {([
              { id: "currentPassword", label: "Current password", autoComplete: "current-password", max: 1024 },
              { id: "newPassword", label: "New password", autoComplete: "new-password", max: 128 },
              { id: "confirmPassword", label: "Confirm new password", autoComplete: "new-password", max: 128 },
            ] as const).map(({ id, label, autoComplete, max }) => (
              <Field key={id} id={id} label={label} error={password.errors[id]}>
                <input id={id} name={id} type="password" required autoComplete={autoComplete}
                  minLength={id === "currentPassword" ? undefined : 12} maxLength={max}
                  className={inputClass} aria-invalid={!!password.errors[id]}
                  aria-describedby={password.errors[id] ? `${id}-error` : undefined} />
              </Field>
            ))}
          </fieldset>
          {password.message && <p role={password.success ? "status" : "alert"}
            className={`text-sm ${password.success ? "text-green-700" : "text-red-600"}`}>{password.message}</p>}
          <div className="flex justify-end">
            <button disabled={changing} className={buttonClass}>{changing ? "Updating…" : "Update password"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
