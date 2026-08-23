'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

type FemaAlert = {
  invoices: { id: string; invoiceNumber: string; dateOfExport: string | null };
  customers: { name: string } | null;
  daysSince: number;
  status: string;
};

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<{ critical: FemaAlert[]; warning: FemaAlert[]; ok: FemaAlert[]; total: number }>({ critical: [], warning: [], ok: [], total: 0 });

  useEffect(() => {
    fetch('/api/trpc/fema.alerts', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => setAlerts(j?.result?.data?.data || { critical: [], warning: [], ok: [], total: 0 }))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Invoices</p>
          <p className="text-2xl font-bold mt-1">{alerts.total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total export invoices</p>
        </Card>
        <Card padding="md" className={alerts.critical.length > 0 ? 'border-red-400/30' : ''}>
          <p className="text-sm text-muted-foreground">FEMA Critical</p>
          <p className={`text-2xl font-bold mt-1 ${alerts.critical.length > 0 ? 'text-red-400' : ''}`}>{alerts.critical.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">240+ days overdue</p>
        </Card>
        <Card padding="md" className={alerts.warning.length > 0 ? 'border-yellow-400/30' : ''}>
          <p className="text-sm text-muted-foreground">FEMA Warning</p>
          <p className={`text-2xl font-bold mt-1 ${alerts.warning.length > 0 ? 'text-yellow-400' : ''}`}>{alerts.warning.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">180-239 days</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{alerts.critical.length === 0 && alerts.warning.length === 0 ? 'All clear' : 'Action needed'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">FEMA compliance</p>
        </Card>
      </div>

      {(alerts.critical.length > 0 || alerts.warning.length > 0) && (
        <Card padding="md">
          <h3 className="font-medium mb-3">FEMA Export Alerts</h3>
          <div className="space-y-2">
            {[...alerts.critical, ...alerts.warning].map((a) => (
              <div key={a.invoices.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.invoices.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{a.customers?.name ?? 'Unknown'} · {a.invoices.dateOfExport}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'critical' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                  {a.daysSince} days
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}