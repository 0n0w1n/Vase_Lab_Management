import Link from "next/link";
import NewRequestForm from "@/components/request/NewRequestForm";

export const metadata = {
  title: "New Request",
};

export default function NewRequestPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden py-12">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -top-16 -right-16 size-72 rounded-full bg-[#4B3FBD]/85 blur-xl" />
        <div className="absolute top-24 left-[42%] size-72 rounded-full bg-[#5B92F5]/80 blur-xl" />
        <div className="absolute top-[26rem] left-[28%] size-80 rounded-full bg-[#93E8C1]/60 blur-xl" />
        <div className="absolute -bottom-24 -left-20 size-72 rounded-full bg-[#93E8C1]/60 blur-xl" />
        <div className="absolute right-20 bottom-16 size-40 rounded-full bg-[#5B92F5]/60 blur-xl" />
        <div className="absolute -bottom-8 left-[65%] size-24 rounded-full bg-[#93E8C1]/60 blur-xl" />
      </div>

      <div className="px-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/Request" className="transition-colors hover:text-foreground">
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
