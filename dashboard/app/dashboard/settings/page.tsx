'use client';
import { useState } from 'react';
import { MessageSquare, FileDown, Shield, Bell, Lock, CheckCircle2 } from 'lucide-react';

function ComingSoonBadge() {
  return (
    <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
      SOON
    </span>
  );
}

function SettingRow({ icon: Icon, label, description, children }: {
  icon: React.ElementType; label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-[var(--border)] last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--gray-100)' }}>
          <Icon size={15} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <div>
          <div className="text-sm font-600 text-[var(--text-primary)]">{label}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">{description}</div>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  return (
    <div className="p-8 max-w-3xl animate-fade-up">
      <h1 className="text-2xl font-800 text-[var(--text-primary)] mb-1">Settings</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8">Manage notifications, integrations, and exports</p>

      {/* Notifications */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <h2 className="font-700 text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Bell size={16} /> Notifications
        </h2>
        <SettingRow icon={MessageSquare} label="SMS reminders" description="Send contribution reminders via Africa's Talking SMS the day before due date">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-5 rounded-full relative" style={{ background: 'var(--success)' }}>
              <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
            <span className="text-xs text-[var(--success)] font-600">On</span>
          </label>
        </SettingRow>
        <SettingRow icon={MessageSquare} label="WhatsApp notifications" description="Send payment confirmations and voting links via WhatsApp Business API">
          <div className="flex items-center gap-2">
            <ComingSoonBadge />
            <button onClick={() => showToast('WhatsApp integration coming Q3 2026')}
              className="w-10 h-5 rounded-full relative cursor-pointer opacity-40" style={{ background: 'var(--gray-300)' }}>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </SettingRow>
      </div>

      {/* Payments */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <h2 className="font-700 text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Shield size={16} /> M-Pesa
        </h2>
        <SettingRow icon={Shield} label="Paybill (C2B)" description="Members can pay manually to paybill 174379, account number = phone number">
          <div className="text-right">
            <div className="text-sm font-800 tabular text-[var(--text-primary)]">174379</div>
            <div className="text-xs text-[var(--text-muted)]">Sandbox shortcode</div>
          </div>
        </SettingRow>
        <SettingRow icon={Lock} label="Callback IP whitelist" description="Restrict M-Pesa callbacks to Safaricom IP ranges only">
          <div className="flex items-center gap-2">
            <ComingSoonBadge />
            <button onClick={() => showToast('IP whitelisting coming in production hardening phase')}
              className="px-3 py-1.5 rounded-lg text-xs font-600 border border-[var(--border)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--gray-100)] transition-colors">
              Configure
            </button>
          </div>
        </SettingRow>
      </div>

      {/* Exports */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <h2 className="font-700 text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <FileDown size={16} /> Reports & Exports
        </h2>
        <SettingRow icon={FileDown} label="Export contributions (CSV)" description="Download all contribution records for this chama">
          <a href="/dashboard/contributions"
            className="px-3 py-1.5 rounded-lg text-xs font-600 border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--gray-100)] transition-colors">
            Go to Contributions
          </a>
        </SettingRow>
        <SettingRow icon={FileDown} label="Export loans (CSV)" description="Download all loan records">
          <a href="/dashboard/loans"
            className="px-3 py-1.5 rounded-lg text-xs font-600 border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--gray-100)] transition-colors">
            Go to Loans
          </a>
        </SettingRow>
        <SettingRow icon={FileDown} label="PDF financial report" description="Full chama financial report with charts and summaries">
          <div className="flex items-center gap-2">
            <ComingSoonBadge />
            <button onClick={() => showToast('PDF reports coming Q3 2026 — Pro feature')}
              className="px-3 py-1.5 rounded-lg text-xs font-600 border border-[var(--border)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--gray-100)] transition-colors opacity-60">
              Download PDF
            </button>
          </div>
        </SettingRow>
      </div>

      {/* Roadmap */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="font-700 text-[var(--text-primary)] mb-4">Upcoming integrations</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: 'KCB Money Market API — sweep idle funds automatically', q: 'Q3 2026' },
            { label: 'WhatsApp Business API — voting & notifications', q: 'Q3 2026' },
            { label: 'Chama-to-Chama lending marketplace', q: 'Q4 2026' },
            { label: 'Mobile app (React Native)', q: '2027' },
          ].map(({ label, q }) => (
            <div key={label} className="flex items-center gap-3">
              <Lock size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="text-sm text-[var(--text-secondary)]">{label}</span>
              <span className="ml-auto text-xs font-600 text-[var(--text-muted)] shrink-0">{q}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-500 animate-fade-up"
          style={{ background: 'var(--gray-900)', color: 'white', zIndex: 100 }}>
          <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
