'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  HardDrive,
  Mail,
  Flag,
  Activity,
  ScrollText,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Server,
  Database,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type HealthOverview = {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  db: { status: string; latencyMs: number };
  memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
  metrics: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalAdminAudits: number;
  };
  services: {
    smtp: { configured: boolean; lastStatus: string; lastTestAt: string | null };
    backups: { configured: boolean; lastStatus: string; lastBackupAt: string | null };
  };
};

type AuditItem = {
  id: string;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: string;
};

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m ${seconds % 60}s`;
}

export default function SuperAdminOverviewPage() {
  const [health, setHealth] = useState<HealthOverview | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringBackup, setTriggeringBackup] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [healthRes, auditRes] = await Promise.all([
        fetch('/api/trpc/admin.health.overview', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/trpc/admin.health.recentAudits', { credentials: 'include' }).then((r) => r.json()),
      ]);

      if (healthRes?.result?.data) setHealth(healthRes.result.data);
      if (auditRes?.result?.data) setRecentAudits(auditRes.result.data);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function handleTriggerGlobalBackup() {
    setTriggeringBackup(true);
    try {
      const res = await fetch('/api/trpc/admin.backups.triggerAll', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      });
      const data = await res.json();
      if (data?.result?.data?.success) {
        showToast(data.result.data.message || 'Global backup triggered successfully', true);
        loadData();
      } else {
        showToast('Failed to trigger global backup', false);
      }
    } catch {
      showToast('Network error triggering backup', false);
    }
    setTriggeringBackup(false);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-12 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-in slide-in-from-top-2 ${
          toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Super Admin Command Center</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              LIVE SYSTEM
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Global observability, infrastructure control, tenant lifecycle, and maintainer operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh State
          </Button>
          <Button
            size="sm"
            onClick={handleTriggerGlobalBackup}
            disabled={triggeringBackup}
            className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            {triggeringBackup ? <RefreshCw className="size-3.5 animate-spin" /> : <HardDrive className="size-3.5" />}
            Backup All Tenants
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card padding="md" className="space-y-2 border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Total Tenants</span>
            <Building2 className="size-4 text-rose-500 opacity-80" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">
              {health?.metrics.totalTenants ?? '—'}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold">
              {health?.metrics.activeTenants} active
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">Across all subscription tiers</div>
        </Card>

        <Card padding="md" className="space-y-2 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Global Users</span>
            <Users className="size-4 text-blue-500 opacity-80" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-foreground">
            {health?.metrics.totalUsers ?? '—'}
          </div>
          <div className="text-[10px] text-muted-foreground">Total registered user accounts</div>
        </Card>

        <Card padding="md" className="space-y-2 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Database Latency</span>
            <Database className="size-4 text-emerald-500 opacity-80" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">
              {health?.db.latencyMs ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground font-mono">ms</span>
          </div>
          <div className="text-[10px] text-emerald-500 font-medium">PostgreSQL connection nominal</div>
        </Card>

        <Card padding="md" className="space-y-2 border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500">Server Uptime</span>
            <Server className="size-4 text-purple-500 opacity-80" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-foreground truncate">
            {health ? formatUptime(health.uptimeSeconds) : '—'}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            Heap: {health?.memory.heapUsedMb}MB / {health?.memory.heapTotalMb}MB
          </div>
        </Card>
      </div>

      {/* Quick Navigation Control Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md" className="space-y-3 hover:border-rose-500/40 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Tenant Lifecycle</h2>
              <p className="text-xs text-muted-foreground">Manage workspaces, plans, and impersonation</p>
            </div>
          </div>
          <Link
            href="/admin/tenants"
            className="w-full py-2 px-3 rounded-lg bg-muted/60 hover:bg-muted text-xs font-semibold flex items-center justify-between transition-colors"
          >
            <span>Open Tenants Directory</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
          </Link>
        </Card>

        <Card padding="md" className="space-y-3 hover:border-amber-500/40 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Flag className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Feature Flags & Kill Switches</h2>
              <p className="text-xs text-muted-foreground">Control modules & emergency cutoffs</p>
            </div>
          </div>
          <Link
            href="/admin/flags"
            className="w-full py-2 px-3 rounded-lg bg-muted/60 hover:bg-muted text-xs font-semibold flex items-center justify-between transition-colors"
          >
            <span>Configure Flags & Switches</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
          </Link>
        </Card>

        <Card padding="md" className="space-y-3 hover:border-blue-500/40 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Mail className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Platform Default SMTP</h2>
              <p className="text-xs text-muted-foreground">Manage hosted email infrastructure</p>
            </div>
          </div>
          <Link
            href="/admin/smtp"
            className="w-full py-2 px-3 rounded-lg bg-muted/60 hover:bg-muted text-xs font-semibold flex items-center justify-between transition-colors"
          >
            <span>Configure Platform Mailer</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
          </Link>
        </Card>
      </div>

      {/* Services Health & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Services Status */}
        <Card padding="md" className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity className="size-4 text-rose-500" />
            Platform Infrastructure Health
          </h2>

          <div className="space-y-3 divide-y divide-border/40">
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">PostgreSQL Database</p>
                <p className="text-[10px] text-muted-foreground">Drizzle ORM Connection Pool</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="size-3" /> ONLINE ({health?.db.latencyMs ?? 0}ms)
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Default Platform SMTP</p>
                <p className="text-[10px] text-muted-foreground">
                  {health?.services.smtp.configured ? 'Configured in public schema' : 'Using env defaults'}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                health?.services.smtp.lastStatus === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {health?.services.smtp.lastStatus === 'ok' ? 'TEST PASSED' : 'STANDBY'}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Global Backups Engine</p>
                <p className="text-[10px] text-muted-foreground">
                  {health?.services.backups.lastBackupAt
                    ? `Last run: ${new Date(health.services.backups.lastBackupAt).toLocaleDateString()}`
                    : 'Awaiting scheduled cycle'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck className="size-3" /> READY
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Memory RSS Utilization</p>
                <p className="text-[10px] text-muted-foreground">Resident set size</p>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {health?.memory.rssMb ?? 0} MB
              </span>
            </div>
          </div>
        </Card>

        {/* Recent Admin Audit Activity */}
        <Card padding="md" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ScrollText className="size-4 text-muted-foreground" />
              Recent Maintainer Actions
            </h2>
            <Link href="/admin/audit-log" className="text-xs text-rose-400 hover:underline font-semibold flex items-center gap-1">
              <span>View Full Trail</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {recentAudits.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No recent super admin actions recorded.
            </div>
          ) : (
            <div className="divide-y divide-border/40 overflow-hidden">
              {recentAudits.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{log.action}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {log.targetType}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      by {log.adminEmail || 'System'} {log.targetId ? `· target: ${log.targetId}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
