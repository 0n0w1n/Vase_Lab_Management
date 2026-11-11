import { notFound } from "next/navigation";
import AskToLeaveButton from "@/components/request/AskToLeaveButton";
import AttachmentList from "@/components/request/AttachmentList";
import CapacityForm from "@/components/request/CapacityForm";
import DetailField from "@/components/request/DetailField";
import ManageTas from "@/components/request/ManageTas";
import PriorityLabel from "@/components/request/PriorityLabel";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getRequest } from "@/lib/requests";
import { getWorkload } from "@/lib/workload";

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function RequestDetailPage({ params }: Props) {
  const { requestId } = await params;
  const request = await getRequest(requestId);

  if (!request) notFound();

  const user = await getCurrentUser();
  const isOpen = request.status !== "close" && request.status !== "reject";
  const canManage = user?.role === "lab_manager" && isOpen;
  const canLeave = user?.role === "lab_ta" && request.myAsk === "approved" && isOpen;
  // Only the manager's pop-up needs every TA, so nobody else pays for the call
  const tas = canManage
    ? (await getWorkload()).map(({ id, name, openCount }) => ({ id, name, openCount }))
    : [];

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
          {/* Names on the left, the action pinned top-right */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {request.assignees.length > 0 ? (
                request.assignees.join(", ")
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
            {canManage && (
              <ManageTas requestId={request.id} capacity={request.capacity} team={request.team} tas={tas} />
            )}
            {canLeave && <AskToLeaveButton requestId={request.id} requested={request.myLeaveRequested} />}
          </div>
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

      <AttachmentList
        requestId={request.id}
        attachments={request.files}
        canUpload={request.canUpload}
      />
    </div>
  );
}
