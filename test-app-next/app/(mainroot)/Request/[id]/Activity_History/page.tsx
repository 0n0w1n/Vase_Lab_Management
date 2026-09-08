// app/(mainroot)/Request/[id]/activity-history/page.tsx

export default async function ActivityHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <div>Activity history for request #{id}</div>
}