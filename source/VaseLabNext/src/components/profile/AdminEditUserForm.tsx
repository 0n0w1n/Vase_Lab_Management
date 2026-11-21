"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { User } from "@/lib/auth";
import { adminUpdateUser, type AdminUserState } from "@/app/(main)/profile/[profileId]/edit/actions";

const inputClass = "h-12 min-w-0 w-full rounded-lg bg-white px-3 text-base sm:text-sm ring-1 ring-black/20 focus:outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-red-500";
const buttonClass = "min-h-11 w-full rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/85 disabled:opacity-60 sm:w-auto";
const cardClass = "min-w-0 rounded-2xl bg-white/90 p-4 sm:p-6 ring-1 ring-black/10";

const ROLES = [
  { value: "visitor", label: "Visitor" },
  { value: "lab_member", label: "Lab Member" },
  { value: "lab_ta", label: "Lab TA" },
  { value: "lab_manager", label: "Lab Manager" },
  { value: "admin", label: "Admin" },
];

type FieldId = keyof AdminUserState["errors"];

function Field({ id, label, error, children }: {
  id: FieldId; label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600 [overflow-wrap:anywhere]" role="alert">{error}</p>}
    </div>
  );
}

/** Admin editing any profile, their own included: details, role, and an optional password reset in one form. */
export default function AdminEditUserForm({ user }: { user: User }) {
  const initial: AdminUserState = {
    values: { name: user.name, email: user.email, organization: user.organization ?? "", role: user.role }, errors: {},
  };
  const [state, action, saving] = useActionState(adminUpdateUser.bind(null, user.id), initial);
  // Controlled fields keep edits when the server action returns errors.
  const [values, setValues] = useState(initial.values);
  const invalid = (id: FieldId) => ({
    "aria-invalid": !!state.errors[id],
    "aria-describedby": state.errors[id] ? `${id}-error` : undefined,
  });

  return (
    <form action={action} className={`${cardClass} space-y-5`}>
      <div>
        <h2 className="text-xl font-bold">Edit {user.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">{user.email}</p>
      </div>
      <fieldset disabled={saving} className="min-w-0 space-y-5 disabled:opacity-60">
        <Field id="name" label="Full name" error={state.errors.name}>
          <input id="name" name="name" required maxLength={255} autoComplete="off" className={inputClass} {...invalid("name")}
            value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
        </Field>
        <Field id="email" label="Email" error={state.errors.email}>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="off" className={inputClass} {...invalid("email")}
            value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
        </Field>
        <Field id="organization" label="Organization (optional)" error={state.errors.organization}>
          <input id="organization" name="organization" maxLength={150} autoComplete="off" className={inputClass} {...invalid("organization")}
            value={values.organization} onChange={(event) => setValues({ ...values, organization: event.target.value })} />
        </Field>
        <Field id="role" label="Role" error={state.errors.role}>
          <select id="role" name="role" className={inputClass} {...invalid("role")}
            value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value })}>
            {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
        </Field>

        <div className="border-t border-black/10 pt-5">
          <h3 className="font-bold">Reset password</h3>
          <p className="mt-1 text-sm text-muted-foreground">Leave blank to keep the current password. Otherwise use 12 to 128 characters.</p>
        </div>
        <Field id="newPassword" label="New password" error={state.errors.newPassword}>
          <input id="newPassword" name="newPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password"
            className={inputClass} {...invalid("newPassword")} />
        </Field>
        <Field id="confirmPassword" label="Confirm new password" error={state.errors.confirmPassword}>
          <input id="confirmPassword" name="confirmPassword" type="password" maxLength={128} autoComplete="new-password"
            className={inputClass} {...invalid("confirmPassword")} />
        </Field>
      </fieldset>
      {state.message && <p role="alert" className="text-sm text-red-600">{state.message}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <Link href={`/profile/${user.id}`} className="flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold ring-1 ring-black/10 sm:ring-0">Cancel</Link>
        <button disabled={saving} className={buttonClass}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  );
}
