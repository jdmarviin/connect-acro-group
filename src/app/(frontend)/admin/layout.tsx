import AppShell from "@/components/AppShell";
import { cookies } from 'next/headers';
import '../dashboard/workspace.css';

import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const locale = (await cookies()).get('NEXT_LOCALE')?.value === 'pt' ? 'pt' : 'ht';
  return <AppShell name={user.name} locale={locale} manager>{children}</AppShell>;
}
