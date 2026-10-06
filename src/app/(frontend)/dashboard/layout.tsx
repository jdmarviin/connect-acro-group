import AppShell from "@/components/AppShell";
import { participantContext } from "@/lib/participant";
import './workspace.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, locale } = await participantContext();
  return <AppShell name={user.name} locale={locale}>{children}</AppShell>;
}
