'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import {
  FileSpreadsheet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';

type Statement = {
  month: string;
  openingBalance: number;
  closingBalance: number;
  totalTransactions: number;
  purchases: {
    total: number;
    byCategory: { category: string; amount: number; count: number }[];
    transactions: any[];
  };
  sales: {
    total: number;
    byCategory: { category: string; amount: number; count: number }[];
    transactions: any[];
  };
  balanceEquation: {
    opening: number;
    purchases: number;
    sales: number;
    closing: number;
    isValid: boolean;
  };
};

export default function Flm8Page() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [txDate, setTxDate] = useState(now.toISOString().split('T')[0] || '');
  const [txCurrency, setTxCurrency] = useState('USD');
  const [txType, setTxType] = useState<'purchase' | 'sale'>('purchase');
  const [txCategory, setTxCategory] = useState('public');
  const [txAmount, setTxAmount] = useState('');
  const [txCustomer, setTxCustomer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadStatement() {
    try {
      const res = await fetch(`/api/trpc/forex.statement?input=${encodeURIComponent(JSON.stringify({ year, month }))}`, {
        credentials: 'include',
      });
      const json = await res.json();
      const stmt = json?.result?.data?.openingBalance !== undefined ? json.result.data : json?.result?.data?.data;
      setStatement(stmt || null);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadStatement();
  }, [year, month]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/trpc/forex.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionDate: txDate,
          currency: txCurrency,
          transactionType: txType,
          category: txCategory,
          amount: Number(txAmount),
          customerName: txCustomer || undefined,
        }),
      });
      if (res.ok) {
        setTxAmount('');
        setTxCustomer('');
        setShowForm(false);
        await loadStatement();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/trpc/forex.exportExcel?input=${encodeURIComponent(JSON.stringify({ year, month }))}`, {
        credentials: 'include',
      });
      const json = await res.json();
      const fileData = json?.result?.data?.data ? json.result.data : json?.result?.data;
      if (fileData?.data) {
        const byteCharacters = atob(fileData.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.filename || `FLM8_${year}_${month}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setExporting(false);
  }


  const purchaseCats = txType === 'purchase' ? ['public', 'franchisee', 'ffmc_ad'] : ['btq', 'business', 'ffmc_ad'];

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">FLM-8 Monthly Statement</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            RBI Monthly Return of Foreign Currency Transactions and Stock Reconciliation for FFMC / AD-II entities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1.5 text-xs">
            <Plus className="size-3.5" />
            <span>Add Transaction</span>
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5 text-xs shadow-sm bg-green-600 hover:bg-green-700 text-white">
            <FileSpreadsheet className="size-3.5" />
            <span>{exporting ? 'Generating Excel...' : 'Export Excel (.xlsx)'}</span>
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card padding="sm" className="flex items-center gap-3">
        <Calendar className="size-4 text-accent ml-2" />
        <span className="text-xs font-semibold text-muted-foreground">Reporting Period:</span>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-8 px-2 rounded-lg border border-input bg-background text-xs font-medium"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-8 px-2 rounded-lg border border-input bg-background text-xs font-medium font-mono"
        >
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Card>

      {/* Transaction Modal */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-card/90 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Layers className="size-4 text-accent" />
              <span>Record Foreign Currency Purchase / Sale</span>
            </h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="Transaction Date *"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
              />
              <Input
                label="Customer / Entity Name (Optional)"
                value={txCustomer}
                onChange={(e) => setTxCustomer(e.target.value)}
                placeholder="Walk-in Traveler / Corporate"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Transaction Type *</label>
                <select
                  value={txType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setTxType(val);
                    setTxCategory(val === 'purchase' ? 'public' : 'btq');
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-semibold"
                >
                  <option value="purchase">Purchase (Inward)</option>
                  <option value="sale">Sale (Outward)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Currency *</label>
                <select
                  value={txCurrency}
                  onChange={(e) => setTxCurrency(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono font-bold"
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>AED</option>
                  <option>SGD</option>
                  <option>SAR</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Category (RBI Code) *</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm capitalize"
                >
                  {purchaseCats.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Amount (Foreign Currency) *</label>
              <input
                type="number"
                min={1}
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="2500"
                required
                className="w-full sm:w-1/2 h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Add Transaction'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Statement Visualizer */}
      {statement ? (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card padding="md">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Opening Balance</p>
              <p className="text-xl font-bold font-mono mt-1">${statement.openingBalance.toLocaleString()}</p>
            </Card>

            <Card padding="md" className="border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Purchases</p>
                <ArrowDownLeft className="size-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                +${statement.purchases.total.toLocaleString()}
              </p>
            </Card>

            <Card padding="md" className="border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">Sales</p>
                <ArrowUpRight className="size-4 text-rose-500" />
              </div>
              <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                -${statement.sales.total.toLocaleString()}
              </p>
            </Card>

            <Card padding="md">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Closing Balance</p>
              <p className="text-xl font-bold font-mono text-accent mt-1">${statement.closingBalance.toLocaleString()}</p>
            </Card>
          </div>

          {/* Balance Equation Pill */}
          <Card padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="size-5 text-accent shrink-0" />
              <div className="text-xs font-mono">
                <span className="text-muted-foreground">Equation: </span>
                <span>Opening ({statement.balanceEquation.opening})</span>
                <span className="text-emerald-600 dark:text-emerald-400"> + Purchases ({statement.balanceEquation.purchases})</span>
                <span className="text-rose-600 dark:text-rose-400"> - Sales ({statement.balanceEquation.sales})</span>
                <span> = </span>
                <strong className="text-foreground">{statement.balanceEquation.closing}</strong>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 shrink-0 ${
                statement.balanceEquation.isValid
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}
            >
              {statement.balanceEquation.isValid ? '✓ STATUTORY BALANCE VERIFIED' : '✗ BALANCE MISMATCH'}
            </span>
          </Card>

          {/* Category Breakdown */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Purchases by Category */}
            <Card padding="md" className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ArrowDownLeft className="size-4" />
                  <span>Purchases by Category ({statement.purchases.transactions.length})</span>
                </h3>
                <span className="font-mono text-xs font-bold text-foreground">
                  ${statement.purchases.total.toLocaleString()}
                </span>
              </div>


              <div className="space-y-2 text-xs">
                {statement.purchases.byCategory.map((c) => (
                  <div key={c.category} className="flex justify-between py-1.5 border-b border-border/40 last:border-0">
                    <span className="text-muted-foreground uppercase font-medium">{c.category.replace('_', ' ')}</span>
                    <span className="font-mono font-semibold text-foreground">
                      ${c.amount.toLocaleString()} ({c.count} txns)
                    </span>
                  </div>
                ))}

                {statement.purchases.byCategory.length === 0 && (
                  <p className="text-muted-foreground text-center py-6">No purchases logged this period</p>
                )}
              </div>
            </Card>

            {/* Sales by Category */}
            <Card padding="md" className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                  <ArrowUpRight className="size-4" />
                  <span>Sales by Category ({statement.sales.transactions.length})</span>
                </h3>
                <span className="font-mono text-xs font-bold text-foreground">
                  ${statement.sales.total.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {statement.sales.byCategory.map((c) => (
                  <div key={c.category} className="flex justify-between py-1.5 border-b border-border/40 last:border-0">
                    <span className="text-muted-foreground uppercase font-medium">{c.category.replace('_', ' ')}</span>
                    <span className="font-mono font-semibold text-foreground">
                      ${c.amount.toLocaleString()} ({c.count} txns)
                    </span>
                  </div>
                ))}

                {statement.sales.byCategory.length === 0 && (
                  <p className="text-muted-foreground text-center py-6">No sales logged this period</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card padding="lg" className="py-12 text-center text-muted-foreground space-y-2">
          <Calculator className="size-8 mx-auto animate-pulse" />
          <p className="text-sm font-semibold">Loading statement data...</p>
        </Card>
      )}
    </Container>
  );
}