import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import EquipmentTabs from "@/components/equipment/EquipmentTabs";
import { EquipmentActions } from "@/components/equipment/ActionPopups";
import { getCurrentUser } from "@/lib/auth";
import { getEquipmentById } from "@/lib/equipment";
import { formatEquipmentId } from "@/lib/format";
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

  const [equipment, user] = await Promise.all([
    getEquipmentById(Number(equipmentId)),
    getCurrentUser(),
  ]);
  if (!equipment) notFound();

  const canManage = user?.role === "lab_manager" || user?.role === "admin";

  const id = formatEquipmentId(equipment.id);
  const state = stateStyles[equipment.state];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={id}
        breadcrumbs={[{ label: "Lab Equipment", href: "/equipment" }, { label: id }]}
      />

      <section className="rounded-3xl bg-white/45 p-8 shadow-lg ring-1 shadow-black/5 ring-white/80 backdrop-blur-xl">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-5">
          <h2 className="font-heading text-2xl font-bold text-[#44607F]">
            {equipment.name}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn("w-fit rounded-full px-3 py-1.5 text-xs font-semibold", state.className)}>
              {state.label}
            </span>
            {canManage && <EquipmentActions item={equipment} variant="buttons" />}
          </div>
        </header>

        <EquipmentTabs equipmentId={String(equipment.id)} />

        <div className="pt-6">{children}</div>
      </section>
    </div>
  );
}
