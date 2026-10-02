import Link from "next/link";

export default function RequestForbidden() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <h1 className="font-heading text-2xl font-bold">Access denied</h1>
      <p className="pt-2 text-sm text-muted-foreground">
        You can only open requests you submitted.
      </p>
      <Link
        href="/request"
        className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/85"
      >
        Back to Manage Requests
      </Link>
    </div>
  );
}
