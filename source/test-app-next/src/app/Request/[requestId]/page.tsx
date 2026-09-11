import { notFound } from "next/navigation";
import AttachmentList from "@/components/request/AttachmentList";
import DetailField from "@/components/request/DetailField";
import PriorityLabel from "@/components/request/PriorityLabel";
import { formatDateTime } from "@/lib/format";
import { getRequest } from "@/lib/requests";

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function RequestDetailPage({ params }: Props) {
  const { requestId } = await params;
  const request = await getRequest(requestId);

  if (!request) notFound();

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
          {request.assignedTo ?? (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </DetailField>
        <DetailField label="Description">
          <p className="leading-relaxed font-normal">{request.description}</p>
        </DetailField>
      </div>

      <AttachmentList attachments={request.attachments} />
    </div>
  );
}
