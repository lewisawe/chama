'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAuth()) { router.push('/login'); return; }
    api.get<any[]>('/api/chamas').then(chamas => {
      if (chamas.length === 0) {
        router.replace('/dashboard/create');
      } else {
        setReady(true);
      }
    }).catch(() => { router.replace('/login'); });
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar role="member" />
      <main className="flex-1 overflow-auto pb-20 md:pb-0" style={{ marginLeft: 'var(--sidebar-w)' }}>
        {children}
      </main>
    </div>
  );
}
