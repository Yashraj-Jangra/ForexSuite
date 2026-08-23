'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import {
  ArrowLeftRight,
  Plus,
  Download,
  Search,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

type Remittance = {
  id: string;
  remitterName: string;
  remitterPan: string;
  beneficiaryName: string;
  beneficiaryCountry: string;
  amountForeign: string;
  currency: string;
  amountInr: string;
  tcsAmount: string;
  tcsPercentage: string;
  purposeCode: string;
  status: string;
  createdAt: string;
};

type PurposeCode = { code: string; category: string; description: string };

export default function LrsPage() {
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [purposeCodes, setPurposeCodes] = useState<PurposeCode[]>([]);
  const [cumulative, setCumulative] = useState<{ pan: string; total: number; limit: number; remaining: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [panQuery, setPanQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Form State
  const [remitterName, setRemitterName] = useState('');
  const [remitterPan, setRemitterPan] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryCountry, setBeneficiaryCountry] = useState('US');
  const [purposeCode, setPurposeCode] = useState('');
  const [amountForeign, setAmountForeign] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('86.85');
  const [tcsCategory, setTcsCategory] = useState('other');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const [r, pc] = await Promise.all([
        fetch('/api/trpc/remittances.list', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/trpc/remittances.purposeCodes', { credentials: 'include' }).then((r) => r.json()),
      ]);
      const remList = Array.isArray(r?.result?.data) ? r.result.data : (r?.result?.data?.data || []);
      setRemittances(remList);
      const pcList = Array.isArray(pc?.result?.data) ? pc.result.data : (pc?.result?.data?.data || []);
      setPurposeCodes(pcList);
      if (pcList[0]) setPurposeCode(pcList[0].code);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
  }, []);

  // Update exchange rate preview
  useEffect(() => {
    if (currency === 'INR') {
      setExchangeRate('1');
      return;
    }
    fetch(`/api/trpc/rates.convert?input=${encodeURIComponent(JSON.stringify({ from: currency, to: 'INR', amount: 1 }))}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.result?.data?.rate) setExchangeRate(String(j.result.data.rate));
      })
      .catch(() => {});
  }, [currency]);

  async function checkCumulative() {
    if (!panQuery) return;
    try {
      const res = await fetch(`/api/trpc/remittances.cumulative?input=${encodeURIComponent(JSON.stringify(panQuery.toUpperCase()))}`, { credentials: 'include' });
      const json = await res.json();
      const cumData = json?.result?.data?.total !== undefined ? json.result.data : json?.result?.data?.data;
      setCumulative(cumData);
    } catch { /* ignore */ }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/trpc/remittances.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remitterName,
          remitterPan: remitterPan.toUpperCase(),
          beneficiaryName,
          beneficiaryCountry,
          purposeCode,
          amountForeign: Number(amountForeign),
          currency,
          exchangeRate: Number(exchangeRate),
          tcsCategory,
        }),
      });
      const json = await res.json();
      const created = json?.result?.data;
      if (created?.id) {
        setCreatedId(created.id);
        setShowForm(false);
        setRemitterName('');
        setRemitterPan('');
        setBeneficiaryName('');
        setAmountForeign('');
        await load();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handleDownloadFormA2(id: string, pan: string) {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/trpc/remittances.formA2?input=${encodeURIComponent(JSON.stringify(id))}`, { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data?.pdf ? json.result.data : json?.result?.data?.data;
      if (data?.pdf) {
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || `Form_A2_${pan}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setDownloadingId(null);
  }


  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">LRS / Form A2 Generator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Liberalised Remittance Scheme compliance, automatic TCS calculations, and official RBI Form A2 applications.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>New Remittance</span>
        </Button>
      </div>

      {/* PAN Radar Card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md" className="sm:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">PAN Annual LRS Limit Radar</h2>
              <p className="text-xs text-muted-foreground">Check remitter's $250,000 USD statutory limit utilization</p>
            </div>
            <ShieldCheck className="size-4 text-accent" />
          </div>

          <div className="flex gap-2">
            <input
              value={panQuery}
              onChange={(e) => setPanQuery(e.target.value.toUpperCase())}
              placeholder="Enter 10-digit PAN (e.g. ABCDE1234F)"
              maxLength={10}
              className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono uppercase"
            />
            <Button size="sm" variant="outline" onClick={checkCumulative} className="text-xs">
              <Search className="size-3.5 mr-1" />
              Check Limit
            </Button>
          </div>

          {cumulative && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span>PAN: <strong className="font-mono text-accent">{cumulative.pan}</strong></span>
                <span>Limit: <strong>${cumulative.limit.toLocaleString()} USD</strong></span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    (cumulative.total / cumulative.limit) > 0.8 ? 'bg-red-400' : 'bg-accent'
                  }`}
                  style={{ width: `${Math.min((cumulative.total / cumulative.limit) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Used: ₹{cumulative.total.toLocaleString()} INR</span>
                <span className={cumulative.remaining < 50000 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                  Available: ${cumulative.remaining.toLocaleString()} USD
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card padding="md" className="space-y-2 flex flex-col justify-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">TCS Tax Rules (FY 2024-26)</span>
          <ul className="text-[11px] space-y-1 text-muted-foreground">
            <li>• Education via loan: <strong className="text-foreground">0.5%</strong> (&gt; ₹7L)</li>
            <li>• Education/Medical (self): <strong className="text-foreground">5%</strong> (&gt; ₹7L)</li>
            <li>• Travel, Investment, Others: <strong className="text-foreground">20%</strong></li>
          </ul>
        </Card>
      </div>

      {/* New Remittance Form Drawer / Card */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-card/90 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-accent" />
              <span>Record Outward Remittance & Generate Form A2</span>
            </h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="Remitter Name *"
                value={remitterName}
                onChange={(e) => setRemitterName(e.target.value)}
                placeholder="John Doe"
                required
              />
              <Input
                label="Remitter PAN *"
                value={remitterPan}
                onChange={(e) => setRemitterPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="Beneficiary Name *"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Acme Overseas Corp"
                required
              />
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Beneficiary Country *</label>
                <select
                  value={beneficiaryCountry}
                  onChange={(e) => setBeneficiaryCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="AU">Australia (AU)</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Purpose Code (RBI) *</label>
                <select
                  value={purposeCode}
                  onChange={(e) => setPurposeCode(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  {purposeCodes.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.description.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Amount (Foreign) *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={amountForeign}
                    onChange={(e) => setAmountForeign(e.target.value)}
                    placeholder="5000"
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

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">TCS Category</label>
                <select
                  value={tcsCategory}
                  onChange={(e) => setTcsCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="other">Foreign Travel / Investment — 20%</option>
                  <option value="education_self">Education / Medical (Self) — 5%</option>
                  <option value="education_loan">Education (Bank Loan) — 0.5%</option>
                  <option value="gift">Gift / Maintenance — 20%</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs text-muted-foreground">
                Exchange Rate: <strong className="font-mono text-foreground">1 {currency} = ₹{exchangeRate}</strong>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Create Remittance & Form A2'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Success Notification with Form A2 Download CTA */}
      {createdId && (
        <Card padding="md" className="border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Outward Remittance Successfully Logged</p>
              <p className="text-xs text-muted-foreground">Official Form A2 PDF document has been prepared for bank submission.</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleDownloadFormA2(createdId, 'LRS')}
            disabled={downloadingId === createdId}
            className="gap-1.5 text-xs shadow-sm bg-accent text-white"
          >
            <Download className="size-3.5" />
            <span>{downloadingId === createdId ? 'Downloading...' : 'Download Form A2 PDF'}</span>
          </Button>
        </Card>
      )}


      {/* Remittances Table */}
      <Card padding="md" className="space-y-3">
        <h2 className="text-sm font-bold">Remittance History</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border text-left">
                <th className="pb-3 font-semibold">Remitter</th>
                <th className="pb-3 font-semibold">Beneficiary</th>
                <th className="pb-3 font-semibold">Purpose</th>
                <th className="pb-3 font-semibold text-right">Amount (FCY)</th>
                <th className="pb-3 font-semibold text-right">Amount (INR)</th>
                <th className="pb-3 font-semibold text-right">TCS</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {remittances.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3">
                    <p className="font-semibold text-foreground">{r.remitterName}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">PAN: {r.remitterPan}</p>
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-foreground">{r.beneficiaryName}</p>
                    <span className="text-[10px] text-muted-foreground">{r.beneficiaryCountry}</span>
                  </td>
                  <td className="py-3 font-mono font-medium text-muted-foreground">{r.purposeCode}</td>
                  <td className="py-3 text-right font-mono font-bold text-foreground">
                    {r.currency} {Number(r.amountForeign).toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono">
                    ₹{Number(r.amountInr).toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono text-amber-400">
                    ₹{Number(r.tcsAmount).toLocaleString()} ({r.tcsPercentage}%)
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={downloadingId === r.id}
                      onClick={() => handleDownloadFormA2(r.id, r.remitterPan)}
                      className="h-7 px-2 text-[11px] gap-1"
                    >
                      <Download className="size-3" />
                      <span>{downloadingId === r.id ? 'PDF...' : 'Form A2'}</span>
                    </Button>
                  </td>
                </tr>
              ))}

              {remittances.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <FileText className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No remittances registered yet</p>
                    <p className="text-xs mt-0.5">Click "New Remittance" to log transactions and generate Form A2.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
}