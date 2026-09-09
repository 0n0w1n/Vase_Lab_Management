import AppShell from "@/components/layout/AppShell";

type Props = {
  children: React.ReactNode;
};

export default function RequestLayout({ children }: Props) {
  return <AppShell>{children}</AppShell>;
}
