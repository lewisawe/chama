'use client';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, BarChart3, Lock } from 'lucide-react';

const insights = [
  {
    icon: TrendingUp,
    color: 'var(--success)',
    bg: 'var(--success-light)',
    label: 'Collection forecast',
    value: '94%',
    detail: 'Based on the last 6 cycles, your group is likely to collect in full this month. 2 members have a pattern of paying in the last 2 days.',
  },
  {
    icon: AlertTriangle,
    color: 'var(--warning)',
    bg: 'var(--warning-light)',
    label: 'Default risk',
    value: '2 members',
    detail: 'Brian Otieno and one other member show early warning signs — missed 1 contribution each in the last 3 cycles. Consider a reminder.',
  },
  {
    icon: Lightbulb,
    color: 'var(--primary)',
    bg: 'var(--primary-light)',
    label: 'Optimal loan size',
    value: 'KES 8,500',
    detail: 'Based on current pool balance and active loans, the maximum safe loan disbursement is KES 8,500 without affecting payout capacity.',
  },
  {
    icon: BarChart3,
    color: 'var(--info)',
    bg: 'var(--info-light)',
    label: 'Interest projection',
    value: 'KES 2,340',
    detail: 'At current pool balances and 12% p.a. money market rate, your group is on track to earn KES 2,340 in interest this quarter.',
  },
];

export default function InsightsPage() {
  return (
    <div className="p-8 max-w-4xl animate-fade-up">
      <div className="flex items-start gap-3 mb-2">
        <h1 className="text-2xl font-800 text-[var(--text-primary)]">AI Insights</h1>
        <span className="mt-1 text-[10px] font-700 px-2 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">PREVIEW</span>
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-8">
        Powered by your chama's financial history. Full AI analysis launches Q3 2026.
      </p>

      {/* Preview banner */}
      <div className="rounded-xl p-5 mb-8 flex items-start gap-4 border"
        style={{ background: 'var(--primary-light)', borderColor: 'oklch(80% 0.10 38)' }}>
        <Sparkles size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="font-700 text-[var(--text-primary)] mb-1">These are simulated insights</div>
          <p className="text-sm text-[var(--text-secondary)]">
            The AI engine will analyse real contribution patterns, loan repayment history, and trust scores to generate personalised recommendations. The insights below show what the feature will look like.
          </p>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {insights.map(({ icon: Icon, color, bg, label, value, detail }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-sm font-600 text-[var(--text-muted)]">{label}</span>
            </div>
            <div className="text-2xl font-800 tabular text-[var(--text-primary)] mb-2">{value}</div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{detail}</p>
          </div>
        ))}
      </div>

      {/* Roadmap */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="font-700 text-[var(--text-primary)] mb-4">What's coming</h2>
        <div className="flex flex-col gap-3">
          {[
            { q: 'Q3 2026', label: 'Real-time AI analysis on your actual data', done: false },
            { q: 'Q3 2026', label: 'SMS delivery of weekly insights to treasurer', done: false },
            { q: 'Q4 2026', label: 'WhatsApp Business API for member-level insights', done: false },
            { q: 'Q4 2026', label: 'Chama-to-chama benchmarking (anonymised)', done: false },
          ].map(({ q, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="text-sm text-[var(--text-secondary)]">{label}</span>
              <span className="ml-auto text-xs font-600 text-[var(--text-muted)] shrink-0">{q}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
