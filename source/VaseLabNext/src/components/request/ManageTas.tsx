"use client";

import { useState, useTransition } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Search, Users, X } from "lucide-react";
import { assignTa, unassignTa, type ActionState } from "@/app/(main)/request/[requestId]/actions";
import { useAlert } from "@/components/ui/Alert";
import { Modal, saveButton } from "@/components/ui/Modal";
import type { TeamMember } from "@/types/request";

type Ta = { id: string; name: string; openCount: number };
/** { value, label } lets the Combobox search by name without extra props */
type Option = Ta & { value: string; label: string; member?: TeamMember };

type Props = {
  requestId: string;
  capacity: number;
  team: TeamMember[];
  /** every TA in the lab */
  tas: Ta[];
};

// Same look as the Status / Priority filter menus
const itemClass =
  "flex cursor-default items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm font-semibold text-slate-800 outline-none select-none data-highlighted:bg-slate-100 data-disabled:cursor-not-allowed data-disabled:opacity-50";

/** Lab manager only: add TAs from a searchable list, or remove them, each click saving straight away. */
export default function ManageTas({ requestId, capacity, team, tas }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const showAlert = useAlert();

  const assigned = team.filter((member) => member.state === "approved");
  const full = assigned.length >= capacity;
  const members = new Map(team.map((member) => [member.id, member]));
  const options: Option[] = tas.map((ta) => ({ ...ta, value: ta.id, label: ta.name, member: members.get(ta.id) }));

  function save(change: () => Promise<ActionState>, success: string) {
    startTransition(async () => {
      const result = await change();
      showAlert(result.message ? "error" : "success", result.message ?? success);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-sidebar px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sidebar/85"
      >
        <Users className="size-3.5" />
        Manage
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Manage TAs"
        description={`${assigned.length} / ${capacity} ${capacity === 1 ? "TA" : "TAs"} on this request`}
      >
        <div className="flex flex-col gap-4 pt-4">
          <Combobox.Root
            items={options}
            value={null}
            inputValue={query}
            // Picking a TA saves straight away, so clear the search instead of showing their name in it
            onInputValueChange={(next, { reason }) => setQuery(reason === "item-press" ? "" : next)}
            onValueChange={(option: Option | null) => {
              if (option) save(() => assignTa(requestId, option.id), `${option.name} was added.`);
            }}
          >
            <Combobox.InputGroup className="flex h-10 items-center gap-2 rounded-lg bg-white px-3 ring-1 ring-surface-border focus-within:ring-2 focus-within:ring-brand">
              <Search className="size-4 text-muted-foreground" />
              <Combobox.Input
                placeholder="Search TAs…"
                aria-label="Search TAs"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </Combobox.InputGroup>

            <Combobox.Portal>
              {/* Above the modal (z-50) it opens from */}
              <Combobox.Positioner sideOffset={6} className="z-[60] outline-none">
                <Combobox.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/10 outline-none">
                  {full && (
                    <p className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">
                      This request is full. Raise its capacity to add more TAs.
                    </p>
                  )}
                  <Combobox.Empty>
                    <p className="px-2 py-3 text-sm text-muted-foreground">No TAs match that name.</p>
                  </Combobox.Empty>
                  <Combobox.List className="max-h-[min(16rem,var(--available-height))] overflow-y-auto">
                    {(option: Option) => {
                      const onIt = option.member?.state === "approved";
                      return (
                        <Combobox.Item
                          key={option.id}
                          value={option}
                          disabled={pending || onIt || full}
                          className={itemClass}
                        >
                          <span className="min-w-0 truncate">{option.name}</span>
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {onIt ? (
                              "Already assigned"
                            ) : (
                              <>
                                {option.member?.state === "waiting" && (
                                  <span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">Asked</span>
                                )}
                                {option.openCount} open
                              </>
                            )}
                          </span>
                        </Combobox.Item>
                      );
                    }}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>

          <section>
            <h3 className="pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              On this request
            </h3>
            {assigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">No TAs yet. Pick one from the search above.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-black/5 rounded-lg ring-1 ring-black/5">
                {assigned.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                      <span className="truncate">{member.name}</span>
                      {member.leaving && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-800">
                          Wants to leave
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => save(() => unassignTa(requestId, member.id), `${member.name} was removed.`)}
                      aria-label={`Remove ${member.name}`}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex justify-end">
            <button type="button" onClick={() => setOpen(false)} className={saveButton}>
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
