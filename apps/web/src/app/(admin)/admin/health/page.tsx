'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Server,
  Database,
  Mail,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
} from 'lucide-react';

type SystemHealth = {
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

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m ${seconds % 60}s`;
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function loadHealth() {
    try {
      const res = await fetch('/api/trpc/admin.health.overview', { credentials: 'include' });
      const json = await res.json();
      if (json?.result?.data) {
        setHealth(json.result.data);
      }
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadHealth();
    if (!autoRefresh) return;
    const interval = setInterval(loadHealth, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const heapPct = health
    ? Math.round((health.memory.heapUsedMb / health.memory.heapTotalMb) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">System Health &amp; Observability</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              TELEMETRY LIVE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time infrastructure health, database connection socket latency, runtime memory pressure, and service availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer mr-2 select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto-poll (5s)</span>
          </label>

          <Button variant="outline" size="sm" onClick={loadHealth} className="gap-1.5 text-xs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Core Node & DB Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Database Socket */}
        <Card padding="md" className="space-y-3 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
              <Database className="size-4" />
              <span>PostgreSQL Cluster</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              {health?.db.latencyMs ?? 0}ms Latency
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-foreground">
            {health?.db.status === 'connected' ? 'Connected' : 'Degraded'}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Fast connection socket verified with active ping roundtrip.
          </p>
        </Card>

        {/* Runtime Memory */}
        <Card padding="md" className="space-y-3 border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-500 font-bold text-xs">
              <Cpu className="size-4" />
              <span>Memory Footprint</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-400">
              {heapPct}% Heap
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-foreground">
            {health?.memory.rssMb ?? 0} MB <span className="text-xs text-muted-foreground font-normal">RSS</span>
          </div>
          <div className="w-full bg-purple-950/50 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${heapPct}%` }} />
          </div>
        </Card>

        {/* Server Process */}
        <Card padding="md" className="space-y-3 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs">
              <Server className="size-4" />
              <span>Runtime Process</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
              PID Active
            </span>
          </div>
          <div className="text-lg font-black font-mono text-foreground truncate">
            {health ? formatUptime(health.uptimeSeconds) : '—'}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Node.js Fastify API server continuous process uptime.
          </p>
        </Card>
      </div>

      {/* Deep Subsystem Telemetry */}
      <Card padding="md" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="size-4 text-rose-500" />
          Subsystem Diagnostics &amp; Operational Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Left Column: Platform Metrics */}
          <div className="space-y-3 pt-2 md:pt-0 md:pr-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Capacity &amp; Entity Volume
            </div>

            <div className="flex items-center justify-between py-1 text-xs">
              <span className="text-muted-foreground">Active Tenant Workspaces</span>
              <span className="font-mono font-bold text-foreground">{health?.metrics.activeTenants} / {health?.metrics.totalTenants}</span>
            </div>

            <div className="flex items-center justify-between py-1 text-xs">
              <span className="text-muted-foreground">Registered User Accounts</span>
              <span className="font-mono font-bold text-foreground">{health?.metrics.totalUsers}</span>
            </div>

            <div className="flex items-center justify-between py-1 text-xs">
              <span className="text-muted-foreground">Maintainer Audit Entries</span>
              <span className="font-mono font-bold text-foreground">{health?.metrics.totalAdminAudits}</span>
            </div>
          </div>

          {/* Right Column: Services Status */}
          <div className="space-y-3 pt-4 md:pt-0 md:pl-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Critical Background Relays
            </div>

            <div className="flex items-center justify-between py-1 text-xs">
              <div>
                <p className="font-semibold text-foreground">Platform Default SMTP</p>
                <p className="text-[10px] text-muted-foreground">
                  {health?.services.smtp.lastTestAt ? `Tested: ${new Date(health.services.smtp.lastTestAt).toLocaleTimeString()}` : 'Untested'}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                health?.services.smtp.lastStatus === 'ok' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'
              }`}>
                {health?.services.smtp.lastStatus}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 text-xs">
              <div>
                <p className="font-semibold text-foreground">Global Scheduled Backups</p>
                <p className="text-[10px] text-muted-foreground">
                  {health?.services.backups.lastBackupAt ? `Last cycle: ${new Date(health.services.backups.lastBackupAt).toLocaleTimeString()}` : 'Awaiting cycle'}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                {health?.services.backups.lastStatus || 'READY'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
