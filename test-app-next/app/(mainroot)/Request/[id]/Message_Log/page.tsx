// app/(mainroot)/Request/[id]/message-log/page.tsx

export default async function MessageLogPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <div>Message log for request #{id}</div>
}