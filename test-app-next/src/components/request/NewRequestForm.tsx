"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import {
  submitNewRequest,
  type NewRequestField,
  type NewRequestState,
} from "@/app/Request/new/actions";
import type { RequestPriority } from "@/types/request";

const INITIAL_STATE: NewRequestState = {
  values: { title: "", notes: "", priority: "", deadline: "" },
  errors: {},
};

const PRIORITY_OPTIONS: { value: RequestPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const inputBox =
  "w-full rounded-md bg-white/80 px-3 text-sm text-foreground ring-1 ring-black/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-red-400";

/** aria wiring so screen readers announce the error under a field. */
function errorProps(id: NewRequestField, error?: string) {
  return error
    ? { "aria-invalid": true, "aria-describedby": `${id}-error` }
    : {};
}

type FieldProps = {
  id: NewRequestField;
  label: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="pb-1.5 text-sm font-semibold text-[#44607F]">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="pt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function NewRequestForm() {
  const [state, formAction, pending] = useActionState(
    submitNewRequest,
    INITIAL_STATE
  );
  const { values, errors } = state;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field id="title" label="Header" error={errors.title}>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={255}
          placeholder="Enter Header"
          defaultValue={values.title}
          className={cn(inputBox, "h-10")}
          {...errorProps("title", errors.title)}
        />
      </Field>

      <Field id="notes" label="Notes" error={errors.notes}>
        <textarea
          id="notes"
          name="notes"
          placeholder="Enter Detail"
          defaultValue={values.notes}
          className={cn(inputBox, "h-24 resize-none py-2.5")}
          {...errorProps("notes", errors.notes)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="priority" label="Priority" error={errors.priority}>
          <div className="relative">
            <select
              id="priority"
              name="priority"
              required
              defaultValue={values.priority}
              className={cn(inputBox, "h-10 appearance-none pr-9 invalid:text-muted-foreground")}
              {...errorProps("priority", errors.priority)}
            >
              <option value="" disabled>
                Select priority
              </option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-foreground">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </Field>

        <Field id="deadline" label="Deadline" error={errors.deadline}>
          <input
            id="deadline"
            name="deadline"
            type="date"
            required
            defaultValue={values.deadline}
            className={cn(inputBox, "h-10 invalid:text-muted-foreground")}
            {...errorProps("deadline", errors.deadline)}
          />
        </Field>
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Link
          href="/Request"
          className="grid h-10 place-items-center rounded-lg border border-[#44607F]/40 bg-white/70 px-6 text-sm font-semibold text-[#44607F] transition-colors hover:bg-white"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </form>
  );
}
