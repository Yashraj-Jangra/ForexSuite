'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import {
  Shield,
  HardDrive,
  Cloud,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Download,
} from 'lucide-react';

type BackupConfig = {
  scheduleInterval: string;
  retentionDays: number;
  gdriveEnabled: boolean;
  gdriveEmail: string | null;
  gdriveFolderId: string | null;
  s3Enabled: boolean;
  s3Bucket: string | null;
  s3AccessKey: string | null;
  s3Region: string;
  s3Endpoint: string | null;
  lastBackupAt: string | null;
  lastBackupStatus: string | null;
  lastBackupError: string | null;
  lastBackupSizeBytes: number | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function BackupsPage() {
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingS3, setSavingS3] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');

  // Form state
  const [schedule, setSchedule] = useState({ scheduleInterval: '4h', retentionDays: 90 });
  const [s3Form, setS3Form] = useState({
    s3Enabled: false,
    s3Bucket: '',
    s3AccessKey: '',
    s3SecretKey: '',
    s3Region: 'ap-south-1',
    s3Endpoint: '',
  });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/backups.getConfig', { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data as BackupConfig | null;
      if (data) {
        setConfig(data);
        setSchedule({ scheduleInterval: data.scheduleInterval, retentionDays: data.retentionDays });
        setS3Form((prev) => ({
          ...prev,
          s3Enabled: data.s3Enabled,
          s3Bucket: data.s3Bucket ?? '',
          s3AccessKey: data.s3AccessKey ?? '',
          s3Region: data.s3Region,
          s3Endpoint: data.s3Endpoint ?? '',
        }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleTrigger() {
    setTriggering(true);
    try {
      const res = await fetch('/api/trpc/backups.triggerManual', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      });
      const json = await res.json();
      if (json?.result?.data?.queued) {
        showToast('Backup job queued! Check status in a few minutes.', true);
      } else {
        showToast('Failed to trigger backup', false);
      }
    } catch {
      showToast('Network error', false);
    }
    setTriggering(false);
  }

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSavingSchedule(true);
    try {
      const res = await fetch('/api/trpc/backups.saveSchedule', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: schedule }),
      });
      if (res.ok) { showToast('Schedule saved', true); await load(); }
      else showToast('Failed to save', false);
    } catch { showToast('Network error', false); }
    setSavingSchedule(false);
  }

  async function handleSaveS3(e: React.FormEvent) {
    e.preventDefault();
    setSavingS3(true);
    try {
      const res = await fetch('/api/trpc/backups.saveS3', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: s3Form }),
      });
      if (res.ok) { showToast('S3 config saved', true); await load(); }
      else showToast('Failed to save', false);
    } catch { showToast('Network error', false); }
    setSavingS3(false);
  }

  const backupHealthy = config?.lastBackupAt && config.lastBackupStatus === 'success' &&
    (Date.now() - new Date(config.lastBackupAt).getTime() < 24 * 60 * 60 * 1000);

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Backup & Recovery</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Automated backups of your entire workspace. FEMA requires 5-year data retention.
            </p>
          </div>
          <Button onClick={handleTrigger} disabled={triggering} size="sm" className="gap-1.5 shrink-0">
            {triggering ? <RefreshCw className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Backup Now
          </Button>
        </div>

        {/* Status Card */}
        <Card padding="md" className={`flex items-center gap-4 ${
          backupHealthy ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
        }`}>
          <div className={`p-3 rounded-xl ${backupHealthy ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            {backupHealthy ? <Shield className="size-6 text-emerald-500" /> : <AlertTriangle className="size-6 text-amber-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${backupHealthy ? 'text-emerald-500' : 'text-amber-500'}`}>
              {backupHealthy ? 'Backup Healthy' : config?.lastBackupAt ? 'Backup Overdue' : 'No Backups Yet'}
            </p>
            <p className="text-xs text-muted-foreground">
              {config?.lastBackupAt
                ? `Last backup: ${timeAgo(config.lastBackupAt)}${config.lastBackupSizeBytes ? ` · ${formatBytes(config.lastBackupSizeBytes)}` : ''}`
                : 'Configure a destination below and click Backup Now to start.'}
            </p>
            {config?.lastBackupStatus === 'failed' && config.lastBackupError && (
              <p className="text-xs text-rose-500 mt-0.5">Error: {config.lastBackupError}</p>
            )}
          </div>
        </Card>

        {/* Destination: Local (always on) */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
              <HardDrive className="size-5 text-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Local Storage</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Always On</span>
              </div>
              <p className="text-xs text-muted-foreground">pg_dump snapshots stored on the server. Rolling: 7 daily + 4 weekly + 3 monthly.</p>
            </div>
          </div>
        </Card>

        {/* Destination: Google Drive */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Cloud className="size-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Google Drive</h2>
                <p className="text-xs text-muted-foreground">Backups saved to your own GDrive. 30 daily + 12 monthly snapshots.</p>
              </div>
            </div>
            {config?.gdriveEnabled
              ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Connected</span>
              : null}
          </div>
          {config?.gdriveEnabled && config.gdriveEmail ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span>Connected as <strong>{config.gdriveEmail}</strong>. Backups saved to <em>VaultBill Backups/</em> folder.</span>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => { window.location.href = '/api/auth/gdrive'; }}
            >
              <Cloud className="size-4" />
              Connect Google Drive
            </Button>
          )}
        </Card>

        {/* Destination: S3 / MinIO */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Database className="size-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">S3 / MinIO</h2>
              <p className="text-xs text-muted-foreground">AWS S3, Cloudflare R2, or self-hosted MinIO. 90-day retention.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-muted-foreground">Enable</span>
              <input
                type="checkbox"
                checked={s3Form.s3Enabled}
                onChange={(e) => setS3Form({ ...s3Form, s3Enabled: e.target.checked })}
                className="rounded"
              />
            </label>
          </div>

          {s3Form.s3Enabled && (
            <form onSubmit={handleSaveS3} className="space-y-3 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">S3 Bucket *</label>
                  <input value={s3Form.s3Bucket} onChange={(e) => setS3Form({ ...s3Form, s3Bucket: e.target.value })} placeholder="my-vaultbill-backups" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" required />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Region</label>
                  <input value={s3Form.s3Region} onChange={(e) => setS3Form({ ...s3Form, s3Region: e.target.value })} placeholder="ap-south-1" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Access Key ID *</label>
                <input value={s3Form.s3AccessKey} onChange={(e) => setS3Form({ ...s3Form, s3AccessKey: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono" required />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Secret Access Key *</label>
                <input type="password" value={s3Form.s3SecretKey} onChange={(e) => setS3Form({ ...s3Form, s3SecretKey: e.target.value })} placeholder="Stored encrypted" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Encrypted with AES-256-GCM. Leave blank to keep existing.</p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Custom Endpoint (MinIO / R2)</label>
                <input value={s3Form.s3Endpoint} onChange={(e) => setS3Form({ ...s3Form, s3Endpoint: e.target.value })} placeholder="https://your-minio.example.com" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={savingS3} className="gap-1.5">
                  {savingS3 ? <RefreshCw className="size-3.5 animate-spin" /> : null}
                  Save S3 Config
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Schedule */}
        <Card padding="md" className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            Backup Schedule
          </h2>
          <form onSubmit={handleSaveSchedule} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Frequency</label>
                <select value={schedule.scheduleInterval} onChange={(e) => setSchedule({ ...schedule, scheduleInterval: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
                  <option value="4h">Every 4 hours</option>
                  <option value="12h">Every 12 hours</option>
                  <option value="24h">Daily</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Retention (days)</label>
                <input type="number" min={7} max={365} value={schedule.retentionDays} onChange={(e) => setSchedule({ ...schedule, retentionDays: Number(e.target.value) })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={savingSchedule} variant="outline" className="gap-1.5">
                {savingSchedule ? <RefreshCw className="size-3.5 animate-spin" /> : null}
                Save Schedule
              </Button>
            </div>
          </form>
        </Card>

        {/* Danger Zone: Restore */}
        <Card padding="md" className="border-rose-500/30 space-y-3">
          <h2 className="text-sm font-bold text-rose-500 flex items-center gap-2">
            <AlertTriangle className="size-4" /> Danger Zone
          </h2>
          <p className="text-xs text-muted-foreground">
            Restore overwrites <strong>all current workspace data</strong> with the selected backup. This cannot be undone.
            Recommended: download backup first, test on staging before restoring production.
          </p>
          {!showRestoreConfirm ? (
            <Button variant="outline" size="sm" onClick={() => setShowRestoreConfirm(true)} className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
              Restore from Backup
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-500">Type <strong>RESTORE</strong> to confirm:</p>
              <div className="flex gap-2">
                <input
                  value={restoreInput}
                  onChange={(e) => setRestoreInput(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-rose-500/30 bg-background text-sm font-mono"
                  placeholder="RESTORE"
                />
                <Button
                  size="sm"
                  disabled={restoreInput !== 'RESTORE'}
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={() => showToast('Restore feature requires a backup file selection — coming in next release', false)}
                >
                  Restore
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowRestoreConfirm(false); setRestoreInput(''); }}>Cancel</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
