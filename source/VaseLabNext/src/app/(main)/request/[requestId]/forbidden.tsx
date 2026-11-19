/**
 * Shown inside the request card when one tab refuses access (e.g. Activity
 * History for a TA who isn't on the request), so the header and tabs stay.
 * Not being allowed to open the request at all still uses request/forbidden.tsx.
 */
export default function RequestTabForbidden() {
  return (
    <div className="grid place-items-center py-12 text-center">
      <h3 className="font-heading text-lg font-bold">Access denied</h3>
      <p className="pt-2 text-sm text-muted-foreground">
        You don&apos;t have access to this tab of the request.
      </p>
    </div>
  );
}
