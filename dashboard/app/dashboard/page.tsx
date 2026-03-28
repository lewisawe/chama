'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmt, fmtDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { TrendingUp, Users, CreditCard, Landmark, AlertCircle, CheckCircle2, Clock, Sparkles, Smartphone } from 'lucide-react';

interface Chama {
  id: string; name: string; contributionAmount: string;
  frequency: string; nextContributionDate: string;
  members: { id: string; role: string; trustScore: number; user: { id: string; name: string; phone: string } }[];
  pools: { id: string; name: string; balance: string; contributionSplit: string }[];
}

interface Contribution {
  id: string; amount: string; status: string;
  user: { name: string }; dueDate: string;
}

interface Loan {
  id: string; amount: string; status: string;
  borrower: { name: string }; createdAt: string;
}

interface MpesaTx {
  id: string; transactionType: string; phone: string; amount: string;
  status: string; mpesaReceiptNo: string | null; createdAt: string;
  resultDesc: string | null;
}
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cp_chama');
  return raw ? JSON.parse(raw) : null;
}

export default function DashboardPage() {
  const [chama, setChama] = useState<Chama | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [mpesaTxs, setMpesaTxs] = useState<MpesaTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = getChama();
    if (!c) { setLoading(false); return; }
    Promise.all([
      api.get<Chama>(`/api/chamas/${c.id}`),
      api.get<Contribution[]>(`/api/contributions/chama/${c.id}`),
      api.get<Loan[]>(`/api/loans/chama/${c.id}`),
      api.get<MpesaTx[]>(`/api/mpesa/transactions`).catch(() => []),
    ]).then(([ch, co, lo, txs]) => {
      setChama(ch); setContributions(co); setLoans(lo); setMpesaTxs(txs);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (!chama) return (
    <div className="p-8 text-center text-[var(--text-muted)]">
      <p className="mb-4">No chama found.</p>
      <a href="/dashboard/create" className="text-[var(--primary)] font-500 hover:underline">Create your first chama →</a>
    </div>
  );

  const totalBalance = chama.pools.reduce((s, p) => s + Number(p.balance), 0);
  const paidThisCycle = contributions.filter(c => c.status === 'PAID').length;
  const pendingThisCycle = contributions.filter(c => c.status === 'PENDING').length;
  const missedThisCycle = contributions.filter(c => c.status === 'MISSED').length;
  const activeLoans = loans.filter(l => ['DISBURSED', 'REPAYING'].includes(l.status));
  const pendingLoans = loans.filter(l => ['REQUESTED', 'VOTING', 'APPROVED'].includes(l.status));

  const stats = [
    { label: 'Total pool balance', value: fmt(totalBalance), icon: TrendingUp, color: 'var(--primary)' },
    { label: 'Members', value: chama.members.length, icon: Users, color: 'var(--info)' },
    { label: 'Paid this cycle', value: `${paidThisCycle}/${chama.members.length}`, icon: CheckCircle2, color: 'var(--success)' },
    { label: 'Active loans', value: activeLoans.length, icon: Landmark, color: 'var(--warning)' },
  ];

  return (
    <div className="p-8 max-w-6xl animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-800 text-[var(--text-primary)]">{chama.name}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {chama.frequency.charAt(0) + chama.frequency.slice(1).toLowerCase()} contributions of {fmt(chama.contributionAmount)} · Next due {fmtDate(chama.nextContributionDate)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-500 text-[var(--text-muted)] uppercase tracking-wide">{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="text-2xl font-800 text-[var(--text-primary)] tabular">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Collection status */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">          <h2 className="font-700 text-[var(--text-primary)] mb-4">Collection status</h2>
          <div className="flex gap-4 mb-5">
            {[
              { label: 'Paid', count: paidThisCycle, color: 'var(--success)', bg: 'var(--success-light)' },
              { label: 'Pending', count: pendingThisCycle, color: 'var(--warning)', bg: 'var(--warning-light)' },
              { label: 'Missed', count: missedThisCycle, color: 'var(--danger)', bg: 'var(--danger-light)' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className="flex-1 rounded-lg p-3 text-center" style={{ background: bg }}>
                <div className="text-xl font-800 tabular" style={{ color }}>{count}</div>
                <div className="text-xs font-500 mt-0.5" style={{ color }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden bg-[var(--gray-100)] mb-5">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(paidThisCycle / Math.max(chama.members.length, 1)) * 100}%`, background: 'var(--success)' }} />
          </div>

          {/* Recent contributions */}
          <div className="flex flex-col gap-2">
            {contributions.slice(0, 6).map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.user.name} size="sm" />
                  <span className="text-sm font-500 text-[var(--text-primary)]">{c.user.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular text-[var(--text-secondary)]">{fmt(c.amount)}</span>
                  <Badge variant={c.status === 'PAID' ? 'success' : c.status === 'MISSED' ? 'danger' : 'warning'}>
                    {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {contributions.length > 6 && (
            <a href="/dashboard/contributions" className="block mt-3 text-sm text-[var(--primary)] font-500 hover:underline">
              View all {contributions.length} contributions →
            </a>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Pools */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="font-700 text-[var(--text-primary)] mb-4">Pools</h2>
            <div className="flex flex-col gap-3">
              {chama.pools.map(pool => (
                <div key={pool.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-500 text-[var(--text-primary)]">{pool.name}</span>
                    <span className="text-sm font-700 tabular text-[var(--text-primary)]">{fmt(pool.balance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--gray-100)]">
                      <div className="h-full rounded-full" style={{ width: `${pool.contributionSplit}%`, background: 'var(--primary)' }} />
                    </div>
                    <span className="text-xs text-[var(--text-muted)] tabular">{pool.contributionSplit}%</span>
                  </div>
                </div>
              ))}
            </div>
            <a href="/dashboard/pools" className="block mt-4 text-sm text-[var(--primary)] font-500 hover:underline">Manage pools →</a>
          </div>

          {/* Pending loans */}
          {pendingLoans.length > 0 && (
            <div className="bg-[var(--warning-light)] border border-[oklch(85%_0.10_75)] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} style={{ color: 'var(--warning)' }} />
                <h2 className="font-700 text-[oklch(40%_0.18_75)]">Needs attention</h2>
              </div>
              <div className="flex flex-col gap-2">
                {pendingLoans.map(l => (
                  <div key={l.id} className="flex items-center justify-between">
                    <span className="text-sm text-[oklch(40%_0.18_75)]">{l.borrower.name} — {fmt(l.amount)}</span>
                    <Badge variant="warning">{l.status.charAt(0) + l.status.slice(1).toLowerCase()}</Badge>
                  </div>
                ))}
              </div>
              <a href="/dashboard/loans" className="block mt-3 text-sm font-500 text-[oklch(40%_0.18_75)] hover:underline">Review loans →</a>
            </div>
          )}

          {/* Members quick view */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="font-700 text-[var(--text-primary)] mb-4">Members</h2>
            <div className="flex flex-col gap-2.5">
              {chama.members.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <Avatar name={m.user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-500 text-[var(--text-primary)] truncate">{m.user.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{m.role}</div>
                  </div>
                  <div className="text-sm font-700 tabular" style={{
                    color: m.trustScore >= 75 ? 'var(--success)' : m.trustScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                  }}>{m.trustScore}</div>
                </div>
              ))}
            </div>
            <a href="/dashboard/members" className="block mt-4 text-sm text-[var(--primary)] font-500 hover:underline">
              View all {chama.members.length} members →
            </a>
          </div>
        </div>
      </div>

      {/* M-Pesa Transaction Feed + AI Insights */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Live M-Pesa feed */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-700 text-[var(--text-primary)]">M-Pesa activity</h2>
            <span className="flex items-center gap-1.5 text-xs text-[var(--success)] font-600">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              Live
            </span>
          </div>
          {mpesaTxs.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              <Smartphone size={24} className="mx-auto mb-2 opacity-30" />
              No transactions yet. Trigger an STK Push to see activity here.
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {mpesaTxs.slice(0, 8).map((tx, i) => (
                <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: tx.status === 'SUCCESS' ? 'var(--success-light)' : tx.status === 'FAILED' ? 'var(--danger-light)' : 'var(--warning-light)',
                    }}>
                    <Smartphone size={14} style={{
                      color: tx.status === 'SUCCESS' ? 'var(--success)' : tx.status === 'FAILED' ? 'var(--danger)' : 'var(--warning)',
                    }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-500 text-[var(--text-primary)]">{tx.transactionType.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{tx.phone} {tx.mpesaReceiptNo ? `· ${tx.mpesaReceiptNo}` : ''}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-700 tabular text-[var(--text-primary)]">{fmt(tx.amount)}</div>
                    <Badge variant={tx.status === 'SUCCESS' ? 'success' : tx.status === 'FAILED' ? 'danger' : 'warning'}>
                      {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights teaser */}
        <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at top right, oklch(93% 0.05 38 / 0.6), transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              <h2 className="font-700 text-[var(--text-primary)]">AI Insights</h2>
              <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">SOON</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-5">Powered by your chama's financial history</p>

            {/* Blurred preview cards */}
            <div className="flex flex-col gap-3 select-none" style={{ filter: 'blur(3px)', opacity: 0.6 }}>
              {[
                { label: 'Collection forecast', value: '94%', sub: 'likely to collect in full this cycle' },
                { label: 'Default risk', value: '2 members', sub: 'showing early warning signs' },
                { label: 'Optimal loan size', value: 'KES 8,500', sub: 'based on pool capacity' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-lg p-3 bg-[var(--gray-50)] border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">{label}</div>
                  <div className="text-base font-800 text-[var(--text-primary)]">{value}</div>
                  <div className="text-xs text-[var(--text-muted)]">{sub}</div>
                </div>
              ))}
            </div>

            <a href="/dashboard/insights"
              className="mt-5 flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-600 transition-colors"
              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Sparkles size={13} /> See preview
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
