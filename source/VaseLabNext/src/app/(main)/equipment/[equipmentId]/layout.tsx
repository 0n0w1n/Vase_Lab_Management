import Link from "next/link";
import { notFound } from "next/navigation";
import EquipmentTabs from "@/components/equipment/EquipmentTabs";
import { formatEquipmentId, getEquipmentById } from "@/lib/equipment";
import type { EquipmentState } from "@/types/equipment";
import { cn } from "cn";

type Props = {
  children: React.ReactNode;
  params: Promise<{ equipmentId: string }>;
};

const stateStyles: Record<EquipmentState, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-green-100 text-green-700" },
  in_use: { label: "In Use", className: "bg-blue-100 text-blue-700" },
  maintenance: { label: "Maintenance", className: "bg-amber-100 text-amber-700" },
  retired: { label: "Retired", className: "bg-gray-200 text-gray-600" },
};

export default async function EquipmentDetailLayout({ children, params }: Props) {
  const { equipmentId } = await params;
  if (!/^\d+$/.test(equipmentId)) notFound();

  const equipment = await getEquipmentById(Number(equipmentId));
  if (!equipment) notFound();

  const id = formatEquipmentId(equipment.id);
  const state = stateStyles[equipment.state];

  return (
    <div className="relative isolate min-h-screen overflow-hidden py-12">
      <BackgroundGlow />

      <div className="mx-auto max-w-5xl px-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/equipment" className="transition-colors hover:text-foreground">
            Lab Equipment
          </Link>
          <span className="px-1.5">/</span>
          <span aria-current="page">{id}</span>
        </nav>
        <h1 className="pt-1 text-4xl font-extrabold text-brand">{id}</h1>

        <section className="mt-10 rounded-3xl bg-white/45 p-8 shadow-lg ring-1 shadow-black/5 ring-white/80 backdrop-blur-xl">
          <header className="flex flex-wrap items-center justify-between gap-3 pb-5">
            <h2 className="font-heading text-2xl font-bold text-[#44607F]">
              {equipment.name}
            </h2>
            <span className={cn("w-fit rounded-full px-3 py-1.5 text-xs font-semibold", state.className)}>
              {state.label}
            </span>
          </header>

          <EquipmentTabs equipmentId={String(equipment.id)} />

          <div className="pt-6">{children}</div>
        </section>
      </div>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute top-20 left-[38%] size-80 rounded-full bg-[#5B92F5]/50 blur-sm" />
      <div className="absolute -bottom-28 -left-24 size-96 rounded-full bg-[#93E8C1]/50 blur-sm" />
      <div className="absolute -bottom-20 left-[52%] size-64 rounded-full bg-[#93E8C1]/50 blur-xl" />
      <div className="absolute right-16 bottom-16 size-72 rounded-full bg-[#5B92F5]/50 blur-xl" />
    </div>
  );
}