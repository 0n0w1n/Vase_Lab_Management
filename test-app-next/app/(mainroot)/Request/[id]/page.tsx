// app/(mainroot)/Request/[id]/page.tsx

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div>
      <p>Detail content for request #{id} goes here.</p>
    </div>
  )
}