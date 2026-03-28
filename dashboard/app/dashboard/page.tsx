'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmt, fmtDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Sparkles, Smartphone, ArrowRight, Plus } from 'lucide-react';

interface Chama {
  id: string; name: string; contributionAmount: string;
  frequency: string; nextContributionDate: string;
  members: { id: string; role: string; trustScore: number; user: { id: string; name: string; phone: string } }[];
  pools: { id: string; name: string; balance: string; contributionSplit: string }[];
}
interface Contribution { id: string; amount: string; status: string; user: { name: string; id: string }; dueDate: string; }
interface Loan { id: string; amount: string; status: string; borrower: { name: string }; createdAt: string; }
interface MpesaTx { id: string; transactionType: string; phone: string; amount: string; status: string; mpesaReceiptNo: string | null; }

function getChama(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cp_chama');
  return raw ? JSON.parse(raw) : null;
}

const ERROR_MESSAGES: Record<string, string> = {
  'Network Error': 'Connection lost — check your internet and try again',
  'Failed to fetch': 'Could not reach the server — try refreshing',
  '401': 'Session expired — please log in again',
  '403': 'You don\'t have permission to do that',
  '500': 'Something went wrong on our end — try again in a moment',
};

function friendlyError(msg: string): string {
  for (const [key, val] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return val;
  }
  return msg || 'Something went wrong — please try again';
}

