// app/(mainroot)/Request/[id]/layout.tsx
import Link from "next/link"

export default async function RequestLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href="/Request">Manage Requests</Link> {" > "} Request #{id}
      </div>

      {/* Title + Status badge */}
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-bold">Request #{id}</h1>
        <span className="rounded-full border border-teal-500 text-teal-600 px-3 py-1 text-sm">
          Pending Review
        </span>
      </div>

      {/* Tabs */}
      <nav className="flex gap-6 mt-4 border-b pb-2">
        <Link href={`/Request/${id}`}>Detail</Link>
        <Link href={`/Request/${id}/activity-history`}>Activity History</Link>
        <Link href={`/Request/${id}/message-log`}>Message Log</Link>
      </nav>

      {/* Page content swaps here */}
      <div className="mt-6">{children}</div>
    </div>
  )
}