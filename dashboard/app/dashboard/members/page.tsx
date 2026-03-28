'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { trustColor, trustLabel, fmtDate } from '@/lib/utils';import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { UserPlus, Shield, Award, X } from 'lucide-react';

interface Member {
  id: string; role: string; trustScore: number; joinedAt: string;
  user: { id: string; name: string; phone: string };
}

function getChama() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cp_chama');
  return raw ? JSON.parse(raw) : null;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [certMember, setCertMember] = useState<Member | null>(null);

  const chama = getChama();

  useEffect(() => {
    if (!chama) { setLoading(false); return; }
    api.get<any>(`/api/chamas/${chama.id}`)
      .then(c => setMembers(c.members))
      .finally(() => setLoading(false));
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!chama) return;
    setInviting(true); setInviteMsg(null);
    try {
      await api.post(`/api/chamas/${chama.id}/invite`, { phone: invitePhone });
      setInviteMsg({ type: 'success', text: 'Member invited successfully' });
      setInvitePhone('');
      const c = await api.get<any>(`/api/chamas/${chama.id}`);
      setMembers(c.members);
    } catch (err: any) {
      setInviteMsg({ type: 'error', text: err.message });
    } finally {
      setInviting(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="p-8 max-w-4xl animate-fade-up">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-800 text-[var(--text-primary)]">Members</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{members.length} members in this chama</p>
        </div>
      </div>

      {/* Invite form */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <h2 className="font-700 text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <UserPlus size={16} /> Invite member
        </h2>
        <form onSubmit={invite} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="0712 345 678"
              type="tel"
              value={invitePhone}
              onChange={e => setInvitePhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={inviting}>Invite</Button>
        </form>
        {inviteMsg && (
          <p className={`mt-2 text-sm ${inviteMsg.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {inviteMsg.text}
          </p>
        )}
      </div>

      {/* Members table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
              <th className="text-left px-6 py-3 text-xs font-600 text-[var(--text-muted)] uppercase tracking-wide">Member</th>
              <th className="text-left px-6 py-3 text-xs font-600 text-[var(--text-muted)] uppercase tracking-wide">Role</th>
              <th className="text-left px-6 py-3 text-xs font-600 text-[var(--text-muted)] uppercase tracking-wide">Trust Score</th>
              <th className="text-left px-6 py-3 text-xs font-600 text-[var(--text-muted)] uppercase tracking-wide">Joined</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={m.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--gray-50)] transition-colors"
                style={{ animationDelay: `${i * 30}ms` }}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.user.name} size="sm" />
                    <div>
                      <div className="text-sm font-600 text-[var(--text-primary)]">{m.user.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{m.user.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={m.role === 'ADMIN' ? 'info' : m.role === 'TREASURER' ? 'warning' : 'neutral'}>
                    {m.role === 'ADMIN' && <Shield size={10} className="mr-1" />}
                    {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1.5 rounded-full bg-[var(--gray-100)]">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${m.trustScore}%`, background: trustColor(m.trustScore) }} />
                    </div>
                    <span className="text-sm font-700 tabular" style={{ color: trustColor(m.trustScore) }}>
                      {m.trustScore}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{trustLabel(m.trustScore)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--text-secondary)] tabular">{fmtDate(m.joinedAt)}</td>
                <td className="px-6 py-4">
                  <button onClick={() => setCertMember(m)}
                    className="flex items-center gap-1.5 text-xs font-600 text-[var(--primary)] hover:underline cursor-pointer">
                    <Award size={12} /> Certificate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trust Certificate Modal */}
      {certMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'oklch(0% 0 0 / 0.4)' }}
          onClick={() => setCertMember(null)}>
          <div className="bg-[var(--surface)] rounded-2xl p-8 max-w-sm w-full shadow-xl animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-800 text-[var(--text-primary)]">Trust Certificate</h2>
              <button onClick={() => setCertMember(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Certificate design */}
            <div className="rounded-xl p-6 mb-6 text-center border-2"
              style={{ background: 'var(--primary-light)', borderColor: 'oklch(80% 0.10 38)' }}>
              <Award size={32} className="mx-auto mb-3" style={{ color: 'var(--primary)' }} />
              <div className="text-lg font-800 text-[var(--text-primary)] mb-1">{certMember.user.name}</div>
              <div className="text-xs text-[var(--text-muted)] mb-4">{certMember.user.phone}</div>
              <div className="text-4xl font-800 tabular mb-1" style={{ color: trustColor(certMember.trustScore) }}>
                {certMember.trustScore}
              </div>
              <div className="text-sm font-600" style={{ color: trustColor(certMember.trustScore) }}>
                {trustLabel(certMember.trustScore)} Standing
              </div>
              <div className="mt-4 pt-4 border-t border-[oklch(80%_0.10_38)] text-xs text-[var(--text-muted)]">
                Issued by ChamaPesa · {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => { alert('SMS delivery coming soon — Africa\'s Talking integration in Q3'); }}
                className="w-full py-2.5 rounded-lg text-sm font-600 transition-colors cursor-pointer"
                style={{ background: 'var(--primary)', color: 'white' }}>
                Send via SMS
              </button>
              <p className="text-center text-xs text-[var(--text-muted)]">SMS delivery via Africa's Talking — coming Q3</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
