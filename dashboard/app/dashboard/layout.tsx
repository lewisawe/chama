'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';

interface Chama { id: string; name: string; myRole: string; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [chama, setChama] = useState<Chama | null>(null);
  const [ready, setReady] = useState(false);

  // Allow /dashboard/create without a chama
  const isCreatePage = pathname === '/dashboard/create';

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.push('/login'); return; }
    api.get<Chama[]>('/api/chamas').then(chamas => {
      if (chamas.length === 0) {
        router.replace('/dashboard/create');
        if (isCreatePage) setReady(true);
        return;
      }

      const adminChamas = chamas.filter(c => c.myRole === 'ADMIN' || c.myRole === 'TREASURER');
      if (adminChamas.length === 0) {
        localStorage.removeItem('cp_chama');
        router.replace('/member');
        return;
      }

      // Check if stored chama is one the user is admin/treasurer of
      const stored = localStorage.getItem('cp_chama');
      let selected: Chama | undefined;
      if (stored) {
        const parsed = JSON.parse(stored);
        selected = adminChamas.find(c => c.id === parsed.id);
      }
      // Fall back to first admin chama if stored one is invalid
      if (!selected) selected = adminChamas[0];

      setChama(selected);
      localStorage.setItem('cp_chama', JSON.stringify(selected));
      setReady(true);
    }).catch(() => { router.replace('/login'); });
  }, [router, isCreatePage]);

  if (!ready && !isCreatePage) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar role="treasurer" chamaName={chama?.name} />
      <main className="flex-1 overflow-auto pb-20 md:pb-0" style={{ marginLeft: 'var(--sidebar-w)' }}>
        {children}
      </main>
    </div>
  );
}
