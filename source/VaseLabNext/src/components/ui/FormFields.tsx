import { cn } from "cn";

export const inputBox =
  "w-full rounded-md bg-white/80 px-3 text-sm text-foreground ring-1 ring-black/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-red-400";

/** aria wiring so screen readers announce the error under a field. */
export function errorProps(id: string, error?: string) {
  return error
    ? { "aria-invalid": true, "aria-describedby": `${id}-error` }
    : {};
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
};

/** Label above, error below, any input in between. */
export function Field({ id, label, error, children }: FieldProps) {
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

// `name` doubles as the id. Everything else (type, required, defaultValue…)
// passes straight through to the element.
type Common = { name: string; label: string; error?: string };

export function TextInput({ name, label, error, className, ...rest }: Common & React.ComponentProps<"input">) {
  return (
    <Field id={name} label={label} error={error}>
      <input id={name} name={name} className={cn(inputBox, "h-10", className)} {...errorProps(name, error)} {...rest} />
    </Field>
  );
}

export function TextArea({ name, label, error, className, ...rest }: Common & React.ComponentProps<"textarea">) {
  return (
    <Field id={name} label={label} error={error}>
      <textarea id={name} name={name} className={cn(inputBox, "h-24 resize-none py-2.5", className)} {...errorProps(name, error)} {...rest} />
    </Field>
  );
}

type Option = { value: string; label: string };

export function SelectInput({ name, label, error, options, className, ...rest }: Common & { options: Option[] } & React.ComponentProps<"select">) {
  return (
    <Field id={name} label={label} error={error}>
      <select id={name} name={name} className={cn(inputBox, "h-10", className)} {...errorProps(name, error)} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
