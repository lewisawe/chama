'use client';
import { useState } from 'react';
import { Hash, Smartphone, ChevronRight, Lock } from 'lucide-react';

const MENU_TREE: Record<string, { title: string; options: { key: string; label: string; next?: string; response?: string }[] }> = {
  root: {
    title: 'Welcome to ChamaPesa\nEnter *384*1# to start',
    options: [
      { key: '1', label: 'My Balance', next: 'balance' },
      { key: '2', label: 'My Trust Score', next: 'trust' },
      { key: '3', label: 'Request Loan', next: 'loan' },
      { key: '4', label: 'Vote on Motion', next: 'vote' },
      { key: '0', label: 'Exit', response: 'Thank you for using ChamaPesa. Goodbye!' },
    ],
  },
  balance: {
    title: 'Your Balances',
    options: [
      { key: '1', label: 'Merry-Go-Round Pool: KES 45,200', response: 'Your share in Merry-Go-Round Pool is KES 45,200. Next payout: 15 Apr 2026.' },
      { key: '2', label: 'Emergency Fund: KES 8,400', response: 'Your share in Emergency Fund is KES 8,400. Locked until Dec 2026.' },
      { key: '0', label: 'Back', next: 'root' },
    ],
  },
  trust: {
    title: 'Your Trust Score',
    options: [
      { key: '1', label: 'View breakdown', response: 'Score: 78/100 (Excellent)\n• Contributions: 40pts\n• Loan repayment: 20pts\n• Tenure: 12pts\n• Voting: 6pts' },
      { key: '2', label: 'Request certificate via SMS', response: 'Trust Certificate sent to your phone. Show it to other chamas to prove your standing.' },
      { key: '0', label: 'Back', next: 'root' },
    ],
  },
  loan: {
    title: 'Request a Loan',
    options: [
      { key: '1', label: 'KES 5,000', response: 'Loan request of KES 5,000 submitted. Members will vote within 24 hours. You will receive an SMS with the result.' },
      { key: '2', label: 'KES 10,000', response: 'Loan request of KES 10,000 submitted. Members will vote within 24 hours. You will receive an SMS with the result.' },
      { key: '3', label: 'Custom amount', response: 'Please call your treasurer to request a custom loan amount.' },
      { key: '0', label: 'Back', next: 'root' },
    ],
  },
  vote: {
    title: 'Open Motions',
    options: [
      { key: '1', label: 'Approve KES 10,000 loan for Brian', next: 'vote_cast' },
      { key: '0', label: 'Back', next: 'root' },
    ],
  },
  vote_cast: {
    title: 'Approve KES 10,000 loan for Brian Otieno?\nVote is anonymous.',
    options: [
      { key: '1', label: 'YES — Approve', response: 'Your vote has been recorded anonymously. Results will be announced when voting closes.' },
      { key: '2', label: 'NO — Reject', response: 'Your vote has been recorded anonymously. Results will be announced when voting closes.' },
      { key: '0', label: 'Back', next: 'vote' },
    ],
  },
};

export default function USSDPage() {
  const [screen, setScreen] = useState<string>('root');
  const [response, setResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const current = MENU_TREE[screen];

  function select(opt: typeof current.options[0]) {
    if (opt.response) {
      setResponse(opt.response);
    } else if (opt.next) {
      setHistory(h => [...h, screen]);
      setScreen(opt.next);
      setResponse(null);
    }
  }

  function reset() {
    setScreen('root');
    setResponse(null);
    setHistory([]);
  }

  return (
    <div className="p-8 max-w-4xl animate-fade-up">
      <div className="flex items-start gap-3 mb-2">
        <h1 className="text-2xl font-800 text-[var(--text-primary)]">USSD Self-Service</h1>
        <span className="mt-1 text-[10px] font-700 px-2 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">PILOT Q3</span>
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-8">
        Members without smartphones can access ChamaPesa via <strong>*384*1#</strong> on any phone. Try the simulator below.
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Phone simulator */}
        <div>
          <h2 className="font-700 text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Smartphone size={16} /> Interactive simulator
          </h2>
          <div className="rounded-3xl border-4 border-[var(--gray-800)] bg-[var(--gray-900)] p-4 max-w-xs mx-auto shadow-xl">
            {/* Screen */}
            <div className="rounded-2xl bg-[oklch(20%_0.02_155)] p-4 mb-4 min-h-[200px] font-mono text-sm">
              {response ? (
                <div>
                  <p className="text-[oklch(80%_0.15_155)] whitespace-pre-line mb-4">{response}</p>
                  <button onClick={reset}
                    className="text-xs text-[oklch(60%_0.10_155)] underline cursor-pointer">
                    Start over
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[oklch(80%_0.15_155)] whitespace-pre-line mb-4">{current.title}</p>
                  <div className="flex flex-col gap-1">
                    {current.options.map(opt => (
                      <button key={opt.key} onClick={() => select(opt)}
                        className="flex items-center gap-2 text-left text-[oklch(70%_0.08_155)] hover:text-[oklch(90%_0.15_155)] transition-colors cursor-pointer py-0.5">
                        <span className="text-[oklch(50%_0.10_155)]">{opt.key}.</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Dial code */}
            <div className="text-center text-xs text-[var(--gray-500)] font-mono">*384*1#</div>
          </div>
        </div>

        {/* Feature list */}
        <div>
          <h2 className="font-700 text-[var(--text-primary)] mb-4">What members can do via USSD</h2>
          <div className="flex flex-col gap-3 mb-8">
            {[
              { label: 'Check pool balances', live: true },
              { label: 'View trust score & breakdown', live: true },
              { label: 'Request trust certificate via SMS', live: true },
              { label: 'Request a loan', live: true },
              { label: 'Vote on motions anonymously', live: true },
              { label: 'View contribution history', live: false },
              { label: 'Pay contribution via USSD', live: false },
              { label: 'View rotation schedule', live: false },
            ].map(({ label, live }) => (
              <div key={label} className="flex items-center gap-3">
                {live
                  ? <ChevronRight size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  : <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                }
                <span className={`text-sm ${live ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{label}</span>
                {!live && <span className="ml-auto text-xs text-[var(--text-muted)]">Q4</span>}
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4 border border-[var(--border)] bg-[var(--gray-50)]">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={14} style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-700 text-[var(--text-primary)]">Africa's Talking USSD</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Powered by Africa's Talking USSD API. Works on Safaricom, Airtel, and Telkom Kenya. No internet required — any feature phone can access ChamaPesa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
