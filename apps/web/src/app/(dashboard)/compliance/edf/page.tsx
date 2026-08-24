'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import {
  FileCheck2,
  Plus,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Info,
  RefreshCw,
} from 'lucide-react';

type EdfRecord = {
  id: string;
  invoiceId: string | null;
  edfNumber: string | null;
  softexNumber: string | null;
  financialYear: string;
  buyerName: string;
  buyerCountry: string;
  purposeCode: string;
  amountForeign: string;
  currency: string;
  adBankName: string | null;
  status: string;
  submittedAt: string | null;
  acknowledgedAt: string | null;
  notes: string | null;
  createdAt: string;
};

type EdfSummary = { draft: number; submitted: number; acknowledged: number; closed: number };

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: <Clock className="size-3" /> },
  submitted: { label: 'Submitted', cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: <ChevronRight className="size-3" /> },
  acknowledged: { label: 'Acknowledged', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: <CheckCircle2 className="size-3" /> },
  closed: { label: 'Closed', cls: 'bg-muted text-muted-foreground border-border', icon: <CheckCircle2 className="size-3" /> },
};

const CURRENT_FY = (() => {
  const now = new Date();
  const yr = now.getFullYear();
  return now.getMonth() >= 3 ? `${yr}-${String(yr + 1).slice(2)}` : `${yr - 1}-${String(yr).slice(2)}`;
})();

const PURPOSE_CODES = [
  { code: 'P0802', description: 'Software services' },
  { code: 'P1006', description: 'Consultancy services' },
  { code: 'P0016', description: 'Currency exchange / FFMC sales' },
  { code: 'P0101', description: 'Export of goods' },
];

