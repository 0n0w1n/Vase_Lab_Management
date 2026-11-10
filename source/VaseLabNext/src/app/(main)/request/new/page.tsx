import Link from "next/link";
import NewRequestForm from "@/components/request/NewRequestForm";

export const metadata = {
  title: "New Request",
};

export default function NewRequestPage() {
  return (
    <div>
      <div className="px-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/request" className="transition-colors hover:text-foreground">
            Manage Requests
          </Link>
          <span className="px-1.5">/</span>
          <span aria-current="page">New Request</span>
        </nav>
        <h1 className="pt-1 text-4xl font-extrabold text-brand">
          New Request
        </h1>
      </div>

      <div className="px-6 pt-16">
        <section className="mx-auto max-w-xl rounded-3xl bg-white/45 p-8 shadow-lg ring-1 shadow-black/5 ring-white/80 backdrop-blur-xl">
          <h2 className="pb-5 text-2xl font-bold text-[#44607F]">Request</h2>
          <NewRequestForm />
        </section>
      </div>
    </div>
  );
}
