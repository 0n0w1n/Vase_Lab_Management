import AppShell from "@/components/layout/AppShell";

export default function ExampleLayout({children} : {children : React.ReactNode}) {
  return <AppShell>{children}</AppShell>;
}