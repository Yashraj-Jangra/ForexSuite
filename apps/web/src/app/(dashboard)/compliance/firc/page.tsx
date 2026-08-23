'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';

type Firc = { id: string; fircNumber: string; issuingBank: string; amount: string; currency: string; unmappedAmountInr: string; dateOfIssuance: string };
type Invoice = { id: string; invoiceNumber: string; total: string; currency: string; status: string };

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
  const [dateOfIssuance, setDateOfIssuance] = useState('');

  async function load() {
    try {
      const [fRes, iRes] = await Promise.all([
        fetch('/api/trpc/fircs.list', { credentials: 'include' }),
        fetch('/api/trpc/invoices.list', { credentials: 'include' }),
      ]);
      const fJson = await fRes.json();
      const iJson = await iRes.json();
      setFircs(fJson?.result?.data?.data || []);
      setInvoices(iJson?.result?.data?.data || []);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/trpc/fircs.create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fircNumber, issuingBank, amount: Number(amount), currency, dateOfIssuance }),
    });
    setFircNumber(''); setIssuingBank(''); setAmount(''); setCurrency('USD'); setDateOfIssuance(''); setShowForm(false);
    load();
  }

  async function handleLink(fircId: string) {
    await fetch('/api/trpc/fircs.linkInvoice', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fircId, invoiceId: selectedInvoiceId, amount: Number(linkAmount) }),
    });
    setLinkingFircId(null);
    setSelectedInvoiceId('');
    setLinkAmount('');
    load();
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">FIRC Manager</h1>
          <p className="text-sm text-muted-foreground">Foreign Inward Remittance Certificates</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>Add FIRC</Button>
      </div>

      {showForm && (
        <Card padding="md" className="mb-6 max-w-lg">
          <form onSubmit={handleCreate} className="space-y-3">
            <Input label="FIRC number" value={fircNumber} onChange={(e) => setFircNumber(e.target.value)} required />
            <Input label="Issuing bank" value={issuingBank} onChange={(e) => setIssuingBank(e.target.value)} required />
            <div className="flex gap-3">
              <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-24 h-10 mt-6 px-3 rounded-lg border border-input bg-background text-sm">
                <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option>
              </select>
            </div>
            <Input label="Date of issuance" type="date" value={dateOfIssuance} onChange={(e) => setDateOfIssuance(e.target.value)} required />
            <Button type="submit" size="sm">Save FIRC</Button>
          </form>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {fircs.map((f) => (
          <Card key={f.id} padding="md">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{f.fircNumber}</p>
                <p className="text-sm text-muted-foreground">{f.issuingBank}</p>
              </div>
              <p className="text-sm font-medium">{f.currency} {Number(f.amount).toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Unmapped: {Number(f.unmappedAmountInr ?? f.amount).toLocaleString()} · Issued: {f.dateOfIssuance}
            </p>
            {Number(f.unmappedAmountInr ?? f.amount) > 0 && (
              <div className="mt-3">
                {linkingFircId === f.id ? (
                  <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/30">
                    <select
                      value={selectedInvoiceId}
                      onChange={(e) => setSelectedInvoiceId(e.target.value)}
                      className="w-full h-9 px-2 rounded border border-input bg-background text-sm"
                    >
                      <option value="">Select invoice...</option>
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {inv.currency} {Number(inv.total).toLocaleString()} ({inv.status})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount to match"
                      value={linkAmount}
                      onChange={(e) => setLinkAmount(e.target.value)}
                      className="w-full h-9 px-2 rounded border border-input bg-background text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleLink(f.id)} disabled={!selectedInvoiceId || !linkAmount}>Confirm</Button>
                      <Button size="sm" variant="outline" onClick={() => { setLinkingFircId(null); setSelectedInvoiceId(''); setLinkAmount(''); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setLinkingFircId(f.id)}>Link to invoice</Button>
                )}
              </div>
            )}
          </Card>
        ))}
        {fircs.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-10">No FIRCs yet</p>
        )}
      </div>
    </Container>
  );
}