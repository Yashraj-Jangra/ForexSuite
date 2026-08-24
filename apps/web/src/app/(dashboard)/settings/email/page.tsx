'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Mail, Zap, Settings2, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff, Send } from 'lucide-react';

type EmailMode = 'vaultbill' | 'gmail_oauth' | 'smtp';

type EmailConfig = {
  mode: EmailMode;
  gmailEmail: string | null;
  smtpFromEmail: string | null;
  smtpFromName: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  lastTestAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
};

export default function EmailSettingsPage() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [selectedMode, setSelectedMode] = useState<EmailMode>('vaultbill');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // SMTP form state
  const [smtp, setSmtp] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFromName: '',
    smtpFromEmail: '',
    smtpSecure: false,
  });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/email.getSettings', { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data as EmailConfig | null;
      if (data) {
        setConfig(data);
        setSelectedMode(data.mode);
        setSmtp((prev) => ({
          ...prev,
          smtpHost: data.smtpHost ?? '',
          smtpPort: data.smtpPort ?? 587,
          smtpUser: data.smtpUser ?? '',
          smtpFromName: data.smtpFromName ?? '',
          smtpFromEmail: data.smtpFromEmail ?? '',
          smtpSecure: data.smtpSecure ?? false,
        }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSaveSmtp(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/trpc/email.saveSmtp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: smtp }),
      });
      if (res.ok) {
        showToast('SMTP settings saved successfully', true);
        await load();
      } else {
        showToast('Failed to save settings', false);
      }
    } catch {
      showToast('Network error', false);
    }
    setSaving(false);
  }

  async function handleSetMode(mode: EmailMode) {
    setSelectedMode(mode);
    await fetch('/api/trpc/email.setMode', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: { mode } }),
    });
    await load();
  }

  async function handleTest() {
    if (!testEmail) { showToast('Enter a test email address', false); return; }
    setTesting(true);
    try {
      const res = await fetch('/api/trpc/email.testSend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { to: testEmail } }),
      });
      const json = await res.json();
      if (json?.result?.data?.success) {
        showToast(`Test email sent to ${testEmail} ✓`, true);
      } else {
        showToast(json?.error?.message ?? 'Test failed', false);
      }
    } catch {
      showToast('Test failed — check your config', false);
    }
    setTesting(false);
    await load();
  }

  const MODES = [
    {
      id: 'vaultbill' as EmailMode,
      icon: <Zap className="size-5 text-accent" />,
      title: 'VaultBill Hosted',
      desc: 'Zero setup. We send from noreply@vaultbill.app using our email infrastructure.',
      badge: 'Easiest',
      badgeCls: 'bg-accent/10 text-accent border-accent/20',
    },
    {
      id: 'gmail_oauth' as EmailMode,
      icon: <Mail className="size-5 text-red-400" />,
      title: 'Gmail / Google Workspace',
      desc: 'Connect your Google account with one click. Emails sent from your Gmail address.',
      badge: 'Recommended',
      badgeCls: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    {
      id: 'smtp' as EmailMode,
      icon: <Settings2 className="size-5 text-muted-foreground" />,
      title: 'Custom SMTP',
      desc: 'Use your own SMTP server (Resend, Postmark, SendGrid, or any mail server).',
      badge: 'Advanced',
      badgeCls: 'bg-muted text-muted-foreground border-border',
    },
  ];

  return (
    <Container>
      <div className="space-y-6 max-w-2xl">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-lg animate-in slide-in-from-top-2 ${
            toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          }`}>
            {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Email Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure how invoices, reminders, and compliance alerts are sent from VaultBill.
          </p>
        </div>

        {/* Last test status */}
        {config?.lastTestAt && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
            config.lastTestStatus === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
          }`}>
            {config.lastTestStatus === 'ok'
              ? <CheckCircle2 className="size-3.5" />
              : <XCircle className="size-3.5" />}
            <span>
              Last test: {new Date(config.lastTestAt).toLocaleString()} —{' '}
              {config.lastTestStatus === 'ok' ? 'Success' : config.lastTestError}
            </span>
          </div>
        )}

        {/* Mode selector */}
        <Card padding="md" className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Delivery Method</h2>
          <div className="space-y-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSetMode(m.id)}
                className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                  selectedMode === m.id
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-border hover:border-accent/40 hover:bg-muted/40'
                }`}
              >
                <div className="p-2 rounded-lg bg-background border border-border shrink-0">
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{m.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${m.badgeCls}`}>
                      {m.badge}
                    </span>
                    {selectedMode === m.id && (
                      <CheckCircle2 className="size-3.5 text-accent ml-auto shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* VaultBill mode: nothing to configure */}
        {selectedMode === 'vaultbill' && (
          <Card padding="md" className="border-accent/20 bg-accent/5 flex items-center gap-3">
            <CheckCircle2 className="size-5 text-accent shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">You&apos;re all set!</p>
              <p className="text-xs text-muted-foreground">Emails will be sent from <strong>noreply@vaultbill.app</strong> using VaultBill&apos;s hosted email infrastructure. No configuration needed.</p>
            </div>
          </Card>
        )}

        {/* Gmail OAuth mode */}
        {selectedMode === 'gmail_oauth' && (
          <Card padding="md" className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">Connect Google Account</h2>
            {config?.gmailEmail ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Connected: {config.gmailEmail}</p>
                  <p className="text-xs text-muted-foreground">Emails sent from this Gmail address.</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto text-xs">Disconnect</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Connect your Google account to send invoices directly from your Gmail or Google Workspace address.
                  VaultBill only requests permission to send emails — we cannot read your inbox.
                </p>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    // OAuth flow — redirect to Gmail auth URL (backend generates it)
                    window.location.href = '/api/auth/gmail';
                  }}
                >
                  <Mail className="size-4" />
                  Connect Google Account
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* SMTP mode */}
        {selectedMode === 'smtp' && (
          <Card padding="md" className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">SMTP Configuration</h2>
            <form onSubmit={handleSaveSmtp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">SMTP Host *</label>
                  <input value={smtp.smtpHost} onChange={(e) => setSmtp({ ...smtp, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" required />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Port</label>
                  <input type="number" value={smtp.smtpPort} onChange={(e) => setSmtp({ ...smtp, smtpPort: Number(e.target.value) })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">SMTP Username *</label>
                <input value={smtp.smtpUser} onChange={(e) => setSmtp({ ...smtp, smtpUser: e.target.value })} placeholder="your@email.com" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" required />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">SMTP Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={smtp.smtpPass}
                    onChange={(e) => setSmtp({ ...smtp, smtpPass: e.target.value })}
                    placeholder="App password or API key"
                    className="w-full h-9 px-3 pr-10 rounded-lg border border-input bg-background text-sm"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Stored encrypted with AES-256-GCM. Never visible after saving.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">From Name</label>
                  <input value={smtp.smtpFromName} onChange={(e) => setSmtp({ ...smtp, smtpFromName: e.target.value })} placeholder="My Company Ltd." className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">From Email</label>
                  <input type="email" value={smtp.smtpFromEmail} onChange={(e) => setSmtp({ ...smtp, smtpFromEmail: e.target.value })} placeholder="invoices@mycompany.com" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={smtp.smtpSecure} onChange={(e) => setSmtp({ ...smtp, smtpSecure: e.target.checked })} className="rounded" />
                <span className="text-muted-foreground">Use SSL/TLS (port 465)</span>
              </label>
              <div className="flex justify-end gap-2 pt-1 border-t border-border">
                <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                  {saving ? <RefreshCw className="size-3.5 animate-spin" /> : null}
                  Save SMTP Config
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Test Send */}
        <Card padding="md" className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Send Test Email</h2>
          <p className="text-xs text-muted-foreground">Send a test email to verify your configuration is working.</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm"
            />
            <Button size="sm" onClick={handleTest} disabled={testing} className="gap-1.5 shrink-0">
              {testing ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Send Test
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}
