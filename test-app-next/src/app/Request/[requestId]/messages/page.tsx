import { notFound } from "next/navigation";
import MessageLog from "@/components/request/MessageLog";
import { getRequest } from "@/lib/requests";

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function MessageLogPage({ params }: Props) {
  const { requestId } = await params;
  const request = await getRequest(requestId);

  if (!request) notFound();

  return (
    <MessageLog
      messages={request.messages}
      author={{ name: "Definate", initials: "DF" }}
    />
  );
}
