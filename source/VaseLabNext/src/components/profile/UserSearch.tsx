"use client";

import { useRouter } from "next/navigation";
import { Combobox } from "@base-ui/react/combobox";
import { Search } from "lucide-react";
import type { UserSummary } from "@/lib/auth";

/** { value, label } lets the Combobox search by name without extra props */
type Option = UserSummary & { value: string; label: string };

const itemClass =
  "flex cursor-default items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-slate-100";

/** Admin only: find anyone by name or email and jump to editing their profile. */
export default function UserSearch({ users }: { users: UserSummary[] }) {
  const router = useRouter();
  // Email in the label so typing an address finds the person too
  const options: Option[] = users.map((user) => ({ ...user, value: user.id, label: `${user.name} ${user.email}` }));

  return (
    <section aria-labelledby="user-search-title" className="mt-8">
      <h2 id="user-search-title" className="mb-5 text-3xl font-extrabold text-brand">Edit a User</h2>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-black/15 md:p-6">
        <Combobox.Root
          items={options}
          value={null}
          onValueChange={(option: Option | null) => {
            if (option) router.push(`/profile/${option.id}/edit`);
          }}
        >
          <Combobox.InputGroup className="flex h-12 items-center gap-2 rounded-lg bg-slate-50 px-4 ring-1 ring-black/20 focus-within:ring-2 focus-within:ring-brand">
            <Search className="size-4 text-muted-foreground" />
            <Combobox.Input
              placeholder="Search by name or email…"
              aria-label="Search users"
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
            />
          </Combobox.InputGroup>

          <Combobox.Portal>
            <Combobox.Positioner sideOffset={6} className="z-50 outline-none">
              <Combobox.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/10 outline-none">
                <Combobox.Empty>
                  <p className="px-2 py-3 text-sm text-muted-foreground">No users match that search.</p>
                </Combobox.Empty>
                <Combobox.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
                  {(option: Option) => (
                    <Combobox.Item key={option.id} value={option} className={itemClass}>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-800">{option.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{option.email}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-semibold text-brand uppercase">
                        {option.role.replaceAll("_", " ")}
                      </span>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      </div>
    </section>
  );
}
