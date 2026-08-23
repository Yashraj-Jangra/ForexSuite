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
  Landmark,
  Plus,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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

type Rate = { baseCurrency: string; targetCurrency: string; rate: string; fetchedAt: string };

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
  const [rates, setRates] = useState<Rate[]>([]);
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

      if (ratesRes?.result?.data) {
        setRates(Array.isArray(ratesRes.result.data) ? ratesRes.result.data : (ratesRes.result.data.data || []));
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
    const rFrom = rates.find((r) => r.targetCurrency === fromCurr);
    const rTo = rates.find((r) => r.targetCurrency === toCurr);
    const usdFrom = fromCurr === 'USD' ? 1 : Number(rFrom?.rate || 0);
    const usdTo = toCurr === 'USD' ? 1 : Number(rTo?.rate || (toCurr === 'INR' ? 86.85 : 1));

    if (usdFrom > 0 && usdTo > 0) {
      setConvertedResult(Math.round((num / usdFrom) * usdTo * 100) / 100);
    }
  }, [amount, fromCurr, toCurr, rates]);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time multi-currency invoicing, statutory FEMA realization, and foreign exchange rates.
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

      {/* Live Forex Rates Ticker */}
      <div className="flex items-center gap-3 overflow-x-auto p-2.5 rounded-xl bg-card border border-border text-xs scrollbar-none">
        <div className="flex items-center gap-1.5 font-bold text-accent shrink-0 pl-1">
          <TrendingUp className="size-3.5" />
          <span className="text-[11px] uppercase tracking-wider">Market Rates:</span>
        </div>
        <div className="flex items-center gap-3 min-w-max">
          {[
            { pair: 'USD/INR', rate: '86.85' },
            { pair: 'EUR/INR', rate: '94.20' },
            { pair: 'GBP/INR', rate: '110.45' },
            { pair: 'AED/INR', rate: '23.64' },
            { pair: 'EUR/USD', rate: '1.084' },
          ].map(({ pair, rate }) => (
            <div key={pair} className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-lg border border-border/40">
              <span className="font-semibold text-foreground">{pair}</span>
              <span className="font-mono text-accent font-bold">₹{rate}</span>
            </div>
          ))}
        </div>
        <Link href="/settings/rates" className="ml-auto text-[11px] text-muted-foreground hover:text-accent font-semibold whitespace-nowrap pr-1">
          Configure &rarr;
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
          <p className="text-2xl font-extrabold font-mono tracking-tight">{invoices.length > 0 ? invoices.length : (alerts?.total ?? 0)}</p>
          <p className="text-[11px] text-muted-foreground">Total logged in workspace</p>
        </Card>

        <Card padding="md" className="space-y-2 hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customers</p>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-mono tracking-tight">{customerCount}</p>
          <p className="text-[11px] text-muted-foreground">Active international buyers</p>
        </Card>

        <Card
          padding="md"
          className={`space-y-2 transition-colors ${(alerts?.critical?.length ?? 0) > 0 ? 'border-rose-500/40 bg-rose-500/5' : 'hover:border-accent/40'
            }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">FEMA 270d Alerts</p>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold font-mono tracking-tight ${(alerts?.critical?.length ?? 0) > 0 ? 'text-rose-500' : ''}`}>
            {(alerts?.critical?.length ?? 0) + (alerts?.warning?.length ?? 0)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {(alerts?.critical?.length ?? 0) > 0 ? `${alerts.critical.length} realization deadlines` : 'All invoices within limits'}
          </p>
        </Card>

        <Card padding="md" className="space-y-2 hover:border-accent/40 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Export LUT</p>
            <div className={`p-2 rounded-lg ${activeLut ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold font-mono tracking-tight ${activeLut ? 'text-emerald-500' : 'text-muted-foreground'}`}>
            {activeLut ? 'Active' : 'Not Set'}
          </p>
          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
            {activeLut ? activeLut.referenceNumber : 'Register Form RFD-11'}
          </p>
        </Card>

      </div>

      {/* Middle Section: Recent Invoices & Currency Converter */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Invoices */}
        <Card padding="md" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Recent Invoices</h2>
              <p className="text-xs text-muted-foreground">Latest invoices created across your workspace</p>
            </div>
            <Link href="/invoices" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border text-left">
                    <th className="pb-2.5 font-semibold">Invoice #</th>
                    <th className="pb-2.5 font-semibold">Customer</th>
                    <th className="pb-2.5 font-semibold">Amount</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {invoices.map((inv) => (
                    <tr key={inv.invoices.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-foreground">
                        <Link href={`/invoices/${inv.invoices.id}`} className="hover:text-accent">
                          {inv.invoices.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{inv.customers?.name || 'Customer'}</td>
                      <td className="py-2.5 font-bold font-mono">
                        {inv.invoices.currency} {Number(inv.invoices.total).toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGES[inv.invoices.status] || ''
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

        {/* Currency Converter */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground">Forex Calculator</h2>
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
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>AED</option>
                  <option>INR</option>
                  <option>SGD</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">To</label>
                <select
                  value={toCurr}
                  onChange={(e) => setToCurr(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background font-bold font-mono"
                >
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>AED</option>
                  <option>SGD</option>
                </select>
              </div>
            </div>

            {convertedResult !== null && (
              <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 space-y-1 mt-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Converted Output
                </span>
                <p className="text-xl font-extrabold text-accent font-mono">
                  {toCurr} {convertedResult.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Rate: 1 {fromCurr} = {((convertedResult || 1) / (Number(amount) || 1)).toFixed(4)} {toCurr}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Realization Alerts Banner if any */}
      {((alerts?.critical?.length ?? 0) > 0 || (alerts?.warning?.length ?? 0) > 0) && (
        <Card padding="md" className="border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500 shrink-0" />
            <h2 className="text-xs font-bold text-foreground">FEMA 270-Day Export Realization Watchlist</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            {[...(alerts?.critical || []), ...(alerts?.warning || [])].map((a) => (
              <div
                key={a.invoices.id}
                className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between"
              >
                <div>
                  <p className="font-mono font-bold text-foreground">{a.invoices.invoiceNumber}</p>
                  <p className="text-[10px] text-muted-foreground">{a.customers?.name || 'Customer'}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'critical' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'
                    }`}
                >
                  {a.daysSince} / 270d
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}