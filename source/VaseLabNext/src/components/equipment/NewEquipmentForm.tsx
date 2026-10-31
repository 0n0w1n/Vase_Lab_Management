"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cn } from "cn";
import { SendForm } from "@/app/(main)/equipment/new/action";
import type {
  EquipmentState,
  NewEquipmentField,
  NewEquipmentState,
} from "@/types/equipment";

const INITIAL_STATE: NewEquipmentState = {
  values: {name: "", model: "", state: "available", description: "",},
  errors: {},
};

const STATE_OPTIONS: { value: EquipmentState; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const inputBox =
  "w-full rounded-md bg-white/80 px-3 text-sm text-foreground ring-1 ring-black/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-red-400";

function errorProps(id: NewEquipmentField, error?: string) {
  return error
    ? { "aria-invalid": true, "aria-describedby": `${id}-error` }
    : {};
}

type FieldProps = {
  id: NewEquipmentField;
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

export default function NewEquipmentForm() {
  const [state, formAction, pending] = useActionState(SendForm, INITIAL_STATE);
  const { values, errors } = state;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Field id="name" label="Name" error={errors.name}>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={140}
              defaultValue={values.name}
              placeholder="Enter equipment name"
              className={cn(inputBox, "h-10")}
              {...errorProps("name", errors.name)}
            />
          </Field>
        </div>

        <div className="flex-1">
          <Field id="model" label="Model" error={errors.model}>
            <input
              id="model"
              name="model"
              type="text"
              maxLength={140}
              defaultValue={values.model}
              placeholder="Enter model"
              className={cn(inputBox, "h-10")}
              {...errorProps("model", errors.model)}
            />
          </Field>
        </div>
      </div>

      <Field id="state" label="State" error={errors.state}>
        <select
          id="state"
          name="state"
          required
          defaultValue={values.state}
          className={cn(inputBox, "h-10")}
          {...errorProps("state", errors.state)}
        >
          {STATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field id="description" label="Description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          placeholder="Enter description"
          className={cn(inputBox, "h-24 resize-none py-2.5")}
          {...errorProps("description", errors.description)}
        />
      </Field>

      {state.message && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Link
          href="/equipment"
          className="grid h-10 place-items-center rounded-lg border border-[#44607F]/40 bg-white/70 px-6 text-sm font-semibold text-[#44607F]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create Equipment"}
        </button>
      </div>
    </form>
  );
}