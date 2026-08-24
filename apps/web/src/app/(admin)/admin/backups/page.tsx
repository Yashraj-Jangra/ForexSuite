'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  HardDrive,
  Cloud,
  Database,
  ShieldCheck,
  ShieldAlert,
  Zap,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Save,
} from 'lucide-react';

type GlobalBackupConfig = {
  scheduleInterval: '4h' | '12h' | '24h';
  retentionDays: number;
  storageProvider: 'local' | 's3' | 'gdrive';
  s3Bucket: string | null;
  s3Region: string;
  s3Endpoint: string | null;
  s3AccessKey: string | null;
  gdriveFolderId: string | null;
  gdriveEmail: string | null;
  lastBackupAt: string | null;
  lastBackupStatus: string | null;
  lastBackupError: string | null;
  lastBackupSizeBytes: number | null;
};

type TenantBackupStatus = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  lastBackupAt: string | null;
  lastBackupStatus: string;
  lastBackupSizeBytes: number | null;
  gdriveEnabled: boolean;
  s3Enabled: boolean;
};

export default function AdminBackupsPage() {
  const [config, setConfig] = useState<GlobalBackupConfig | null>(null);
  const [tenants, setTenants] = useState<TenantBackupStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringAll, setTriggeringAll] = useState(false);
  const [triggeringTenant, setTriggeringTenant] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    scheduleInterval: '4h' as '4h' | '12h' | '24h',
    retentionDays: 90,
    storageProvider: 'local' as 'local' | 's3' | 'gdrive',
    s3Bucket: '',
    s3Region: 'ap-south-1',
    s3Endpoint: '',
    s3AccessKey: '',
    s3SecretKey: '',
  });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [cfgRes, tenantsRes] = await Promise.all([
        fetch('/api/trpc/admin.backups.getGlobalConfig', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/trpc/admin.backups.listTenantsBackupStatus', { credentials: 'include' }).then((r) => r.json()),
      ]);

      if (cfgRes?.result?.data) {
        const c = cfgRes.result.data as GlobalBackupConfig;
        setConfig(c);
        setForm((prev) => ({
          ...prev,
          scheduleInterval: c.scheduleInterval,
          retentionDays: c.retentionDays,
          storageProvider: c.storageProvider,
          s3Bucket: c.s3Bucket || '',
          s3Region: c.s3Region || 'ap-south-1',
          s3Endpoint: c.s3Endpoint || '',
          s3AccessKey: c.s3AccessKey || '',
        }));
      }

      if (tenantsRes?.result?.data) {
        setTenants(tenantsRes.result.data || []);
      }
    } catch (err) {
      console.error('Failed to load backup data:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleTriggerAll() {
    setTriggeringAll(true);
    try {
      const res = await fetch('/api/trpc/admin.backups.triggerAll', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      });
      const data = await res.json();
      if (data?.result?.data?.success) {
        showToast(data.result.data.message || 'Global backup triggered for all tenants', true);
        loadData();
      }
    } catch {
      showToast('Network error', false);
    }
    setTriggeringAll(false);
  }

  async function handleTriggerTenant(tenantId: string, tenantName: string) {
    setTriggeringTenant(tenantId);
    try {
      const res = await fetch('/api/trpc/admin.backups.triggerTenantBackup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { tenantId } }),
      });
      const data = await res.json();
      if (data?.result?.data?.success) {
        showToast(`Backup created for "${tenantName}"`, true);
        loadData();
      }
    } catch {
      showToast('Network error', false);
    }
    setTriggeringTenant(null);
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/trpc/admin.backups.saveGlobalConfig', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            ...form,
            s3SecretKey: form.s3SecretKey || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data?.result?.data?.success) {
        showToast('Global backup policy saved', true);
        setForm((prev) => ({ ...prev, s3SecretKey: '' }));
        loadData();
      }
    } catch {
      showToast('Network error', false);
    }
    setSavingConfig(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
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
            <h1 className="text-2xl font-black tracking-tight text-foreground">Global Backups Orchestration</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              FEMA 5-YEAR COMPLIANT
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Centrally manage database snapshots, retention rules, multi-cloud storage, and disaster recovery across all tenants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleTriggerAll}
            disabled={triggeringAll}
            className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            {triggeringAll ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Backup All Tenants Now
          </Button>
        </div>
      </div>

      {/* Global Config Form */}
      <Card padding="md" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Database className="size-4 text-rose-500" />
          Master Backup Schedule & Storage Policy
        </h2>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Automated Interval *
              </label>
              <select
                value={form.scheduleInterval}
                onChange={(e) => setForm({ ...form, scheduleInterval: e.target.value as any })}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              >
                <option value="4h">Every 4 hours (Recommended)</option>
                <option value="12h">Every 12 hours</option>
                <option value="24h">Daily (24 hours)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Retention Period (Days) *
              </label>
              <input
                type="number"
                min={7}
                max={365}
                value={form.retentionDays}
                onChange={(e) => setForm({ ...form, retentionDays: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Primary Offsite Target *
              </label>
              <select
                value={form.storageProvider}
                onChange={(e) => setForm({ ...form, storageProvider: e.target.value as any })}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs uppercase"
              >
                <option value="local">Local PostgreSQL Snapshots</option>
                <option value="s3">AWS S3 / MinIO Storage</option>
                <option value="gdrive">Google Drive Enterprise</option>
              </select>
            </div>
          </div>

          {form.storageProvider === 's3' && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="text-xs font-bold text-foreground">S3 / MinIO Connection Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-1">S3 Bucket Name *</label>
                  <input
                    type="text"
                    value={form.s3Bucket}
                    onChange={(e) => setForm({ ...form, s3Bucket: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-1">S3 Region</label>
                  <input
                    type="text"
                    value={form.s3Region}
                    onChange={(e) => setForm({ ...form, s3Region: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Access Key ID</label>
                  <input
                    type="text"
                    value={form.s3AccessKey}
                    onChange={(e) => setForm({ ...form, s3AccessKey: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Secret Access Key</label>
                  <input
                    type="password"
                    value={form.s3SecretKey}
                    onChange={(e) => setForm({ ...form, s3SecretKey: e.target.value })}
                    placeholder="Encrypted AES-256"
                    className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="submit" size="sm" disabled={savingConfig} className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white">
              {savingConfig ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Global Backup Policy
            </Button>
          </div>
        </form>
      </Card>

      {/* Per-Tenant Backup Status Directory */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Tenants Backup Status Directory</h2>
            <p className="text-xs text-muted-foreground">Individual tenant snapshot health and manual execution</p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{tenants.length} Active Workspaces</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Last Backup Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Cloud Sync</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {tenants.map((t) => (
                <tr key={t.tenantId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-foreground">{t.tenantName}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">/{t.tenantSlug}</div>
                  </td>

                  <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                    {t.lastBackupAt ? new Date(t.lastBackupAt).toLocaleString() : 'Never Backed Up'}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      t.lastBackupStatus === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {t.lastBackupStatus === 'success' ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                      {t.lastBackupStatus}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {t.s3Enabled && (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">S3</span>
                      )}
                      {t.gdriveEnabled && (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">GDrive</span>
                      )}
                      {!t.s3Enabled && !t.gdriveEnabled && (
                        <span className="text-[10px] text-muted-foreground">Local only</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTriggerTenant(t.tenantId, t.tenantName)}
                      disabled={triggeringTenant === t.tenantId}
                      className="h-7 px-2 text-[11px] gap-1"
                    >
                      {triggeringTenant === t.tenantId ? (
                        <RefreshCw className="size-3 animate-spin" />
                      ) : (
                        <Play className="size-3" />
                      )}
                      <span>Backup</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
