import { notFound } from "next/navigation";
import AttachmentList from "@/components/request/AttachmentList";
import CapacityForm from "@/components/request/CapacityForm";
import DetailField from "@/components/request/DetailField";
import PriorityLabel from "@/components/request/PriorityLabel";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getRequest } from "@/lib/requests";

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function RequestDetailPage({ params }: Props) {
  const { requestId } = await params;
  const request = await getRequest(requestId);

  if (!request) notFound();

  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-start gap-4 md:grid-cols-2">
        <DetailField label="Request Title">{request.title}</DetailField>
        <DetailField label="Requested By">{request.requestedBy}</DetailField>

        <DetailField label="Date Submitted">
          {request.submittedAt ? (
            formatDateTime(request.submittedAt)
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DetailField>
        <DetailField label="Priority">
          <PriorityLabel priority={request.priority} />
        </DetailField>

        <DetailField label="Assigned To">
          {request.assignees.length > 0 ? (
            request.assignees.join(", ")
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </DetailField>
        <DetailField label="Capacity">
          {/* Only the lab manager can change it; everyone else just sees how full it is */}
          {user?.role === "lab_manager" ? (
            <CapacityForm
              requestId={request.id}
              capacity={request.capacity}
              assignedCount={request.assignedCount}
            />
          ) : (
            `${request.assignedCount} / ${request.capacity} ${request.capacity === 1 ? "TA" : "TAs"}`
          )}
        </DetailField>

        {/* Free text, so it gets the full width rather than half a row. */}
        <DetailField label="Description" className="md:col-span-2">
          <p className="leading-relaxed font-normal">{request.details}</p>
        </DetailField>
      </div>

      <AttachmentList attachments={request.files} />
    </div>
  );
}
