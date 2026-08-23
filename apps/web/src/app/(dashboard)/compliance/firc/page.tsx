'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Landmark, Plus, Link2, CheckCircle2, FileText, ArrowUpRight, Search } from 'lucide-react';

type Firc = {
  id: string;
  fircNumber: string;
  issuingBank: string;
  amount: string;
  currency: string;
  unmappedAmountInr: string;
  dateOfIssuance: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  total: string;
  currency: string;
  status: string;
  isExport: boolean | null;
};

export default function FircPage() {
  const [fircs, setFircs] = useState<Firc[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [linkingFircId, setLinkingFircId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [fircNumber, setFircNumber] = useState('');
  const [issuingBank, setIssuingBank] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dateOfIssuance, setDateOfIssuance] = useState(new Date().toISOString().split('T')[0] || '');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const [fRes, iRes] = await Promise.all([
        fetch('/api/trpc/fircs.list', { credentials: 'include' }),
        fetch('/api/trpc/invoices.list', { credentials: 'include' }),
      ]);
      const fJson = await fRes.json();
      const iJson = await iRes.json();
      const fircList = Array.isArray(fJson?.result?.data) ? fJson.result.data : (fJson?.result?.data?.data || []);
      setFircs(fircList);
      const rawInvs = Array.isArray(iJson?.result?.data) ? iJson.result.data : (iJson?.result?.data?.data || []);
      const invList = rawInvs.map((row: any) => row.invoices || row);
      setInvoices(invList);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/trpc/fircs.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fircNumber,
          issuingBank,
          amount: Number(amount),
          currency,
          dateOfIssuance,
        }),
      });
      if (res.ok) {
        setFircNumber('');
        setIssuingBank('');
        setAmount('');
        setShowForm(false);
        await load();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handleLink(fircId: string) {
    if (!selectedInvoiceId || !linkAmount) return;
    try {
      await fetch('/api/trpc/fircs.linkInvoice', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fircId, invoiceId: selectedInvoiceId, amount: Number(linkAmount) }),
      });
      setLinkingFircId(null);
      setSelectedInvoiceId('');
      setLinkAmount('');
      await load();
    } catch { /* ignore */ }
  }


  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">FIRC Manager</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Foreign Inward Remittance Certificates (e-FIRC / Advice) for export payment reconciliation.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>Add FIRC Document</span>
        </Button>
      </div>

      {/* Add FIRC Form */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-card/90 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Landmark className="size-4 text-accent" />
              <span>Record Foreign Inward Remittance Certificate (FIRC)</span>
            </h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="FIRC / Advice Reference Number *"
                value={fircNumber}
                onChange={(e) => setFircNumber(e.target.value)}
                placeholder="HDFC-FIRC-2026-0042"
                required
              />
              <Input
                label="Issuing Bank (AD Bank) *"
                value={issuingBank}
                onChange={(e) => setIssuingBank(e.target.value)}
                placeholder="HDFC Bank Ltd, Mumbai Forex Branch"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Remittance Amount *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10000"
                    required
                    className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono font-bold"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-24 h-10 px-2 rounded-lg border border-input bg-background text-sm font-bold font-mono"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>AED</option>
                    <option>SGD</option>
                  </select>
                </div>
              </div>

              <Input
                label="Date of Remittance / Issuance *"
                type="date"
                value={dateOfIssuance}
                onChange={(e) => setDateOfIssuance(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save FIRC'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* FIRC Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {fircs.map((f) => {
          const totalAmt = Number(f.amount || 0);
          const unmapped = Number(f.unmappedAmountInr ?? f.amount);
          const mapped = Math.max(totalAmt - unmapped, 0);
          const percentMapped = totalAmt > 0 ? (mapped / totalAmt) * 100 : 0;

          return (
            <Card key={f.id} padding="md" className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-sm font-bold text-foreground">{f.fircNumber}</p>
                  <p className="text-xs text-muted-foreground">{f.issuingBank}</p>
                </div>
                <span className="font-mono text-base font-bold text-accent">
                  {f.currency} {totalAmt.toLocaleString()}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Reconciled: {f.currency} {mapped.toLocaleString()}</span>
                  <span>Unmapped: <strong className="text-foreground">{f.currency} {unmapped.toLocaleString()}</strong></span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${percentMapped}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                <span>Issued: {f.dateOfIssuance}</span>

                {unmapped > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setLinkingFircId(linkingFircId === f.id ? null : f.id);
                      setLinkAmount(String(unmapped));
                    }}
                    className="h-7 text-xs gap-1 text-accent hover:bg-accent/10"
                  >
                    <Link2 className="size-3" />
                    <span>Link Invoice</span>
                  </Button>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 className="size-3.5" />
                    <span>Fully Reconciled</span>
                  </span>
                )}

              </div>

              {/* Linking dialog panel */}
              {linkingFircId === f.id && (
                <div className="p-3 rounded-xl border border-accent/40 bg-muted/30 space-y-3 animate-in fade-in text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Reconcile with Open Invoice</span>
                    <span className="text-muted-foreground font-mono">Max: {unmapped}</span>
                  </div>

                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-input bg-background text-xs"
                  >
                    <option value="">Select invoice to reconcile...</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.currency} {Number(inv.total).toLocaleString()} ({inv.status})
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount to match"
                      value={linkAmount}
                      onChange={(e) => setLinkAmount(e.target.value)}
                      className="flex-1 h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs"
                    />
                    <Button size="sm" onClick={() => handleLink(f.id)} disabled={!selectedInvoiceId || !linkAmount} className="h-8 text-xs">
                      Confirm Link
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLinkingFircId(null)} className="h-8 text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {fircs.length === 0 && (
          <Card padding="lg" className="col-span-full py-12 text-center text-muted-foreground space-y-2">
            <Landmark className="size-8 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No FIRCs registered</p>
            <p className="text-xs">Record bank remittance advices to reconcile against export invoices.</p>
          </Card>
        )}
      </div>
    </Container>
  );
}