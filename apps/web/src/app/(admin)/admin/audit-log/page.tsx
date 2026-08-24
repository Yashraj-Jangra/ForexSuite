'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ScrollText,
  Search,
  Download,
  RefreshCw,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

type AuditLogItem = {
  id: string;
  adminUserId: string | null;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  payload: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/trpc/admin.audit.list?input=${encodeURIComponent(
          JSON.stringify({
            search: search || undefined,
            targetType: targetFilter !== 'all' ? targetFilter : undefined,
          }),
        )}`,
        { credentials: 'include' },
      );
      const json = await res.json();
      if (json?.result?.data) {
        setLogs(json.result.data.logs || []);
        setTotal(json.result.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, [targetFilter]);

  function handleExportCsv() {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Admin Email', 'Action', 'Target Type', 'Target ID', 'IP Address', 'Payload'];
    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.id,
        log.createdAt,
        log.adminEmail || 'System',
        log.action,
        log.targetType,
        log.targetId || '',
        log.ipAddress || '',
        `"${JSON.stringify(log.payload || {}).replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultbill_platform_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Platform Audit Trail</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
              {total} EVENTS
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Immutable, tamper-evident record of all maintainer and super administrative actions across the platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleExportCsv} className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white">
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm" className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
            placeholder="Search action, email, or target ID..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs uppercase"
          >
            <option value="all">All Entity Targets</option>
            <option value="tenant">Tenant Actions</option>
            <option value="user">User Actions</option>
            <option value="flag">Feature Flag Changes</option>
            <option value="smtp">SMTP Relay Changes</option>
            <option value="backup">Backup Executions</option>
          </select>

          <Button size="sm" onClick={loadLogs} className="text-xs shrink-0">
            Filter
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4 w-10" />
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Admin Actor</th>
                <th className="py-3 px-4">Target Type / ID</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 opacity-50" />
                    <p>Loading audit entries...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <ScrollText className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No audit trail records found</p>
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <>
                    <tr
                      key={l.id}
                      onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-muted-foreground">
                        {expandedId === l.id ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-foreground">{l.action}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{l.adminEmail || 'System Process'}</div>
                        {l.adminUserId && (
                          <div className="font-mono text-[10px] text-muted-foreground truncate max-w-xs">{l.adminUserId}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-muted text-muted-foreground mr-1.5">
                          {l.targetType}
                        </span>
                        {l.targetId && <span className="font-mono text-[10px] text-muted-foreground">{l.targetId}</span>}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {l.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>

                    {expandedId === l.id && (
                      <tr className="bg-muted/20">
                        <td colSpan={6} className="p-4">
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto space-y-2">
                            <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                              Payload JSON Context:
                            </div>
                            <pre className="text-[11px] leading-relaxed">
                              {JSON.stringify(l.payload, null, 2) || '{}'}
                            </pre>
                            {l.userAgent && (
                              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                                User-Agent: {l.userAgent}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
