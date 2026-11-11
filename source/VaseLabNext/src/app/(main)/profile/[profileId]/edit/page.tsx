import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { getUser } from "@/lib/auth";

export default async function EditProfilePage({ params }: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const user = await getUser(profileId);
  if (!user) notFound();

  // Glow and padding come from AppShell.
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit Profile"
        breadcrumbs={[{ label: "Profile", href: `/profile/${user.id}` }, { label: "Edit Profile" }]}
      />
      <EditProfileForm user={user} />
    </div>
  );
}
