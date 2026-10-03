import Link from "next/link";
import { notFound } from "next/navigation";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { getUser } from "@/lib/auth";

export default async function EditProfilePage({ params }: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const user = await getUser(profileId);
  if (!user) notFound();

  return (
    <div className="relative isolate min-h-screen overflow-hidden py-14">
      <BackgroundGlow />
      <div className="mx-auto max-w-3xl px-8">
        <Link href={`/profile/${user.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          Back to profile
        </Link>
        <h1 className="pt-2 pb-6 text-4xl font-extrabold text-brand">Edit Profile</h1>
        <EditProfileForm user={user} />
      </div>
    </div>
  );
}
