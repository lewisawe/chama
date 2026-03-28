'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { fmt, fmtDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { AlertCircle, X } from 'lucide-react';

interface Chama { id: string; name: string; contributionAmount: string; nextContributionDate: string; }
interface Contribution { id: string; amount: string; status: string; dueDate: string; mpesaReceiptNo: string | null; }

const FRIENDLY: Record<string, string> = {
  'Network Error': 'Connection lost — check your internet',
  '401': 'Session expired — please log in again',
};
function friendlyError(msg: string) {
  for (const [k, v] of Object.entries(FRIENDLY)) if (msg.includes(k)) return v;
  return msg || 'Something went wrong — please try again';
}

export default function MemberContributionsPage() {
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [contribs, setContribs] = useState<Record<string, Contribution[]>>({});
  const [loading, setLoading] = useState(true);
  const [confirmPay, setConfirmPay] = useState<Chama | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, { text: string; ok: boolean }>>({});
  const user = getAuth();

  useEffect(() => {
    api.get<Chama[]>('/api/chamas').then(async ch => {
      setChamas(ch);
      const map: Record<string, Contribution[]> = {};
      await Promise.all(ch.map(async c => { map[c.id] = await api.get<Contribution[]>(`/api/contributions/mine/${c.id}`); }));
      setContribs(map);
    }).finally(() => setLoading(false));
  }, []);

  async function pay(chama: Chama) {
    setConfirmPay(null); setPaying(chama.id);
    try {
      await api.post('/api/contributions/pay', { chamaId: chama.id });
      setMsg(m => ({ ...m, [chama.id]: { text: 'STK Push sent — enter your M-Pesa PIN to complete', ok: true } }));
    } catch (e: any) {
      setMsg(m => ({ ...m, [chama.id]: { text: friendlyError(e.message), ok: false } }));
    } finally { setPaying(null); }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="p-4 sm:p-8 max-w-3xl animate-fade-up">
      <h1 className="text-2xl font-800 text-[var(--text-primary)] mb-8">My Contributions</h1>

      {chamas.length === 0 && (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p className="font-600 text-[var(--text-primary)] mb-1">No chamas yet</p>
          <p className="text-sm">Ask your treasurer to invite you.</p>
        </div>
      )}

      {chamas.map(chama => {
        const list = contribs[chama.id] || [];
        const latest = list[0];
        const unpaid = !latest || latest.status !== 'PAID';

        return (
          <div key={chama.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 mb-5">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h2 className="font-700 text-[var(--text-primary)]">{chama.name}</h2>
                <p className="text-sm text-[var(--text-muted)]">Next due: {fmtDate(chama.nextContributionDate)}</p>
              </div>
              {unpaid && (
                <div className="shrink-0">
                  <Button size="sm" onClick={() => setConfirmPay(chama)} loading={paying === chama.id}>
                    Pay {fmt(chama.contributionAmount)}
                  </Button>
                  {msg[chama.id] && (
                    <p className={`text-xs mt-1 text-right max-w-[180px] ${msg[chama.id].ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {msg[chama.id].text}
                    </p>
                  )}
                </div>
              )}
            </div>

            {list.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">No contributions yet — make your first payment above.</p>
            ) : (
              <div className="overflow-x-auto -mx-5 sm:mx-0">
                <table className="w-full min-w-[400px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {['Due date', 'Amount', 'Status', 'Receipt'].map(h => (
                        <th key={h} className="text-left py-2 px-5 sm:px-0 text-xs font-600 text-[var(--text-muted)] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(c => (
                      <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-3 px-5 sm:px-0 text-sm text-[var(--text-secondary)] tabular">{fmtDate(c.dueDate)}</td>
                        <td className="py-3 px-5 sm:px-0 text-sm font-700 tabular text-[var(--text-primary)]">{fmt(c.amount)}</td>
                        <td className="py-3 px-5 sm:px-0">
                          <Badge variant={c.status === 'PAID' ? 'success' : c.status === 'MISSED' ? 'danger' : 'warning'}>
                            {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-5 sm:px-0 text-xs text-[var(--text-muted)] font-mono">{c.mpesaReceiptNo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Confirmation modal */}
      {confirmPay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'oklch(0% 0 0 / 0.4)' }}
          onClick={() => setConfirmPay(null)}>
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-800 text-[var(--text-primary)]">Confirm payment</h2>
              <button onClick={() => setConfirmPay(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--gray-50)' }}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-muted)]">Chama</span>
                <span className="font-600">{confirmPay.name}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-muted)]">Amount</span>
                <span className="font-800 tabular">{fmt(confirmPay.contributionAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Phone</span>
                <span className="font-600">{user?.phone}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 mb-5 p-3 rounded-lg" style={{ background: 'var(--info-light)' }}>
              <AlertCircle size={14} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs text-[var(--info)]">An M-Pesa STK Push will be sent to your phone. Enter your PIN to complete.</p>
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
