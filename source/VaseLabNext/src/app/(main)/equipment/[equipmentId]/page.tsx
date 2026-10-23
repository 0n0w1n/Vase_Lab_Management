import { notFound } from "next/navigation";
import DetailField from "@/components/request/DetailField";
import { formatDate } from "@/lib/format";
import { getEquipmentById } from "@/lib/equipment";

type Props = {
  params: Promise<{ equipmentId: string }>;
};

export default async function EquipmentDetailPage({ params }: Props) {
  const { equipmentId } = await params;
  if (!/^\d+$/.test(equipmentId)) notFound();

  const equipment = await getEquipmentById(Number(equipmentId));
  if (!equipment) notFound();

  const inUse = equipment.state === "in_use";

  return (
    <section aria-labelledby="equipment-detail-heading">
      <h3 id="equipment-detail-heading" className="sr-only">Equipment details</h3>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <DetailField label="Name">{equipment.name}</DetailField>
        <DetailField label="Model">{equipment.model || <MutedDash />}</DetailField>
        <DetailField label="Type">{equipment.type || <MutedDash />}</DetailField>
        <DetailField label="Current User">
          {inUse && equipment.currentUser ? equipment.currentUser : <MutedDash />}
        </DetailField>
        <DetailField label="Expected Return">
          {inUse && equipment.expectedReturn ? formatDate(equipment.expectedReturn) : <MutedDash />}
        </DetailField>
        <DetailField label="Added">{formatDate(equipment.addedAt)}</DetailField>
        <DetailField label="Description" className="md:col-span-2">
          <p className="leading-relaxed font-normal">
            {equipment.description || <MutedDash />}
          </p>
        </DetailField>
      </div>
    </section>
  );
}

function MutedDash() {
  return <span className="text-muted-foreground">—</span>;
}