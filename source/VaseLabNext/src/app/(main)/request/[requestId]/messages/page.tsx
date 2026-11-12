import { notFound } from "next/navigation";
import MessageLog from "@/components/request/MessageLog";
import { getRequestComments } from "@/lib/requests";

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function MessageLogPage({ params }: Props) {
  const { requestId } = await params;
  const messages = await getRequestComments(requestId);

  if (!messages) notFound();

  return <MessageLog key={requestId} requestId={requestId} messages={messages} />;
}
