import AppShell from "@/components/layout/AppShell";

export default function RequestLayout({children} : {children : React.ReactNode}) {
  return <AppShell>{children}</AppShell>;
}
