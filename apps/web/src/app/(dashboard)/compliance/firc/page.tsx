'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import {
  Landmark,
  Plus,
  Link2,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

type Firc = {
  id: string;
  fircNumber: string;
  issuingBank: string;
  amount: string;
  currency: string;
  unmappedAmountInr: string;
  dateOfIssuance: string;
  eFircReference: string | null;
  adBankName: string | null;
  remitterName: string | null;
  shortRealizationFlag: boolean;
  shortRealizationAmount: string | null;
  shortRealizationReason: string | null;
  compoundingRequired: boolean;
  edpmsStatus: 'pending' | 'reported' | 'closed';
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  total: string;
  currency: string;
  status: string;
  isExport: boolean | null;
};

const EDPMS_BADGES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  reported: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  closed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function FircPage() {
  const [fircs, setFircs] = useState<Firc[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [linkingFircId, setLinkingFircId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [fircNumber, setFircNumber] = useState('');
  const [issuingBank, setIssuingBank] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('');
  const [dateOfIssuance, setDateOfIssuance] = useState(new Date().toISOString().split('T')[0] || '');
  const [eFircReference, setEFircReference] = useState('');
  const [adBankName, setAdBankName] = useState('');
  const [remitterName, setRemitterName] = useState('');
  const [shortRealizationFlag, setShortRealizationFlag] = useState(false);
  const [shortRealizationAmount, setShortRealizationAmount] = useState('');
  const [shortRealizationReason, setShortRealizationReason] = useState('bank_charges');
  const [edpmsStatus, setEdpmsStatus] = useState<'pending' | 'reported' | 'closed'>('pending');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const [fRes, iRes] = await Promise.all([
        fetch('/api/trpc/fircs.list', { credentials: 'include' }),
        fetch('/api/trpc/invoices.list', { credentials: 'include' }),
      ]);
      const fJson = await fRes.json();
      const iJson = await iRes.json();
      const fircList = Array.isArray(fJson?.result?.data) ? fJson.result.data : fJson?.result?.data?.data || [];
      setFircs(fircList);
      const rawInvs = Array.isArray(iJson?.result?.data) ? iJson.result.data : iJson?.result?.data?.data || [];
      const invList = rawInvs.map((row: any) => row.invoices || row);
      setInvoices(invList);
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
      const res = await fetch('/api/trpc/fircs.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fircNumber,
          issuingBank,
          amount: Number(amount),
          currency,
          exchangeRate: exchangeRate ? Number(exchangeRate) : undefined,
          dateOfIssuance,
          eFircReference: eFircReference || undefined,
          adBankName: adBankName || undefined,
          remitterName: remitterName || undefined,
          shortRealizationFlag,
          shortRealizationAmount: shortRealizationFlag && shortRealizationAmount ? Number(shortRealizationAmount) : undefined,
          shortRealizationReason: shortRealizationFlag ? shortRealizationReason : undefined,
          edpmsStatus,
        }),
      });
      if (res.ok) {
        setFircNumber('');
        setIssuingBank('');
        setAmount('');
        setExchangeRate('');
        setEFircReference('');
        setAdBankName('');
        setRemitterName('');
        setShortRealizationFlag(false);
        setShortRealizationAmount('');
        setShowForm(false);
        await load();
      }
    } catch {
      /* ignore */
    }
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
    } catch {
      /* ignore */
    }
  }

  const filteredFircs = fircs.filter(
    (f) =>
      f.fircNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.issuingBank.toLowerCase().includes(search.toLowerCase()) ||
      (f.eFircReference || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.remitterName || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Landmark className="size-6 text-accent" />
            e-FIRC &amp; EDPMS Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Foreign Inward Remittance Certificates, EDPMS settlement tracking, and invoice matching.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
          <Plus className="size-4" />
          {showForm ? 'Cancel' : 'Record e-FIRC'}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-accent/5">
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">New Inward Remittance Certificate</h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Input
                label="FIRC / URN Number *"
                value={fircNumber}
                onChange={(e) => setFircNumber(e.target.value)}
                placeholder="e.g. FIRC-2026-9812"
                required
                className="font-mono"
              />
              <Input
                label="Issuing Bank *"
                value={issuingBank}
                onChange={(e) => setIssuingBank(e.target.value)}
                placeholder="e.g. HDFC Bank Ltd"
                required
              />
              <Input
                label="Amount Foreign *"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000.00"
                required
                className="font-mono"
              />
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Currency *</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                label="Date of Issuance *"
                type="date"
                value={dateOfIssuance}
                onChange={(e) => setDateOfIssuance(e.target.value)}
                required
              />
              <Input
                label="EDPMS Reference / e-FIRC Ref"
                value={eFircReference}
                onChange={(e) => setEFircReference(e.target.value)}
                placeholder="e.g. EDPMS-2026-4421"
                className="font-mono"
              />
              <Input
                label="Authorized Dealer (AD) Bank"
                value={adBankName}
                onChange={(e) => setAdBankName(e.target.value)}
                placeholder="e.g. ICICI Bank AD Branch"
              />
            </div>

            {/* Short-realization options */}
            <div className="p-3 rounded-xl bg-background border border-border space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={shortRealizationFlag}
                  onChange={(e) => setShortRealizationFlag(e.target.checked)}
                  className="rounded text-accent"
                />
                <span>Flag as Short-Realization (Deduction in foreign inward amount)</span>
              </label>

              {shortRealizationFlag && (
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <Input
                    label="Short Realization Amount"
                    type="number"
                    step="0.01"
                    value={shortRealizationAmount}
                    onChange={(e) => setShortRealizationAmount(e.target.value)}
                    placeholder="e.g. 25.00"
                    className="font-mono"
                  />
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason</label>
                    <select
                      value={shortRealizationReason}
                      onChange={(e) => setShortRealizationReason(e.target.value)}
                      className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2"
                    >
                      <option value="bank_charges">Intermediary Bank Charges</option>
                      <option value="exchange_difference">Exchange Rate Variance</option>
                      <option value="buyer_withholding">Foreign Withholding Tax</option>
                      <option value="other">Other Permissible Deductions</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Recording...' : 'Save e-FIRC Record'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search by FIRC number, issuing bank, EDPMS reference, or remitter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* FIRCs Table */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFircs.map((f) => (
          <Card key={f.id} padding="md" className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground font-mono">{f.fircNumber}</p>
                  <p className="text-xs text-muted-foreground">{f.issuingBank}</p>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                    EDPMS_BADGES[f.edpmsStatus] || ''
                  }`}
                >
                  {f.edpmsStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remittance Amount:</span>
                  <span className="font-mono font-bold text-foreground">
                    {f.currency} {Number(f.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unmapped Balance:</span>
                  <span className="font-mono font-bold text-accent">
                    ₹ {Number(f.unmappedAmountInr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {f.eFircReference && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">EDPMS Ref:</span>
                    <span className="font-mono text-muted-foreground">{f.eFircReference}</span>
                  </div>
                )}
                {f.shortRealizationFlag && (
                  <div className="text-[10px] text-amber-500 font-semibold pt-1 flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    <span>Short-Realization: {f.currency} {f.shortRealizationAmount || '0'} ({f.shortRealizationReason})</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground font-mono">
                Issued: {new Date(f.dateOfIssuance).toLocaleDateString()}
              </p>
            </div>

            {/* Linking Action */}
            <div className="pt-2 border-t border-border/50">
              {linkingFircId === f.id ? (
                <div className="space-y-2">
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full h-8 rounded-lg border border-input bg-background text-xs px-2"
                  >
                    <option value="">Select Export Invoice to Link</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.currency} {inv.total}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="INR Amount to Match"
                    type="number"
                    value={linkAmount}
                    onChange={(e) => setLinkAmount(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLinkingFircId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleLink(f.id)}>
                      Confirm Link
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLinkingFircId(f.id)}
                  disabled={Number(f.unmappedAmountInr) <= 0}
                  className="w-full h-8 text-xs gap-1.5"
                >
                  <Link2 className="size-3.5" />
                  <span>{Number(f.unmappedAmountInr) <= 0 ? 'Fully Reconciled' : 'Match with Invoice'}</span>
                </Button>
              )}
            </div>
          </Card>
        ))}

        {filteredFircs.length === 0 && (
          <Card padding="lg" className="col-span-full py-12 text-center text-muted-foreground space-y-2">
            <Landmark className="size-8 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No e-FIRCs recorded yet</p>
            <p className="text-xs">Record bank Foreign Inward Remittance Certificates for EDPMS export settlement.</p>
          </Card>
        )}
      </div>
    </Container>
  );
}