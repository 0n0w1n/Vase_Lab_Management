import Link from "next/link";
// export default (one per file) can be call by any name without {}
import ExampleUi from "@/components/Example";

// normal export (one per file) needed to be call with exact name {Greeting}
import {Greeting} from "@/components/Example";

type Props = {
  params: Promise<{ profileId: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { profileId } = await params;   // "/profile/42" → "42"

  return <div>
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link
            href="/profile"
            className="transition-colors hover:text-foreground"
          >
            Profile
          </Link>
          <span className="px-1.5">/</span>
          <span aria-current="page">{profileId}</span>
        </nav>
        <h1 className="pt-1 text-4xl font-extrabold text-brand">
          Request #{profileId}
        </h1>
    Profile of user {profileId}
    </div>;
}