export default function EdfPage() {
  const [records, setRecords] = useState<EdfRecord[]>([]);
  const [summary, setSummary] = useState<EdfSummary>({ draft: 0, submitted: 0, acknowledged: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    financialYear: CURRENT_FY,
    buyerName: '',
    buyerCountry: '',
    buyerAddress: '',
    purposeCode: 'P0802',
    amountForeign: '',
    currency: 'USD',
    amountInr: '',
    adBankName: '',
    adBranchCity: '',
    softexNumber: '',
    notes: '',
  });

  async function load() {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        fetch('/api/trpc/edf.list', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/trpc/edf.summary', { credentials: 'include' }).then((r) => r.json()),
      ]);
      setRecords(Array.isArray(listRes?.result?.data) ? listRes.result.data : []);
      if (summaryRes?.result?.data) setSummary(summaryRes.result.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        financialYear: form.financialYear,
        buyerName: form.buyerName,
        buyerCountry: form.buyerCountry,
        buyerAddress: form.buyerAddress || undefined,
        purposeCode: form.purposeCode,
        amountForeign: Number(form.amountForeign),
        currency: form.currency,
        amountInr: form.amountInr ? Number(form.amountInr) : undefined,
        adBankName: form.adBankName || undefined,
        adBranchCity: form.adBranchCity || undefined,
        softexNumber: form.softexNumber || undefined,
        notes: form.notes || undefined,
      };
      const res = await fetch('/api/trpc/edf.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: payload }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ ...form, buyerName: '', buyerCountry: '', amountForeign: '', amountInr: '' });
        await load();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch('/api/trpc/edf.updateStatus', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: { id, status } }),
    });
    await load();
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">EDF / SOFTEX Declarations</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
                NEW — Oct 2026
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Export Declaration Form — replaces SOFTEX from October 1, 2026 (FEMA 2026 Regulations)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5 text-xs">
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 text-xs">
              <Plus className="size-3.5" />
              New EDF Record
            </Button>
          </div>
        </div>

        {/* Regulatory Notice */}
        <Card padding="md" className="border-amber-500/30 bg-amber-500/5">
          <div className="flex gap-3">
            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">FEMA 2026 — EDF Mandatory from October 1, 2026</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The <strong>Export Declaration Form (EDF)</strong> replaces the legacy SOFTEX form under the new FEMA (Export &amp; Import of Goods and Services) Regulations 2026.
                All software and service exporters must file an EDF through their Authorized Dealer (AD) bank for each export transaction.
                Failure to file may trigger EDPMS flagging and FEMA compounding proceedings.
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-[11px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Info className="size-3 text-blue-400" />
                  Purpose code required (e.g. P0802 for software)
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Info className="size-3 text-blue-400" />
                  File within 270 days of invoice
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Info className="size-3 text-blue-400" />
                  AD bank acknowledgment required
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'draft', label: 'Draft', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { key: 'submitted', label: 'Submitted to AD', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { key: 'acknowledged', label: 'Acknowledged', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { key: 'closed', label: 'Closed', color: 'text-muted-foreground', bg: 'bg-muted' },
          ].map(({ key, label, color, bg }) => (
            <Card key={key} padding="sm" className="text-center space-y-1">
              <div className={`text-2xl font-extrabold font-mono ${color}`}>
                {summary[key as keyof EdfSummary]}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
              <div className={`h-1.5 rounded-full mx-auto w-8 ${bg}`} />
            </Card>
          ))}
        </div>

        {/* New EDF Form */}
        {showForm && (
          <Card padding="md" className="border-accent/30 bg-accent/5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">New EDF Declaration</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xs">✕ Cancel</button>
            </div>
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Financial Year *</label>
                <input value={form.financialYear} onChange={(e) => setForm({ ...form, financialYear: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" required />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Buyer Name *</label>
                <input value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" required />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Buyer Country *</label>
                <input value={form.buyerCountry} onChange={(e) => setForm({ ...form, buyerCountry: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" required />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">RBI Purpose Code *</label>
                <select value={form.purposeCode} onChange={(e) => setForm({ ...form, purposeCode: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
                  {PURPOSE_CODES.map((p) => (
                    <option key={p.code} value={p.code}>{p.code} — {p.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Amount (Foreign) *</label>
                <input type="number" value={form.amountForeign} onChange={(e) => setForm({ ...form, amountForeign: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono" required />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Currency *</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono">
                  {['USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'AUD', 'CAD'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Amount (INR equivalent)</label>
                <input type="number" value={form.amountInr} onChange={(e) => setForm({ ...form, amountInr: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">AD Bank Name</label>
                <input value={form.adBankName} onChange={(e) => setForm({ ...form, adBankName: e.target.value })} placeholder="e.g. HDFC Bank Ltd." className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">AD Bank Branch City</label>
                <input value={form.adBranchCity} onChange={(e) => setForm({ ...form, adBranchCity: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Legacy SOFTEX Number (if migrating)</label>
                <input value={form.softexNumber} onChange={(e) => setForm({ ...form, softexNumber: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Buyer Address</label>
                <input value={form.buyerAddress} onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                  {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Create EDF Record
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Records Table */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground">EDF Records — FY {CURRENT_FY}</h2>
            <span className="text-xs text-muted-foreground">{records.length} records</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FileCheck2 className="size-10 mx-auto opacity-20" />
              <div>
                <p className="text-sm font-semibold">No EDF records yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first EDF declaration for the current financial year.</p>
              </div>
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                <Plus className="size-3.5" /> New EDF Record
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border text-left">
                    <th className="pb-2.5 font-semibold">EDF / SOFTEX #</th>
                    <th className="pb-2.5 font-semibold">Buyer</th>
                    <th className="pb-2.5 font-semibold">Purpose</th>
                    <th className="pb-2.5 font-semibold">Amount</th>
                    <th className="pb-2.5 font-semibold">AD Bank</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {records.map((rec) => {
                    const st = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.draft!;
                    return (
                      <tr key={rec.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 font-mono font-bold text-foreground">
                          {rec.edfNumber ?? rec.softexNumber ?? <span className="text-muted-foreground italic">Pending</span>}
                        </td>
                        <td className="py-2.5">
                          <div className="font-semibold text-foreground">{rec.buyerName}</div>
                          <div className="text-muted-foreground">{rec.buyerCountry}</div>
                        </td>
                        <td className="py-2.5 font-mono text-muted-foreground">{rec.purposeCode}</td>
                        <td className="py-2.5 font-mono font-bold">
                          {rec.currency} {Number(rec.amountForeign).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{rec.adBankName ?? '—'}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.cls}`}>
                            {st.icon}{st.label}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {rec.status === 'draft' && (
                              <button
                                onClick={() => handleStatusChange(rec.id, 'submitted')}
                                className="text-[10px] font-bold text-blue-500 hover:underline"
                              >
                                Mark Submitted
                              </button>
                            )}
                            {rec.status === 'submitted' && (
                              <button
                                onClick={() => handleStatusChange(rec.id, 'acknowledged')}
                                className="text-[10px] font-bold text-emerald-500 hover:underline"
                              >
                                Acknowledged
                              </button>
                            )}
                            {rec.status === 'acknowledged' && (
                              <button
                                onClick={() => handleStatusChange(rec.id, 'closed')}
                                className="text-[10px] font-bold text-muted-foreground hover:underline"
                              >
                                Close
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Compliance checklist */}
        <Card padding="md" className="border-blue-500/20 bg-blue-500/5 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Info className="size-4 text-blue-400" />
            EDF Filing Checklist
          </h3>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            {[
              'EDF must be filed before or at time of export',
              'Submit to Authorized Dealer (AD) bank in prescribed format',
              'Include correct RBI Purpose Code (e.g. P0802 for software)',
              'Retain AD bank acknowledgment for 5 years (FEMA)',
              'Foreign exchange must be realized within 270 days',
              'Short realization must be reported with justification',
              'Each invoice should link to one EDF record',
              'EDPMS entries auto-generated by AD bank on acknowledgment',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <a
            href="https://www.rbi.org.in/Scripts/BS_ViewMasCirculardetails.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline"
          >
            <ExternalLink className="size-3" />
            RBI FEMA 2026 Master Circular
          </a>
        </Card>
      </div>
    </Container>
  );
}
