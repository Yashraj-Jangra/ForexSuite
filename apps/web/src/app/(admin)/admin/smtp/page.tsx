'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Zap,
  Save,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
} from 'lucide-react';

type SmtpConfig = {
  configured: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
  fromName: string;
  fromEmail: string;
  provider: 'custom' | 'resend' | 'postmark' | 'sendgrid' | 'ses';
  isActive: boolean;
  lastTestAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
};

const PROVIDER_PRESETS: Record<string, { host: string; port: number; secure: boolean; desc: string }> = {
  resend: { host: 'smtp.resend.com', port: 465, secure: true, desc: 'Recommended: High deliverability API & SMTP relay' },
  postmark: { host: 'smtp.postmarkapp.com', port: 587, secure: false, desc: 'Transactional specialist relay' },
  sendgrid: { host: 'smtp.sendgrid.net', port: 587, secure: false, desc: 'Twilio SendGrid transactional relay' },
  ses: { host: 'email-smtp.ap-south-1.amazonaws.com', port: 465, secure: true, desc: 'AWS Simple Email Service' },
  custom: { host: '', port: 587, secure: false, desc: 'Self-hosted or custom SMTP server' },
};

export default function AdminSmtpPage() {
  const [config, setConfig] = useState<SmtpConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    host: '',
    port: 587,
    secure: false,
    username: '',
    fromName: 'VaultBill Suite',
    fromEmail: 'noreply@vaultbill.app',
    provider: 'resend' as 'custom' | 'resend' | 'postmark' | 'sendgrid' | 'ses',
    isActive: true,
  });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/admin.smtp.get', { credentials: 'include' });
      const json = await res.json();
      if (json?.result?.data) {
        const d = json.result.data as SmtpConfig;
        setConfig(d);
        setForm({
          host: d.host,
          port: d.port,
          secure: d.secure,
          username: d.username || '',
          fromName: d.fromName,
          fromEmail: d.fromEmail,
          provider: d.provider,
          isActive: d.isActive,
        });
      }
    } catch (err) {
      console.error('Failed to load SMTP config:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadConfig();
  }, []);

  function handleSelectPreset(presetKey: 'custom' | 'resend' | 'postmark' | 'sendgrid' | 'ses') {
    const preset = PROVIDER_PRESETS[presetKey];
    if (preset) {
      setForm((prev) => ({
        ...prev,
        provider: presetKey,
        host: preset.host || prev.host,
        port: preset.port,
        secure: preset.secure,
      }));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/trpc/admin.smtp.save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            ...form,
            password: password || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data?.result?.data?.success) {
        showToast('Platform default SMTP settings updated', true);
        setPassword('');
        loadConfig();
      } else {
        showToast(data?.error?.message || 'Failed to save SMTP settings', false);
      }
    } catch {
      showToast('Network error saving settings', false);
    }
    setSaving(false);
  }

  async function handleTestSend() {
    if (!testEmail || !testEmail.includes('@')) {
      showToast('Please enter a valid test recipient email', false);
      return;
    }

    setTesting(true);
    try {
      const res = await fetch('/api/trpc/admin.smtp.test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { to: testEmail } }),
      });
      const data = await res.json();
      if (data?.result?.data?.success) {
        showToast(data.result.data.message || `Test email dispatched to ${testEmail}`, true);
        loadConfig();
      } else {
        showToast(data?.error?.message || 'SMTP test failed', false);
      }
    } catch {
      showToast('Test failed: Check mail server connection', false);
    }
    setTesting(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-12 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-in slide-in-from-top-2 ${
          toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Platform Default SMTP</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              HOSTED INFRASTRUCTURE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Default email delivery relay for tenants operating in &quot;VaultBill Hosted&quot; mode. Stored with AES-256-GCM encryption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadConfig} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health / Diagnostic Status Banner */}
      {config && (
        <Card padding="md" className={`flex items-center justify-between gap-4 ${
          config.lastTestStatus === 'ok' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.lastTestStatus === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Mail className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {config.lastTestStatus === 'ok' ? 'Platform Mailer Operational' : 'SMTP Status: Awaiting Verification'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {config.lastTestAt
                  ? `Last verified on ${new Date(config.lastTestAt).toLocaleString()}`
                  : 'Run a diagnostic test below to verify deliverability.'}
              </p>
              {config.lastTestError && (
                <p className="text-[10px] text-rose-400 font-mono mt-0.5">Error: {config.lastTestError}</p>
              )}
            </div>
          </div>

          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
            config.lastTestStatus === 'ok'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {config.lastTestStatus || 'UNTESTED'}
          </span>
        </Card>
      )}

      {/* Provider Presets */}
      <Card padding="md" className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Quick Provider Presets
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(['resend', 'postmark', 'sendgrid', 'ses', 'custom'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPreset(key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                form.provider === key
                  ? 'border-rose-500 bg-rose-500/5 font-bold shadow-xs'
                  : 'border-border hover:bg-muted/40'
              }`}
            >
              <div className="text-xs uppercase font-extrabold text-foreground">{key}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {PROVIDER_PRESETS[key]?.host || 'Custom host'}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Main Settings Form */}
      <Card padding="md" className="space-y-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                SMTP Server Host *
              </label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="e.g. smtp.resend.com"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Port *
              </label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Username / API Key Name
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. resend, apikey"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Password / API Secret Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={config?.configured ? '•••••••• (leave blank to keep current)' : 'Enter SMTP password'}
                  className="w-full h-9 pl-3 pr-9 rounded-lg border border-input bg-background text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Default Sender Name *
              </label>
              <input
                type="text"
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Default Sender Email *
              </label>
              <input
                type="email"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.secure}
                onChange={(e) => setForm({ ...form, secure: e.target.checked })}
                className="rounded border-input text-rose-500"
              />
              <span>Use SSL/TLS (Implicit TLS, typically port 465)</span>
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-input text-rose-500"
              />
              <span>Enable Outbound Platform Relay</span>
            </label>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white">
              {saving ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Platform SMTP Configuration
            </Button>
          </div>
        </form>
      </Card>

      {/* Live Diagnostic Testing */}
      <Card padding="md" className="space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="size-4 text-rose-500" />
          Send Diagnostic Test Email
        </h2>
        <p className="text-xs text-muted-foreground">
          Send a real verification email through the platform default SMTP relay to confirm end-to-end socket delivery.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="admin@yourcompany.com"
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs"
          />
          <Button
            size="sm"
            onClick={handleTestSend}
            disabled={testing}
            className="gap-1.5 text-xs bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800"
          >
            {testing ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Send Test
          </Button>
        </div>
      </Card>
    </div>
  );
}
