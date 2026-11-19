import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import NewEquipmentForm from "@/components/equipment/NewEquipmentForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "New Equipment",
};

export default async function NewEquipmentPage() {
  // Lab managers, admins and TAs only (SRS-12); Flask checks again on submit
  const user = await getCurrentUser();
  if (user?.role !== "lab_manager" && user?.role !== "admin" && user?.role !== "lab_ta") redirect("/equipment");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="New Equipment"
        breadcrumbs={[{ label: "Manage Equipment", href: "/equipment" }, { label: "New Equipment" }]}
      />

      <section className="mx-auto max-w-xl rounded-3xl bg-white/45 p-8 shadow-lg ring-1 shadow-black/5 ring-white/80 backdrop-blur-xl">
        <h2 className="pb-5 text-2xl font-bold text-[#44607F]">Equipment</h2>
        <NewEquipmentForm />
      </section>
    </div>
  );
}