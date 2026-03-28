'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { fmt, fmtDate, trustColor, trustLabel } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { TrendingUp, CreditCard, Landmark, Shield, AlertCircle, X } from 'lucide-react';

interface Chama {
  id: string; name: string; contributionAmount: string;
  frequency: string; nextContributionDate: string; myRole: string;
  members: { userId: string; trustScore: number; role: string }[];
}
interface Contribution { id: string; amount: string; status: string; dueDate: string; mpesaReceiptNo: string | null; }
interface Loan { id: string; amount: string; status: string; amountRepaid: string; dueDate: string | null; chama: { id: string; name: string }; }

const FRIENDLY_ERRORS: Record<string, string> = {
  'Network Error': 'Connection lost — check your internet',
  'Failed to fetch': 'Could not reach the server',
  '401': 'Session expired — please log in again',
};
function friendlyError(msg: string) {
  for (const [k, v] of Object.entries(FRIENDLY_ERRORS)) if (msg.includes(k)) return v;
  return msg || 'Something went wrong — please try again';
}

export default function MemberOverviewPage() {
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [contributions, setContributions] = useState<Record<string, Contribution[]>>({});
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmPay, setConfirmPay] = useState<Chama | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [payMsg, setPayMsg] = useState<Record<string, { text: string; ok: boolean }>>({});

  const user = getAuth();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<Chama[]>('/api/chamas'),
      api.get<Loan[]>('/api/loans/mine'),
    ]).then(async ([ch, lo]) => {
      setChamas(ch); setLoans(lo);
      const map: Record<string, Contribution[]> = {};
      await Promise.all(ch.map(async c => { map[c.id] = await api.get<Contribution[]>(`/api/contributions/mine/${c.id}`); }));
      setContributions(map);
    }).finally(() => setLoading(false));
  }, []);

  async function pay(chama: Chama) {
    setConfirmPay(null);
    setPaying(chama.id);
    try {
      await api.post('/api/contributions/pay', { chamaId: chama.id });
      setPayMsg(m => ({ ...m, [chama.id]: { text: 'STK Push sent — enter your M-Pesa PIN to complete', ok: true } }));
    } catch (e: any) {
      setPayMsg(m => ({ ...m, [chama.id]: { text: friendlyError(e.message), ok: false } }));
    } finally { setPaying(null); }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="p-4 sm:p-8 max-w-2xl animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {user && <Avatar name={user.name} size="lg" />}
        <div>
          <h1 className="text-xl sm:text-2xl font-800 text-[var(--text-primary)]">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-[var(--text-secondary)]">{user?.phone}</p>
        </div>
      </div>

      {chamas.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-600 text-[var(--text-primary)] mb-1">Not in any chama yet</p>
          <p className="text-sm text-[var(--text-muted)]">Ask your treasurer to invite you by phone number.</p>
        </div>
      ) : chamas.map(chama => {
        const myMembership = chama.members.find(m => m.userId === user?.id);
        const trustScore = myMembership?.trustScore ?? 50;
        const myContribs = contributions[chama.id] || [];
        const latestContrib = myContribs[0];
        const paidThisMonth = latestContrib?.status === 'PAID';
        const activeLoans = loans.filter(l => l.chama.id === chama.id && ['DISBURSED', 'REPAYING'].includes(l.status));

        return (
          <div key={chama.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 mb-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-800 text-lg text-[var(--text-primary)]">{chama.name}</h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {chama.frequency.charAt(0) + chama.frequency.slice(1).toLowerCase()} · {fmt(chama.contributionAmount)}
                </p>
              </div>
              <Badge variant={chama.myRole === 'ADMIN' ? 'info' : chama.myRole === 'TREASURER' ? 'warning' : 'neutral'}>
                {chama.myRole.charAt(0) + chama.myRole.slice(1).toLowerCase()}
              </Badge>
            </div>

            {/* Stats — stack on mobile */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
              <div className="rounded-xl p-3 sm:p-4 border" style={{ background: 'var(--gray-50)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1 mb-2">
                  <Shield size={12} style={{ color: trustColor(trustScore) }} />
                  <span className="text-[10px] sm:text-xs font-500 text-[var(--text-muted)]">Trust</span>
                </div>
                <div className="text-xl sm:text-2xl font-800 tabular" style={{ color: trustColor(trustScore) }}>{trustScore}</div>
                <div className="text-[10px] sm:text-xs font-500 mt-0.5" style={{ color: trustColor(trustScore) }}>{trustLabel(trustScore)}</div>
                <div className="mt-2 h-1 rounded-full bg-[var(--gray-200)]">
                  <div className="h-full rounded-full" style={{ width: `${trustScore}%`, background: trustColor(trustScore) }} />
                </div>
              </div>

              <div className="rounded-xl p-3 sm:p-4 border" style={{
                background: paidThisMonth ? 'var(--success-light)' : 'var(--warning-light)',
                borderColor: paidThisMonth ? 'oklch(80% 0.08 155)' : 'oklch(85% 0.12 75)',
              }}>
                <div className="flex items-center gap-1 mb-2">
                  <CreditCard size={12} style={{ color: paidThisMonth ? 'var(--success)' : 'oklch(52% 0.18 75)' }} />
                  <span className="text-[10px] sm:text-xs font-500" style={{ color: paidThisMonth ? 'var(--success)' : 'oklch(52% 0.18 75)' }}>Cycle</span>
                </div>
                <div className="text-sm font-700" style={{ color: paidThisMonth ? 'var(--success)' : 'oklch(52% 0.18 75)' }}>
                  {paidThisMonth ? '✓ Paid' : latestContrib?.status === 'MISSED' ? '✗ Missed' : 'Pending'}
                </div>
                <div className="text-[10px] mt-1 truncate" style={{ color: paidThisMonth ? 'var(--success)' : 'oklch(52% 0.18 75)' }}>
                  Due {fmtDate(chama.nextContributionDate)}
                </div>
              </div>

              <div className="rounded-xl p-3 sm:p-4 border" style={{ background: 'var(--gray-50)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1 mb-2">
                  <Landmark size={12} style={{ color: 'var(--info)' }} />
                  <span className="text-[10px] sm:text-xs font-500 text-[var(--text-muted)]">Loans</span>
                </div>
                <div className="text-xl sm:text-2xl font-800 tabular text-[var(--text-primary)]">{activeLoans.length}</div>
                {activeLoans.length > 0 && (
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
                    {fmt(activeLoans.reduce((s, l) => s + Number(l.amount) - Number(l.amountRepaid), 0))} left
                  </div>
                )}
              </div>
            </div>

            {/* Pay button */}
            {!paidThisMonth && (
              <div className="mb-4">
                <Button onClick={() => setConfirmPay(chama)} loading={paying === chama.id} className="w-full">
                  Pay {fmt(chama.contributionAmount)} via M-Pesa
                </Button>
                {payMsg[chama.id] && (
                  <p className={`mt-2 text-sm ${payMsg[chama.id].ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {payMsg[chama.id].text}
                  </p>
                )}
              </div>
            )}

            {/* Recent contributions */}
            {myContribs.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)]">
                <h3 className="text-xs font-600 text-[var(--text-muted)] uppercase tracking-wide mb-3">Recent</h3>
                <div className="flex flex-col gap-2">
                  {myContribs.slice(0, 4).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">{fmtDate(c.dueDate)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-600 tabular text-[var(--text-primary)]">{fmt(c.amount)}</span>
                        <Badge variant={c.status === 'PAID' ? 'success' : c.status === 'MISSED' ? 'danger' : 'warning'}>
                          {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* STK Push confirmation modal */}
      {confirmPay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'oklch(0% 0 0 / 0.4)' }}
          onClick={() => setConfirmPay(null)}>
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-800 text-[var(--text-primary)]">Confirm payment</h2>
              <button onClick={() => setConfirmPay(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--gray-50)' }}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-muted)]">Chama</span>
                <span className="font-600 text-[var(--text-primary)]">{confirmPay.name}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-muted)]">Amount</span>
                <span className="font-800 tabular text-[var(--text-primary)]">{fmt(confirmPay.contributionAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Phone</span>
                <span className="font-600 text-[var(--text-primary)]">{user?.phone}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 mb-5 p-3 rounded-lg" style={{ background: 'var(--info-light)' }}>
              <AlertCircle size={14} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs text-[var(--info)]">An M-Pesa STK Push will be sent to your phone. Enter your PIN to complete the payment.</p>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => pay(confirmPay)}>Send STK Push</Button>
              <Button variant="ghost" onClick={() => setConfirmPay(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
