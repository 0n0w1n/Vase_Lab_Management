import UrlFilterMenu from "@/components/ui/UrlFilterMenu";

type Props<T extends string> = {
  /** The search param this filter owns, e.g. "status" for ?status=… */
  param: string;
  /** Button text: "Status Filter", or "Status: <pill>" once picked */
  label: string;
  /** The values this param can take; each one is what goes in the URL */
  options: readonly T[];
  /** How to show a value in the menu, e.g. (v) => <StatusPill status={v} />. Defaults to the raw value. */
  optionPill?: (value: T) => React.ReactNode;
};

/**
 * A filter dropdown backed by one URL search param, so any number can sit side
 * by side. The page reads the same params on the server to do the filtering.
 *
 * No "use client" on purpose: optionPill is a function, and functions can't be
 * passed to a client component. So the pills are rendered here, on the server,
 * and only the finished JSX goes to the client menu.
 */
export default function UrlFilter<T extends string>({
  param,
  label,
  options,
  optionPill,
}: Props<T>) {
  return (
    <UrlFilterMenu
      param={param}
      label={label}
      options={options.map((value) => ({
        value,
        label: optionPill ? optionPill(value) : value,
      }))}
    />
  );
}
