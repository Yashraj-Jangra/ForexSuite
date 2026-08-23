'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';

type Statement = {
  month: string; openingBalance: number; closingBalance: number; totalTransactions: number;
  purchases: { total: number; byCategory: { category: string; amount: number; count: number }[]; transactions: any[] };
  sales: { total: number; byCategory: { category: string; amount: number; count: number }[]; transactions: any[] };
  balanceEquation: { opening: number; purchases: number; sales: number; closing: number; isValid: boolean };
};

export default function Flm8Page() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [txDate, setTxDate] = useState(now.toISOString().split('T')[0]);
  const [txCurrency, setTxCurrency] = useState('USD');
  const [txType, setTxType] = useState<'purchase' | 'sale'>('purchase');
  const [txCategory, setTxCategory] = useState('public');
  const [txAmount, setTxAmount] = useState('');
  const [txCustomer, setTxCustomer] = useState('');

  async function loadStatement() {
    try {
      const res = await fetch(`/api/trpc/forex.statement?input=${encodeURIComponent(JSON.stringify({ year, month }))}`, { credentials: 'include' });
      const json = await res.json();
      setStatement(json?.result?.data?.data);
    } catch { /* ignore */ }
  }

  useEffect(() => { loadStatement(); }, [year, month]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/trpc/forex.create', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionDate: txDate, currency: txCurrency, transactionType: txType, category: txCategory, amount: Number(txAmount), customerName: txCustomer || undefined }),
    });
    setTxAmount(''); setTxCustomer(''); setShowForm(false);
    loadStatement();
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/trpc/forex.exportExcel?input=${encodeURIComponent(JSON.stringify({ year, month }))}`, { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data?.data;
      if (data?.data) {
        const blob = new Uint8Array(atob(data.data).split('').map((c) => c.charCodeAt(0)));
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const a = document.createElement('a'); a.href = url; a.download = data.filename; a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setExporting(false);
  }

  const purchaseCats = txType === 'purchase' ? ['public', 'franchisee', 'ffmc_ad'] : ['btq', 'business', 'ffmc_ad'];
  const allCats = ['btq', 'business', 'ffmc_ad', 'public', 'franchisee'];
  if (!allCats.includes(txCategory)) setTxCategory(purchaseCats[0] ?? 'public');

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">FLM-8 Monthly Statement</h1>
          <p className="text-sm text-muted-foreground">RBI monthly return for money changers</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>Add transaction</Button>
          <Button size="sm" onClick={handleExport} disabled={exporting}>{exporting ? 'Exporting...' : 'Export Excel'}</Button>
        </div>
      </div>

      <div className="flex gap-3 items-center mb-6">
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28 h-10 px-3 rounded-lg border border-input bg-background text-sm">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-32 h-10 px-3 rounded-lg border border-input bg-background text-sm">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>)}
        </select>
      </div>

      {showForm && (
        <Card padding="md" className="mb-6 max-w-lg space-y-3">
          <h3 className="font-medium">New forex transaction</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
              <Input label="Amount" type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <select value={txType} onChange={(e) => { setTxType(e.target.value as any); setTxCategory(e.target.value === 'purchase' ? 'public' : 'btq'); }} className="h-10 mt-6 px-3 rounded-lg border border-input bg-background text-sm">
                <option value="purchase">Purchase</option><option value="sale">Sale</option>
              </select>
              <select value={txCurrency} onChange={(e) => setTxCurrency(e.target.value)} className="h-10 mt-6 px-3 rounded-lg border border-input bg-background text-sm">
                <option>USD</option><option>EUR</option><option>GBP</option><option>AED</option><option>SAR</option><option>INR</option>
              </select>
              <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="h-10 mt-6 px-3 rounded-lg border border-input bg-background text-sm">
                {purchaseCats.map((c) => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <Input label="Customer name (optional)" value={txCustomer} onChange={(e) => setTxCustomer(e.target.value)} />
            <Button type="submit" size="sm">Add transaction</Button>
          </form>
        </Card>
      )}

      {statement && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card padding="md"><p className="text-sm text-muted-foreground">Opening</p><p className="text-xl font-bold">{statement.openingBalance}</p></Card>
            <Card padding="md" className="border-green-400/20"><p className="text-sm text-muted-foreground">Purchases</p><p className="text-xl font-bold text-green-400">{statement.purchases.total.toLocaleString()}</p></Card>
            <Card padding="md" className="border-red-400/20"><p className="text-sm text-muted-foreground">Sales</p><p className="text-xl font-bold text-red-400">{statement.sales.total.toLocaleString()}</p></Card>
            <Card padding="md"><p className="text-sm text-muted-foreground">Closing</p><p className="text-xl font-bold">{statement.closingBalance.toLocaleString()}</p></Card>
          </div>

          <Card padding="md">
            <h3 className="font-medium mb-2">Balance Equation</h3>
            <p className="text-sm font-mono">
              Opening ({statement.balanceEquation.opening}) + Purchases ({statement.balanceEquation.purchases}) - Sales ({statement.balanceEquation.sales})
              <span className="mx-2">=</span>
              <strong>{statement.balanceEquation.closing}</strong>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${statement.balanceEquation.isValid ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                {statement.balanceEquation.isValid ? '✓ Balanced' : '✗ Mismatch'}
              </span>
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card padding="md">
              <h3 className="font-medium mb-3 text-green-400">Purchases ({statement.purchases.transactions.length})</h3>
              {statement.purchases.byCategory.map((c) => (
                <div key={c.category} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{c.category.replace('_', ' ')}</span>
                  <span>{c.amount.toLocaleString()} ({c.count})</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-border">{statement.purchases.total.toLocaleString()}</div>
            </Card>
            <Card padding="md">
              <h3 className="font-medium mb-3 text-red-400">Sales ({statement.sales.transactions.length})</h3>
              {statement.sales.byCategory.map((c) => (
                <div key={c.category} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{c.category.replace('_', ' ')}</span>
                  <span>{c.amount.toLocaleString()} ({c.count})</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-border">{statement.sales.total.toLocaleString()}</div>
            </Card>
          </div>
        </div>
      )}

      {!statement && <p className="text-muted-foreground text-center py-10">Loading...</p>}
    </Container>
  );
}