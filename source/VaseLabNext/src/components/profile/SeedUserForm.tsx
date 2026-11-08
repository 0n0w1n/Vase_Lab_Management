"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { seedUser, type SeedUserState } from "@/app/(main)/profile/seed-actions";

const emptyValues = { name: "", email: "", organization: "", role: "visitor" };
const inputClass = "mt-2 h-12 w-full rounded-lg bg-slate-50 px-4 text-sm ring-1 ring-black/20 focus:outline-none focus:ring-2 focus:ring-brand";

export default function SeedUserForm() {
  const [values, setValues] = useState(emptyValues);
  const [state, action, pending] = useActionState<SeedUserState, FormData>(async (previous, formData) => {
    const result = await seedUser(previous, formData);
    if (result.userId) setValues(emptyValues);
    return result;
  }, {});

  return (
    <section aria-labelledby="seed-user-title" className="mt-8">
      <h2 id="seed-user-title" className="mb-5 text-3xl font-extrabold text-brand">Admin User Registration</h2>
      <form action={action} className="rounded-2xl bg-white p-5 ring-1 ring-black/15 md:p-6">
        <fieldset disabled={pending} className="grid gap-5 md:grid-cols-2 disabled:opacity-60">
          <legend className="sr-only">New user details</legend>
          <label htmlFor="seed-name" className="text-sm font-semibold">Full Name
            <input id="seed-name" name="name" required maxLength={255} autoComplete="off" placeholder="Enter full name" className={inputClass}
              value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
          </label>
          <label htmlFor="seed-email" className="text-sm font-semibold">Email
            <input id="seed-email" name="email" type="email" required maxLength={254} autoComplete="off" placeholder="user@example.com" className={inputClass}
              value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
          </label>
          <label htmlFor="seed-password" className="text-sm font-semibold">Password
            <input id="seed-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password"
              aria-describedby="seed-password-help" className={inputClass} />
          </label>
          <label htmlFor="seed-organization" className="text-sm font-semibold">Organization (Optional)
            <input id="seed-organization" name="organization" maxLength={150} autoComplete="off" placeholder="e.g. VASE Lab" className={inputClass}
              value={values.organization} onChange={(event) => setValues({ ...values, organization: event.target.value })} />
          </label>
          <label htmlFor="seed-role" className="text-sm font-semibold md:col-span-2">User Role
            <select id="seed-role" name="role" className={inputClass} value={values.role}
              onChange={(event) => setValues({ ...values, role: event.target.value })}>
              <option value="visitor">Visitor</option>
              <option value="lab_member">Lab Member</option>
              <option value="lab_ta">Lab TA</option>
              <option value="lab_manager">Lab Manager</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </fieldset>
        {state.message && <p role={state.userId ? "status" : "alert"} className={`mt-5 text-sm ${state.userId ? "text-green-700" : "text-red-600"}`}>
          {state.message} {state.userId && <Link href={`/profile/${state.userId}`} className="font-semibold underline">View profile</Link>}
        </p>}
        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={pending} className="rounded-lg bg-brand px-6 py-3 text-sm font-bold text-brand-foreground hover:bg-brand/85 disabled:opacity-60">
            {pending ? "Creating user…" : "Seed User"}
          </button>
        </div>
      </form>
    </section>
  );
}
