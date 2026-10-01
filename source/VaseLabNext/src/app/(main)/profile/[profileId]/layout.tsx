import Link from "next/link";
import { notFound } from "next/navigation";
import RequestTabs from "@/components/request/RequestTabs";
import StatusBadge from "@/components/request/StatusBadge";
import { getRequest } from "@/lib/requests";

type Props = {
  children: React.ReactNode;
  params: Promise<{ ProfileId: string }>;
};

/**
 * Page shell for the three request tabs. The background, the page header and
 * the card itself live here, so only what is inside the card swaps out when
 * navigating between Detail / Activity History / Message Log.
 */
export default async function RequestDetailLayout({ children, params }: Props) {
  const { ProfileId } = await params;


  return (
    <div>
            {children}
    </div>
  );
}