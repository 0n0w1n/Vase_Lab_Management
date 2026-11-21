import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import AdminEditUserForm from "@/components/profile/AdminEditUserForm";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { getCurrentUser, getUser } from "@/lib/auth";

export default async function EditProfilePage({ params }: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const [user, viewer] = await Promise.all([getUser(profileId), getCurrentUser()]);
  if (!user) notFound();
  // Only the owner, or an admin, may edit a profile
  if (!user.isOwner && viewer?.role !== "admin") redirect(`/profile/${user.id}`);

  // Glow and padding come from AppShell.
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit Profile"
        breadcrumbs={[{ label: "Profile", href: `/profile/${user.id}` }, { label: "Edit Profile" }]}
      />
      {/* Admins get the full form everywhere, even on their own profile */}
      {viewer?.role === "admin" ? <AdminEditUserForm user={user} /> : <EditProfileForm user={user} />}
    </div>
  );
}
