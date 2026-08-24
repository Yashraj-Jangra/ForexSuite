'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import {
  ScrollText,
  Plus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Calendar,
} from 'lucide-react';

type Lut = {
  id: string;
  referenceNumber: string;
  issuedDate: string;
  expiryDate: string;
  issuingAuthority: string;
  gstPortalAckNumber: string | null;
  financialYear: string | null;
  autoRenewReminder: boolean;
  isActive: boolean;
};

export default function LutPage() {
  const [luts, setLuts] = useState<Lut[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [expiryDate, setExpiryDate] = useState(`${new Date().getFullYear() + 1}-03-31`);
  const [issuingAuthority, setIssuingAuthority] = useState('Central Goods and Services Tax, Range-IV');
  const [gstPortalAckNumber, setGstPortalAckNumber] = useState('');
  const [financialYear, setFinancialYear] = useState('2026-27');
  const [autoRenewReminder, setAutoRenewReminder] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/trpc/luts.list', { credentials: 'include' });
      const json = await res.json();
      const data = Array.isArray(json?.result?.data) ? json.result.data : json?.result?.data?.data || [];
      setLuts(data);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/trpc/luts.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceNumber,
          issuedDate,
          expiryDate,
          issuingAuthority,
          gstPortalAckNumber: gstPortalAckNumber || undefined,
          financialYear,
          autoRenewReminder,
        }),
      });
      if (res.ok) {
        setReferenceNumber('');
        setGstPortalAckNumber('');
        setShowForm(false);
        await load();
      }
    } catch {
      /* ignore */
    }
    setSubmitting(false);
  }

  async function handleDeactivate(id: string) {
    try {
      await fetch('/api/trpc/luts.deactivate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id),
      });
      await load();
    } catch {
      /* ignore */
    }
  }

  const activeLut = luts.find((l) => l.isActive);

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ScrollText className="size-6 text-accent" />
            LUT Registry &amp; RFD-11 Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Letter of Undertaking for zero-rated export of services and goods under Section 16 of the IGST Act.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>Register New LUT</span>
        </Button>
      </div>

      {/* Active LUT Banner */}
      {activeLut ? (
        <Card padding="md" className="border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-emerald-500 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Active Letter of Undertaking
                </span>
                <span className="font-mono text-sm font-bold text-foreground">({activeLut.referenceNumber})</span>
                {activeLut.financialYear && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    FY {activeLut.financialYear}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expires on <strong className="font-mono text-foreground">{activeLut.expiryDate}</strong> · Valid for zero-tax exports
                {activeLut.gstPortalAckNumber && ` · GST ARN: ${activeLut.gstPortalAckNumber}`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeactivate(activeLut.id)}
            className="text-xs text-rose-500 hover:text-rose-600 border-rose-500/30"
          >
            Deactivate
          </Button>
        </Card>
      ) : (
        <Card padding="md" className="border-amber-500/40 bg-amber-500/5 flex items-center gap-3">
          <AlertCircle className="size-6 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">No Active LUT on File</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Export invoices without an active LUT require upfront IGST payment under refund mechanism.
            </p>
          </div>
        </Card>
      )}

      {/* New LUT Form */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-accent/5">
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">Register GST Form RFD-11 (LUT)</h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Input
                label="LUT Reference Number *"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. LUT-2026-001"
                required
                className="font-mono"
              />
              <Input
                label="GST Portal ARN Number"
                value={gstPortalAckNumber}
                onChange={(e) => setGstPortalAckNumber(e.target.value)}
                placeholder="e.g. AD060326001234F"
                className="font-mono"
              />
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Financial Year *</label>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2 font-mono"
                >
                  <option value="2026-27">2026-27</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2024-25">2024-25</option>
                </select>
              </div>
              <Input
                label="Issuing Authority *"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="Issued Date *"
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                required
              />
              <Input
                label="Expiry Date *"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoRenewReminder}
                onChange={(e) => setAutoRenewReminder(e.target.checked)}
                className="rounded"
              />
              <span>Send automated email notification 30 days prior to March 31st expiry</span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Registering...' : 'Register LUT'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* History List */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">LUT Registration History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">LUT Ref / ARN</th>
                <th className="py-3 px-4">Financial Year</th>
                <th className="py-3 px-4">Issuing Authority</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {luts.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    <div>{l.referenceNumber}</div>
                    {l.gstPortalAckNumber && (
                      <div className="text-[10px] text-muted-foreground font-normal">{l.gstPortalAckNumber}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono">{l.financialYear || '—'}</td>
                  <td className="py-3 px-4">{l.issuingAuthority}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{l.issuedDate}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{l.expiryDate}</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        l.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {l.isActive ? 'Active' : 'Expired'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
}