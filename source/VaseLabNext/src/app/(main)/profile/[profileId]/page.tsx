import Link from "next/link";
import { Briefcase, Building2, CalendarDays, Clock, Mail } from "lucide-react";
import BackgroundGlow from "@/components/layout/BackgroundGlow";
import InitialsAvatar from "@/components/request/InitialsAvatar";

// Spacing 1 unit in tailwinds = 0.25 rems = 4 px
// Foreground -- color bind to main color of the page color: var(--foreground)

// ring and border 1 unit = 1 pixel

// mx-auto -- margin x auto such that element is always at the middle
// max-w-5xl -- max wide 5xl (64rem or 1024px)
// px-4 -- padding x (left and right) 16 pixels

// aria-label="Breadcrumb" -- navigation for disabled to know it is menu
// pb-3 -- padding bottom 3 rem = 12 pixels
// text-muted-foreground -- change text color to be more muted so it doesn't take away attention from reader

// hover:text-foreground -- when hover change text to foreground
// transition-colors -- gradually change color (when hovering in this case)

// rounded-3xl -- rounded by 3xl/ 24 px amount
// bg-white/60 -- white background transparency 60
// p-4 md:p-6 -- normal use padding all side 16 pixels. md (>768px ) p-6 (24 pixels)

// ring-3 ring-black/10 -- ring thibckness 3 px and ring black 10 transparency
// backdrop-blur-xl -- blur everything behind it

type Props = {
  params: Promise<{ profileId: string }>;
};

// TODO: replace with real data from the backend once there is a profile API.
const user = {
  name: "Sarah Jenkins",
  initials: "SJ",
  role: "Lab Member",
  email: "sarah.jenkins@vaselab.edu",
  lab: "VASE Lab",
  position: "Teacher Assistant (TA)",
  joined: "Oct 2023",
};

// White inner card, shared by the header card and the contact card.
const card = "rounded-2xl bg-white p-5 ring-1 ring-black/5";

export default async function ProfilePage({ params }: Props) {
  const { profileId } = await params;

  return (
    <div className="relative isolate min-h-screen overflow-hidden py-14">
      <BackgroundGlow />

      <div className="mx-auto max-w-5xl px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/request" className="transition-colors hover:text-foreground">
            Manage Requests
          </Link>
          <span className="px-1.5">/</span>
          <span aria-current="page">Profile #{profileId}</span>
        </nav>

        <h1 className="pt-1 pb-3 text-4xl font-extrabold text-brand">Profile</h1>

        {/* flex-col + gap-4 stacks the two cards with 16px between them */}
        <div className="flex flex-col gap-4 rounded-3xl bg-white/60 p-4 md:p-6 ring-3 ring-black/10 backdrop-blur-xl">
          {/* Header card: stacks on mobile, side by side from md up */}
          <section className={`${card} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
            <div className="flex items-center gap-4">
              <InitialsAvatar initials={user.initials} className="size-16 text-lg" />

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand ring-1 ring-brand">
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5" /> {user.lab}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" /> Joined {user.joined}
                  </span>
                </div>
              </div>
            </div>

            {/* TODO: wire these up — no edit or settings pages yet. */}
            <div className="flex flex-col gap-2">
              <button type="button" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/85">
                Edit Profile
              </button>
              <button type="button" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold ring-1 ring-black/10 hover:bg-black/5">
                Account Settings
              </button>
            </div>
          </section>

          {/* Contact card */}
          <section className={card}>
            <h3 className="pb-3 font-bold">Contact &amp; Organization</h3>
            <ul className="flex flex-col gap-3 text-sm font-medium">
              <ContactRow icon={<Mail className="size-4" />} text={user.email} />
              <ContactRow icon={<Building2 className="size-4" />} text={user.lab} />
              <ContactRow icon={<Briefcase className="size-4" />} text={user.position} />
              <ContactRow icon={<Clock className="size-4" />} text={`Created: ${user.joined}`} />
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

/** One line in the contact card: a brand-coloured icon followed by text. */
function ContactRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="text-brand">{icon}</span>
      {text}
    </li>
  );
}
