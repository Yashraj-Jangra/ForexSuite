'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ListOrdered, RefreshCw, Download, CheckCircle2, AlertTriangle, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

type ForexTx = {
  id: string;
  transactionDate: string;
  currency: string;
  transactionType: 'purchase' | 'sale';
  category: string;
  amount: string;
  conversionRate: string | null;
  customerName: string | null;
  customerPassportKyc: string | null;
  transactionSlipNumber: string | null;
  createdAt: string;
};

type DailySummary = {
  date: string;
  currency: string;
  openingBalance: number;
  purchases: number;
  sales: number;
  closingBalance: number;
  balanced: boolean;
};

function groupByDateCurrency(txs: ForexTx[]): DailySummary[] {
  const map = new Map<string, { purchases: number; sales: number }>();
  for (const tx of txs) {
    const key = `${tx.transactionDate}::${tx.currency}`;
    const entry = map.get(key) ?? { purchases: 0, sales: 0 };
    if (tx.transactionType === 'purchase') entry.purchases += Number(tx.amount);
    else entry.sales += Number(tx.amount);
    map.set(key, entry);
  }
  return Array.from(map.entries()).map(([key, val]) => {
    const [date, currency] = key.split('::') as [string, string];
    const closingBalance = val.purchases - val.sales; // simplified (no opening carry-forward in UI demo)
    return {
      date,
      currency,
      openingBalance: 0,
      purchases: val.purchases,
      sales: val.sales,
      closingBalance,
      balanced: closingBalance >= 0,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export default function FlmRegistersPage() {
  const [transactions, setTransactions] = useState<ForexTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'flm1' | 'flm2' | 'flm3'>('flm1');
  const [filterType, setFilterType] = useState<'all' | 'purchase' | 'sale'>('all');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/forex.list', { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data;
      setTransactions(Array.isArray(data) ? data : (data?.data ?? []));
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.transactionType !== filterType) return false;
    if (filterCurrency && tx.currency !== filterCurrency.toUpperCase()) return false;
    if (filterDateFrom && tx.transactionDate < filterDateFrom) return false;
    if (filterDateTo && tx.transactionDate > filterDateTo) return false;
    return true;
  });

  const dailySummaries = groupByDateCurrency(filtered);
  const currencies = [...new Set(transactions.map((t) => t.currency))];

  const totalPurchases = filtered.filter((t) => t.transactionType === 'purchase').reduce((s, t) => s + Number(t.amount), 0);
  const totalSales = filtered.filter((t) => t.transactionType === 'sale').reduce((s, t) => s + Number(t.amount), 0);

  const TABS = [
    { id: 'flm1' as const, label: 'FLM-1 Daily Summary', desc: 'Opening / Closing balance per currency per day' },
    { id: 'flm2' as const, label: 'FLM-2 Purchase Register', desc: 'All purchase transactions with KYC' },
    { id: 'flm3' as const, label: 'FLM-3 Sale Register', desc: 'All sale transactions with KYC' },
  ];

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ListOrdered className="size-6 text-accent" />
              FLM Registers
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              FLM-1 (Daily Summary) · FLM-2 (Purchase Register) · FLM-3 (Sale Register) — RBI FFMC mandatory records
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5 text-xs">
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="size-3.5" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* RBI compliance notice */}
        <Card padding="md" className="border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
          <ListOrdered className="size-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">RBI FFMC Register Requirements</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              FFMCs must maintain <strong>FLM-1 to FLM-7</strong> registers daily and submit <strong>FLM-8</strong> monthly to RBI by the 10th.
              All foreign currency purchase and sale transactions must be recorded with full customer KYC (name, passport number).
              Records must be retained for <strong>5 years</strong> per FEMA.
            </p>
          </div>
        </Card>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="space-y-1">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="size-4 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transactions</p>
            </div>
            <p className="text-xl font-extrabold font-mono">{filtered.length}</p>
          </Card>
          <Card padding="sm" className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="size-4 text-blue-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Purchases</p>
            </div>
            <p className="text-xl font-extrabold font-mono text-blue-500">₹{totalPurchases.toLocaleString()}</p>
          </Card>
          <Card padding="sm" className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sales</p>
            </div>
            <p className="text-xl font-extrabold font-mono text-emerald-500">₹{totalSales.toLocaleString()}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'purchase' | 'sale')} className="h-8 px-2 rounded-lg border border-input bg-background text-xs">
            <option value="all">All Types</option>
            <option value="purchase">Purchases Only</option>
            <option value="sale">Sales Only</option>
          </select>
          <select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)} className="h-8 px-2 rounded-lg border border-input bg-background text-xs font-mono">
            <option value="">All Currencies</option>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-8 px-2 rounded-lg border border-input bg-background text-xs" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-8 px-2 rounded-lg border border-input bg-background text-xs" />
          {(filterType !== 'all' || filterCurrency || filterDateFrom || filterDateTo) && (
            <button onClick={() => { setFilterType('all'); setFilterCurrency(''); setFilterDateFrom(''); setFilterDateTo(''); }} className="text-xs text-accent hover:underline">Clear</button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FLM-1: Daily Summary */}
        {activeTab === 'flm1' && (
          <Card padding="md" className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">FLM-1 — Daily Opening / Closing Balance</h2>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : dailySummaries.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No transactions in selected period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border text-left">
                      <th className="pb-2.5 font-semibold">Date</th>
                      <th className="pb-2.5 font-semibold">Currency</th>
                      <th className="pb-2.5 font-semibold text-right">Opening</th>
                      <th className="pb-2.5 font-semibold text-right text-blue-500">+ Purchases</th>
                      <th className="pb-2.5 font-semibold text-right text-emerald-500">− Sales</th>
                      <th className="pb-2.5 font-semibold text-right">Closing</th>
                      <th className="pb-2.5 font-semibold text-center">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {dailySummaries.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="py-2.5 font-mono">{row.date}</td>
                        <td className="py-2.5 font-mono font-bold">{row.currency}</td>
                        <td className="py-2.5 font-mono text-right text-muted-foreground">{row.openingBalance.toFixed(2)}</td>
                        <td className="py-2.5 font-mono text-right text-blue-500">+{row.purchases.toFixed(2)}</td>
                        <td className="py-2.5 font-mono text-right text-emerald-500">−{row.sales.toFixed(2)}</td>
                        <td className="py-2.5 font-mono text-right font-bold">{row.closingBalance.toFixed(2)}</td>
                        <td className="py-2.5 text-center">
                          {row.balanced
                            ? <CheckCircle2 className="size-3.5 text-emerald-500 mx-auto" />
                            : <AlertTriangle className="size-3.5 text-rose-500 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* FLM-2 & FLM-3: Transaction Registers */}
        {(activeTab === 'flm2' || activeTab === 'flm3') && (
          <Card padding="md" className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">
              {activeTab === 'flm2' ? 'FLM-2 — Purchase Register' : 'FLM-3 — Sale Register'}
            </h2>
            {loading ? (
              <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border text-left">
                      <th className="pb-2.5 font-semibold">Slip #</th>
                      <th className="pb-2.5 font-semibold">Date</th>
                      <th className="pb-2.5 font-semibold">Currency</th>
                      <th className="pb-2.5 font-semibold">Category</th>
                      <th className="pb-2.5 font-semibold text-right">Amount</th>
                      <th className="pb-2.5 font-semibold text-right">Rate</th>
                      <th className="pb-2.5 font-semibold">Customer</th>
                      <th className="pb-2.5 font-semibold">Passport / KYC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filtered
                      .filter((t) => activeTab === 'flm2' ? t.transactionType === 'purchase' : t.transactionType === 'sale')
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-muted/30">
                          <td className="py-2.5 font-mono text-muted-foreground">{tx.transactionSlipNumber ?? '—'}</td>
                          <td className="py-2.5 font-mono">{tx.transactionDate}</td>
                          <td className="py-2.5 font-mono font-bold">{tx.currency}</td>
                          <td className="py-2.5 text-muted-foreground">{tx.category}</td>
                          <td className="py-2.5 font-mono font-bold text-right">{Number(tx.amount).toFixed(2)}</td>
                          <td className="py-2.5 font-mono text-right text-muted-foreground">
                            {tx.conversionRate ? Number(tx.conversionRate).toFixed(4) : '—'}
                          </td>
                          <td className="py-2.5">{tx.customerName ?? '—'}</td>
                          <td className="py-2.5 font-mono text-muted-foreground text-[10px]">{tx.customerPassportKyc ?? '—'}</td>
                        </tr>
                      ))}
                    {filtered.filter((t) => activeTab === 'flm2' ? t.transactionType === 'purchase' : t.transactionType === 'sale').length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No {activeTab === 'flm2' ? 'purchase' : 'sale'} transactions in selected period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </Container>
  );
}
