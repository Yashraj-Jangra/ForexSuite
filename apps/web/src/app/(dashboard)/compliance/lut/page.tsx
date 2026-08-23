'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { ScrollText, Plus, ShieldCheck, AlertCircle, CheckCircle, Clock } from 'lucide-react';

type Lut = {
  id: string;
  referenceNumber: string;
  issuedDate: string;
  expiryDate: string;
  issuingAuthority: string;
  isActive: boolean;
};

export default function LutPage() {
  const [luts, setLuts] = useState<Lut[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [expiryDate, setExpiryDate] = useState(`${new Date().getFullYear() + 1}-03-31`);
  const [issuingAuthority, setIssuingAuthority] = useState('Central Goods and Services Tax, Range-IV');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/trpc/luts.list', { credentials: 'include' });
      const json = await res.json();
      setLuts(json?.result?.data?.data || []);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/trpc/luts.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceNumber, issuedDate, expiryDate, issuingAuthority }),
      });
      setReferenceNumber('');
      setShowForm(false);
      load();
    } catch { /* ignore */ }
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
      load();
    } catch { /* ignore */ }
  }

  const activeLut = luts.find((l) => l.isActive);

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">LUT Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Letter of Undertaking (Form GST RFD-11) for zero-rated export of services and goods.
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
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Letter of Undertaking</span>
                <span className="font-mono text-sm font-bold text-foreground">({activeLut.referenceNumber})</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authority: {activeLut.issuingAuthority} · Valid from {activeLut.issuedDate} until <strong className="text-foreground">{activeLut.expiryDate}</strong>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ACTIVE FOR EXPORT
          </span>
        </Card>
      ) : (
        <Card padding="md" className="border-amber-500/40 bg-amber-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">No Active LUT Configured</p>
              <p className="text-xs text-muted-foreground">Register your ARN/LUT to enable zero-rated export invoices without integrated tax payment.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} className="text-xs">
            Register LUT Now
          </Button>
        </Card>
      )}


      {/* Registration Form */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-card/90 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <ScrollText className="size-4 text-accent" />
              <span>Register Letter of Undertaking (LUT)</span>
            </h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="LUT ARN / Reference Number *"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="AD270324001234F"
                required
              />
              <Input
                label="Issuing Tax Authority *"
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
                label="Expiry Date (typically March 31 of FY) *"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save and Set as Active LUT'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* LUT Registry Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {luts.map((l) => (
          <Card key={l.id} padding="md" className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-base font-bold text-foreground">{l.referenceNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{l.issuingAuthority}</p>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  l.isActive
                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {l.isActive ? 'Active' : 'Archived'}
              </span>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
              <span>Issued: {l.issuedDate}</span>
              <span className="font-semibold text-foreground">Expires: {l.expiryDate}</span>
            </div>

            {l.isActive && (
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeactivate(l.id)}
                  className="h-7 text-xs text-red-400 hover:text-red-300"
                >
                  Deactivate
                </Button>
              </div>
            )}
          </Card>
        ))}

        {luts.length === 0 && (
          <Card padding="lg" className="col-span-full py-12 text-center text-muted-foreground space-y-2">
            <ScrollText className="size-8 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No Letter of Undertaking registered</p>
            <p className="text-xs">Add your LUT number to automatically zero-rate GST for export invoices.</p>
          </Card>
        )}
      </div>
    </Container>
  );
}