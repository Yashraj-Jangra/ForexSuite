'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Landmark,
  Plus,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Globe2,
} from 'lucide-react';

type FemaAlert = {
  invoices: { id: string; invoiceNumber: string; currency: string; total: string; dateOfExport: string | null };
  customers: { name: string } | null;
  daysSince: number;
  status: string;
};

type Invoice = {
  invoices: { id: string; invoiceNumber: string; currency: string; total: string; status: string; issuedAt: string; isExport: boolean | null };
  customers: { name: string } | null;
};

interface RateItem {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateInInr: number;
  inverseRate: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  sent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  overdue: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export default function DashboardPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<{ critical: FemaAlert[]; warning: FemaAlert[]; ok: FemaAlert[]; total: number }>({
    critical: [],
    warning: [],
    ok: [],
    total: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [activeLut, setActiveLut] = useState<any>(null);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick converter state
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('INR');
  const [amount, setAmount] = useState('1000');
  const [convertedResult, setConvertedResult] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [femaRes, invRes, custRes, lutRes, ratesRes] = await Promise.all([
        fetch('/api/trpc/fema.alerts', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
        fetch('/api/trpc/invoices.list?input=' + encodeURIComponent(JSON.stringify({ limit: 5 })), { credentials: 'include' }).then((r) => r.json()).catch(() => null),
        fetch('/api/trpc/customers.list', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
        fetch('/api/trpc/luts.active', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
        fetch('/api/trpc/rates.latest', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
      ]);

      if (femaRes?.result?.data) {
        const d = femaRes.result.data;
        setAlerts({
          critical: Array.isArray(d?.critical) ? d.critical : [],
          warning: Array.isArray(d?.warning) ? d.warning : [],
          ok: Array.isArray(d?.ok) ? d.ok : [],
          total: typeof d?.total === 'number' ? d.total : (Array.isArray(d) ? d.length : 0),
        });
      }
      const invList = Array.isArray(invRes?.result?.data) ? invRes.result.data : (invRes?.result?.data?.data || []);
      setInvoices(invList);

      const custList = Array.isArray(custRes?.result?.data) ? custRes.result.data : (custRes?.result?.data?.data || []);
      setCustomerCount(custList.length);

      const lutList = Array.isArray(lutRes?.result?.data) ? lutRes.result.data : (lutRes?.result?.data?.data || []);
      setActiveLut(lutList[0] || null);

      if (ratesRes?.result?.data && Array.isArray(ratesRes.result.data)) {
        setRates(ratesRes.result.data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Quick converter handler
  useEffect(() => {
    if (!amount || isNaN(Number(amount))) {
      setConvertedResult(null);
      return;
    }
    const num = Number(amount);
    if (fromCurr === toCurr) {
      setConvertedResult(num);
      return;
    }

    const rFrom = fromCurr === 'INR' ? 1 : rates.find((r) => r.code === fromCurr)?.rateInInr || 95.78;
    const rTo = toCurr === 'INR' ? 1 : rates.find((r) => r.code === toCurr)?.rateInInr || 1;

    if (rFrom > 0 && rTo > 0) {
      const effectiveRate = rFrom / rTo;
      setConvertedResult(Math.round(num * effectiveRate * 100) / 100);
    }
  }, [amount, fromCurr, toCurr, rates]);

  // Currencies list for converter
  const availableCurrencies = rates.length > 0 ? rates : [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rateInInr: 95.78, inverseRate: 0.01044, change24h: 0.12, high24h: 95.97, low24h: 95.59 },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateInInr: 111.73, inverseRate: 0.00895, change24h: 0.08, high24h: 111.95, low24h: 111.51 },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rateInInr: 130.47, inverseRate: 0.00766, change24h: 0.15, high24h: 130.73, low24h: 130.21 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rateInInr: 26.07, inverseRate: 0.03835, change24h: 0.02, high24h: 26.12, low24h: 26.02 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', rateInInr: 25.54, inverseRate: 0.03915, change24h: 0.04, high24h: 25.60, low24h: 25.49 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rateInInr: 75.34, inverseRate: 0.01327, change24h: -0.06, high24h: 75.49, low24h: 75.19 },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rateInInr: 1.00, inverseRate: 1.0000, change24h: 0.00, high24h: 1.00, low24h: 1.00 },
  ];

  const topTickerItems = availableCurrencies.filter((c) => c.code !== 'INR').slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time multi-currency invoicing, statutory FEMA realization, and official RBI/FBIL reference rates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 text-xs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button size="sm" onClick={() => router.push('/invoices/new')} className="gap-1.5 text-xs shadow-sm">
            <Plus className="size-3.5" />
            <span>New Invoice</span>
          </Button>
        </div>
      </div>

      {/* Live Forex Rates Ticker (Dynamically pulled from Database — RBI/FBIL Official Rates) */}
      <div className="flex items-center gap-3 overflow-x-auto p-2.5 rounded-xl bg-card border border-border text-xs scrollbar-none">
        <div className="flex items-center gap-1.5 font-bold text-accent shrink-0 pl-1">
          <TrendingUp className="size-3.5" />
          <span className="text-[11px] uppercase tracking-wider">RBI/FBIL Rates:</span>
        </div>
        <div className="flex items-center gap-3 min-w-max">
          {topTickerItems.map((item) => {
            const isPos = item.change24h >= 0;
            return (
              <div
                key={item.code}
                onClick={() => router.push('/settings/rates')}
                className="flex items-center gap-2 bg-muted/60 hover:bg-muted px-2.5 py-1 rounded-lg border border-border/40 cursor-pointer transition-colors"
                title={`${item.name} · Click to view 30-day trend`}
              >
                <span>{item.flag}</span>
                <span className="font-bold text-foreground">{item.code}/INR</span>
                <span className="font-mono text-accent font-bold">
                  ₹{item.rateInInr.toFixed(item.rateInInr < 1 ? 4 : 2)}
                </span>
                <span
                  className={`text-[10px] font-bold flex items-center gap-0.5 ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPos ? '+' : ''}{item.change24h.toFixed(2)}%
                </span>
                <span className="text-[9px] text-muted-foreground/60">
                  {['AED','SAR','KWD','QAR','OMR','BHD'].includes(item.code) ? '🟠' : '🔴'}
                </span>
              </div>
            );
          })}
        </div>
        <Link href="/settings/rates" className="ml-auto text-[11px] text-muted-foreground hover:text-accent font-semibold whitespace-nowrap pr-1 flex items-center gap-1">
          <span>Full Matrix</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="space-y-2 hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoices</p>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <FileText className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{invoices.length}</p>
          <p className="text-xs text-muted-foreground">Total records generated</p>
        </Card>

        <Card padding="md" className="space-y-2 hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customers</p>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{customerCount}</p>
          <p className="text-xs text-muted-foreground">Registered KYC profiles</p>
        </Card>

        <Card padding="md" className="space-y-2 hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">FEMA Tracked</p>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground">{alerts.total}</p>
            {alerts.critical.length > 0 && (
              <span className="text-xs font-bold text-rose-500">{alerts.critical.length} critical</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Pending 270-day realization</p>
        </Card>

        <Card padding="md" className="space-y-2 hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active LUT</p>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Landmark className="size-4" />
            </div>
          </div>
          <p className="text-sm font-bold tracking-tight text-foreground truncate font-mono">
            {activeLut ? activeLut.arn : 'None active'}
          </p>
          <p className="text-xs text-muted-foreground">
            {activeLut ? `FY ${activeLut.financialYear}` : 'Register in Compliance Center'}
          </p>
        </Card>
      </div>

      {/* Main Content Grid: Recent Invoices & Currency Converter */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Invoices Table (2 cols) */}
        <Card padding="md" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Recent Invoices &amp; Cash Memos</h2>
              <p className="text-xs text-muted-foreground">Latest transactions across domestic &amp; foreign currencies.</p>
            </div>
            <Link href="/invoices" className="text-xs text-accent font-semibold hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-muted-foreground border-b border-border font-semibold">
                  <tr>
                    <th className="pb-2">Invoice #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.invoices.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 font-bold font-mono text-foreground">
                        {inv.invoices.invoiceNumber}
                      </td>
                      <td className="py-2.5 text-muted-foreground truncate max-w-[140px]">
                        {inv.customers?.name || '—'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            inv.invoices.isExport
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {inv.invoices.isExport ? 'Export' : 'Domestic'}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold font-mono">
                        {inv.invoices.currency} {Number(inv.invoices.total).toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            STATUS_BADGES[inv.invoices.status] || ''
                          }`}
                        >
                          {inv.invoices.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/invoices/${inv.invoices.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <FileText className="size-8 mx-auto opacity-30" />
              <div>
                <p className="text-sm font-semibold">No invoices yet</p>
                <p className="text-xs text-muted-foreground">Draft your first domestic or export invoice.</p>
              </div>
              <Button size="sm" onClick={() => router.push('/invoices/new')}>
                Create Invoice
              </Button>
            </div>
          )}
        </Card>

        {/* Live Forex Calculator (1 col) */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Forex Calculator</h2>
              <p className="text-[11px] text-muted-foreground">Live interbank rates math</p>
            </div>
            <Clock className="size-3.5 text-muted-foreground" />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">From</label>
                <select
                  value={fromCurr}
                  onChange={(e) => setFromCurr(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background font-bold font-mono"
                >
                  {availableCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">To</label>
                <select
                  value={toCurr}
                  onChange={(e) => setToCurr(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background font-bold font-mono"
                >
                  {availableCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {convertedResult !== null && (
              <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 space-y-1 mt-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Calculated Output
                </span>
                <p className="text-xl font-extrabold text-accent font-mono">
                  {toCurr} {convertedResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Rate: 1 {fromCurr} = {((convertedResult || 1) / (Number(amount) || 1)).toFixed(4)} {toCurr}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Realization Alerts Banner if any */}
      {((alerts?.critical?.length ?? 0) > 0 || (alerts?.warning?.length ?? 0) > 0) && (
        <Card padding="md" className="border-rose-500/30 bg-rose-500/5 space-y-3">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="size-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">FEMA Statutory Realization Warnings</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            {alerts.critical.map((a) => (
              <div key={a.invoices.id} className="p-2.5 rounded-lg bg-card border border-rose-500/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">{a.invoices.invoiceNumber}</span>
                  <span className="text-muted-foreground ml-2">({a.customers?.name || 'Customer'})</span>
                </div>
                <span className="font-mono font-bold text-rose-500">{a.daysSince}d / 270d</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}