'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';

type Remittance = { id: string; remitterName: string; remitterPan: string; beneficiaryName: string; beneficiaryCountry: string; amountForeign: string; currency: string; amountInr: string; tcsAmount: string; purposeCode: string; status: string; createdAt: string };
type PurposeCode = { code: string; category: string; description: string };

export default function LrsPage() {
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [purposeCodes, setPurposeCodes] = useState<PurposeCode[]>([]);
  const [cumulative, setCumulative] = useState<{ pan: string; total: number; limit: number; remaining: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [panQuery, setPanQuery] = useState('');

  const [remitterName, setRemitterName] = useState('');
  const [remitterPan, setRemitterPan] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryCountry, setBeneficiaryCountry] = useState('US');
  const [purposeCode, setPurposeCode] = useState('');
  const [amountForeign, setAmountForeign] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('');
  const [tcsCategory, setTcsCategory] = useState('other');
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function load() {
    try {
      const [r, pc] = await Promise.all([
        fetch('/api/trpc/remittances.list', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/trpc/remittances.purposeCodes', { credentials: 'include' }).then((r) => r.json()),
      ]);
      setRemittances(r?.result?.data?.data || []);
      setPurposeCodes(pc?.result?.data?.data || []);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, []);

  async function checkCumulative() {
    if (!panQuery) return;
    const res = await fetch(`/api/trpc/remittances.cumulative?input=${encodeURIComponent(JSON.stringify(panQuery))}`, { credentials: 'include' });
    const json = await res.json();
    setCumulative(json?.result?.data?.data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/trpc/remittances.create', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remitterName, remitterPan, beneficiaryName, beneficiaryCountry,
        purposeCode, amountForeign: Number(amountForeign), currency,
        exchangeRate: Number(exchangeRate), tcsCategory,
      }),
    });
    const json = await res.json();
    const data = json?.result?.data;
    setCreatedId(data?.id ?? 'created');
    setShowForm(false);
    setRemitterName(''); setRemitterPan(''); setBeneficiaryName(''); setBeneficiaryCountry('US');
    setPurposeCode(''); setAmountForeign(''); setCurrency('USD'); setExchangeRate(''); setTcsCategory('other');
    load();
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">LRS / Form A2</h1>
          <p className="text-sm text-muted-foreground">Outward remittances and Form A2 generation</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>New remittance</Button>
      </div>

      {showForm && (
        <Card padding="md" className="mb-6 max-w-lg space-y-4">
          <h3 className="font-medium">New outward remittance</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Remitter name" value={remitterName} onChange={(e) => setRemitterName(e.target.value)} required />
              <Input label="PAN" value={remitterPan} onChange={(e) => setRemitterPan(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Beneficiary name" value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} required />
              <Input label="Country" value={beneficiaryCountry} onChange={(e) => setBeneficiaryCountry(e.target.value)} required />
            </div>
            <select value={purposeCode} onChange={(e) => setPurposeCode(e.target.value)} required className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">
              <option value="">Select purpose...</option>
              {purposeCodes.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.description}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Amount" type="number" value={amountForeign} onChange={(e) => setAmountForeign(e.target.value)} required />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-10 mt-6 px-3 rounded-lg border border-input bg-background text-sm">
                <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option>
              </select>
              <Input label="Rate" type="number" step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} required />
            </div>
            <select value={tcsCategory} onChange={(e) => setTcsCategory(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">
              <option value="education_loan">Education (via loan) — 0.5%</option>
              <option value="education_self">Education/Medical (self) — 5%</option>
              <option value="medical">Medical treatment — 5%</option>
              <option value="investment">Investment — 20%</option>
              <option value="travel">Foreign travel — 20%</option>
              <option value="gift">Gift/Donation — 20%</option>
              <option value="other">Other — 20%</option>
            </select>
            <Button type="submit" size="sm">Create remittance</Button>
          </form>
        </Card>
      )}

      {createdId && (
        <Card padding="md" className="mb-6 max-w-lg">
          <p className="text-sm text-green-400">Remittance created successfully.</p>
          <p className="text-sm text-muted-foreground mt-1">Coming soon — Download Form A2 PDF.</p>
          {/* TODO: Wire Form A2 generation — call GET /api/trpc/remittances.formA2?id=<createdId> and download PDF */}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Check PAN limit</p>
          <div className="flex gap-2 mt-2">
            <input value={panQuery} onChange={(e) => setPanQuery(e.target.value)} placeholder="Enter PAN" className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm" />
            <Button size="sm" variant="outline" onClick={checkCumulative}>Check</Button>
          </div>
          {cumulative && (
            <div className="mt-3 text-sm space-y-1">
              <p>Used: <strong>${cumulative.total.toLocaleString()}</strong></p>
              <p>Limit: <strong>${cumulative.limit.toLocaleString()}</strong></p>
              <p className={cumulative.remaining < 50000 ? 'text-red-400' : 'text-green-400'}>Remaining: ${cumulative.remaining.toLocaleString()}</p>
            </div>
          )}
        </Card>
      </div>

      <Card padding="md">
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground border-b border-border">
            <th className="text-left pb-3 font-medium">Remitter</th>
            <th className="text-left pb-3 font-medium">Beneficiary</th>
            <th className="text-right pb-3 font-medium">Amount</th>
            <th className="text-right pb-3 font-medium">TCS</th>
            <th className="text-left pb-3 font-medium">Status</th>
            <th className="text-left pb-3 font-medium">Date</th>
          </tr></thead>
          <tbody>
            {remittances.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-3"><p className="font-medium">{r.remitterName}</p><p className="text-xs text-muted-foreground">{r.remitterPan}</p></td>
                <td className="py-3">{r.beneficiaryName}<br /><span className="text-xs text-muted-foreground">{r.beneficiaryCountry}</span></td>
                <td className="py-3 text-right">{r.currency} {Number(r.amountForeign).toLocaleString()}</td>
                <td className="py-3 text-right">{Number(r.tcsAmount).toLocaleString()}</td>
                <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>{r.status}</span></td>
                <td className="py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {remittances.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No remittances yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </Container>
  );
}