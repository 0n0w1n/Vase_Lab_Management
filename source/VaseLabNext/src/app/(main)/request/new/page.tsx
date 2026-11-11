import PageHeader from "@/components/layout/PageHeader";
import NewRequestForm from "@/components/request/NewRequestForm";

export const metadata = {
  title: "New Request",
};

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="New Request"
        breadcrumbs={[{ label: "Manage Requests", href: "/request" }, { label: "New Request" }]}
      />

      <section className="mx-auto max-w-xl rounded-3xl bg-white/45 p-8 shadow-lg ring-1 shadow-black/5 ring-white/80 backdrop-blur-xl">
        <h2 className="pb-5 text-2xl font-bold text-[#44607F]">Request</h2>
        <NewRequestForm />
      </section>
    </div>
  );
}