export default function DashboardPage() {
  const [chama, setChama] = useState<Chama | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [mpesaTxs, setMpesaTxs] = useState<MpesaTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  async function load() {
    const c = getChama();
    if (!c) { setLoading(false); return; }
    setError(null);
    try {
      const [ch, co, lo, txs] = await Promise.all([
        api.get<Chama>(`/api/chamas/${c.id}`),
        api.get<Contribution[]>(`/api/contributions/chama/${c.id}`),
        api.get<Loan[]>(`/api/loans/chama/${c.id}`),
        api.get<MpesaTx[]>(`/api/mpesa/transactions`).catch(() => []),
      ]);
      setChama(ch); setContributions(co); setLoans(lo); setMpesaTxs(txs);
    } catch (e: any) {
      setError(friendlyError(e.message));
    } finally { setLoading(false); setRetrying(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <PageSpinner />;

  if (error) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle size={32} className="mb-4" style={{ color: 'var(--danger)' }} />
      <p className="text-[var(--text-primary)] font-600 mb-1">Failed to load dashboard</p>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs">{error}</p>
      <Button variant="secondary" loading={retrying} onClick={() => { setRetrying(true); setLoading(true); load(); }}>
        Try again
      </Button>
    </div>
  );

  if (!chama) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--primary-light)' }}>
        <Plus size={28} style={{ color: 'var(--primary)' }} />
      </div>
      <h2 className="text-xl font-800 text-[var(--text-primary)] mb-2">Create your first chama</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs">
        Set up your savings group, invite members, and start collecting contributions automatically via M-Pesa.
      </p>
      <a href="/dashboard/create">
        <Button>Get started</Button>
      </a>
    </div>
  );

  const totalBalance = chama.pools.reduce((s, p) => s + Number(p.balance), 0);
  const paidThisCycle = contributions.filter(c => c.status === 'PAID').length;
  const pendingThisCycle = contributions.filter(c => c.status === 'PENDING').length;
  const missedThisCycle = contributions.filter(c => c.status === 'MISSED').length;
  const pendingLoans = loans.filter(l => ['REQUESTED', 'VOTING', 'APPROVED'].includes(l.status));
  const collectionPct = Math.round((paidThisCycle / Math.max(chama.members.length, 1)) * 100);

  return (
    <div className="p-6 lg:p-8 max-w-6xl animate-fade-up">

      {/* Header — asymmetric, balance dominant */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs font-600 text-[var(--text-muted)] uppercase tracking-widest mb-1">{chama.frequency.charAt(0) + chama.frequency.slice(1).toLowerCase()} · Next due {fmtDate(chama.nextContributionDate)}</p>
          <h1 className="text-3xl font-800 text-[var(--text-primary)] leading-tight">{chama.name}</h1>
        </div>
        {/* Balance — dominant, not a card */}
        <div className="sm:text-right">
          <p className="text-xs font-500 text-[var(--text-muted)] mb-0.5">Total pool balance</p>
          <p className="text-4xl font-800 tabular leading-none" style={{ color: 'var(--primary)' }}>{fmt(totalBalance)}</p>
        </div>
      </div>

      {/* Collection hero — full width, no card border */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-700 text-[var(--text-primary)]">This cycle's collection</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{paidThisCycle} of {chama.members.length} members paid · {collectionPct}%</p>
          </div>
          <a href="/dashboard/contributions" className="flex items-center gap-1 text-sm text-[var(--primary)] font-600 hover:underline">
            Full view <ArrowRight size={13} />
          </a>
        </div>

        {/* Progress bar — prominent */}
        <div className="h-3 rounded-full overflow-hidden mb-6" style={{ background: 'var(--gray-100)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${collectionPct}%`, background: collectionPct === 100 ? 'var(--success)' : 'var(--primary)' }} />
        </div>

        {/* Member grid — the hero element */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {chama.members.map(m => {
            const contrib = contributions.find(c => c.user.id === m.user.id);
            const status = contrib?.status || 'PENDING';
            const styles = {
              PAID:    { bg: 'var(--success-light)', border: 'oklch(80% 0.10 155)', text: 'var(--success)' },
              PENDING: { bg: 'var(--warning-light)', border: 'oklch(85% 0.12 75)',  text: 'oklch(52% 0.18 75)' },
              MISSED:  { bg: 'var(--danger-light)',  border: 'oklch(85% 0.10 22)',  text: 'var(--danger)' },
              PARTIAL: { bg: 'var(--info-light)',    border: 'oklch(85% 0.08 240)', text: 'var(--info)' },
            }[status] || { bg: 'var(--gray-100)', border: 'var(--border)', text: 'var(--text-muted)' };
            return (
              <div key={m.id} className="rounded-xl p-3 flex items-center gap-2.5 border"
                style={{ background: styles.bg, borderColor: styles.border }}>
                <Avatar name={m.user.name} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-600 truncate" style={{ color: styles.text }}>{m.user.name.split(' ')[0]}</div>
                  <div className="text-[10px] font-500 mt-0.5 capitalize" style={{ color: styles.text }}>
                    {status.toLowerCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Three-column lower section */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Pools — left */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-700 text-[var(--text-primary)]">Pools</h2>
            <a href="/dashboard/pools" className="text-xs text-[var(--primary)] font-600 hover:underline">Manage</a>
          </div>
          {chama.pools.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
              <p className="text-sm text-[var(--text-muted)] mb-3">No pools yet</p>
              <a href="/dashboard/pools" className="text-sm text-[var(--primary)] font-600 hover:underline">Create a pool →</a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chama.pools.map((pool, i) => {
                const colors = ['var(--primary)', 'var(--success)', 'var(--info)', 'var(--warning)'];
                const c = colors[i % colors.length];
                return (
                  <div key={pool.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
                    <div className="w-2 h-8 rounded-full shrink-0" style={{ background: c }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-600 text-[var(--text-primary)] truncate">{pool.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{pool.contributionSplit}% split</div>
                    </div>
                    <div className="text-sm font-800 tabular text-[var(--text-primary)] shrink-0">{fmt(pool.balance)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* M-Pesa feed — center */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-700 text-[var(--text-primary)]">M-Pesa activity</h2>
            <span className="flex items-center gap-1.5 text-xs text-[var(--success)] font-600">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" style={{ animation: 'pulse 2s infinite' }} />
              Live
            </span>
          </div>
          {mpesaTxs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
              <Smartphone size={20} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm text-[var(--text-muted)] mb-3">No transactions yet</p>
              <a href="/dashboard/contributions" className="text-sm text-[var(--primary)] font-600 hover:underline">
                Trigger an STK Push →
              </a>
            </div>
          ) : (
            <div className="flex flex-col">
              {mpesaTxs.slice(0, 6).map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: tx.status === 'SUCCESS' ? 'var(--success-light)' : tx.status === 'FAILED' ? 'var(--danger-light)' : 'var(--warning-light)' }}>
                    <Smartphone size={12} style={{ color: tx.status === 'SUCCESS' ? 'var(--success)' : tx.status === 'FAILED' ? 'var(--danger)' : 'var(--warning)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-500 text-[var(--text-primary)] truncate">{tx.transactionType.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{tx.phone}</div>
                  </div>
                  <div className="text-xs font-700 tabular text-[var(--text-primary)] shrink-0">{fmt(tx.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — attention + AI teaser */}
        <div className="flex flex-col gap-4">
          {/* Pending loans alert */}
          {pendingLoans.length > 0 && (
            <div className="rounded-xl p-4 border" style={{ background: 'var(--warning-light)', borderColor: 'oklch(85% 0.10 75)' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} style={{ color: 'var(--warning)' }} />
                <span className="text-sm font-700" style={{ color: 'oklch(40% 0.18 75)' }}>Needs attention</span>
              </div>
              <div className="flex flex-col gap-2 mb-3">
                {pendingLoans.map(l => (
                  <div key={l.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate" style={{ color: 'oklch(40% 0.18 75)' }}>{l.borrower.name} · {fmt(l.amount)}</span>
                    <Badge variant="warning">{l.status.charAt(0) + l.status.slice(1).toLowerCase()}</Badge>
                  </div>
                ))}
              </div>
              <a href="/dashboard/loans" className="text-xs font-600 hover:underline" style={{ color: 'oklch(40% 0.18 75)' }}>
                Review loans →
              </a>
            </div>
          )}

          {/* Members quick view */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-700 text-[var(--text-primary)]">Members</h2>
              <a href="/dashboard/members" className="text-xs text-[var(--primary)] font-600 hover:underline">View all</a>
            </div>
            <div className="flex flex-col gap-2.5">
              {chama.members.slice(0, 4).map(m => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <Avatar name={m.user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-500 text-[var(--text-primary)] truncate">{m.user.name}</div>
                  </div>
                  <div className="text-sm font-700 tabular shrink-0" style={{
                    color: m.trustScore >= 75 ? 'var(--success)' : m.trustScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                  }}>{m.trustScore}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI teaser — lighter blur */}
          <div className="relative rounded-xl p-4 border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--primary-light)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-700 text-[var(--text-primary)]">AI Insights</span>
              <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full bg-white/60 text-[var(--primary)]">SOON</span>
            </div>
            <div className="flex flex-col gap-2 mb-3" style={{ filter: 'blur(2px)', opacity: 0.5, userSelect: 'none' }}>
              <div className="text-xs text-[var(--text-secondary)]">Collection forecast: <strong>94%</strong></div>
              <div className="text-xs text-[var(--text-secondary)]">Default risk: <strong>2 members</strong></div>
            </div>
            <a href="/dashboard/insights" className="text-xs font-600 text-[var(--primary)] hover:underline">
              See preview →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
