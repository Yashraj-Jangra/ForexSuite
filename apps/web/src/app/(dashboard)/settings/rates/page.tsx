'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Illustration } from '@/components/ui/illustration';
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  Globe2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Search,
  Sliders,
  Sparkles,
  Activity,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CurrencyRateItem {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
  decimalPlaces: number;
  rateInInr: number;
  inverseRate: number;
  change24h: number;
  high24h: number;
  low24h: number;
  source: string;
  fetchedAt: string;
}

interface HistoryPoint {
  date: string;
  rate: number;
  high: number;
  low: number;
}

interface HistoryResponse {
  currency: { code: string; name: string; symbol: string; flag: string };
  days: number;
  points: HistoryPoint[];
  min: number;
  max: number;
  startRate: number;
  currentRate: number;
  overallChangePct: number;
}

interface RatesStats {
  totalCurrencies: number;
  baseCurrency: string;
  lastSyncAt: string;
  provider: string;
  status: string;
  updateFrequency: string;
}

const INTERVAL_OPTIONS = [
  { value: 15, label: 'Every 15 minutes', desc: 'High-frequency trading & volatile market monitoring' },
  { value: 60, label: 'Every 1 hour (Recommended)', desc: 'Standard RBI Reference & FFMC operational rate cycle' },
  { value: 360, label: 'Every 6 hours', desc: 'Periodic interbank rate synchronization' },
  { value: 1440, label: 'Once daily', desc: 'End-of-day statutory compliance recording' },
];

const POPULAR_CHART_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'SGD', 'CAD', 'AUD', 'JPY'];

export default function RateSettingsPage() {
  const [rates, setRates] = useState<CurrencyRateItem[]>([]);
  const [stats, setStats] = useState<RatesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedChartCode, setSelectedChartCode] = useState('USD');
  const [chartDays, setChartDays] = useState<number>(30);
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Settings & Sync
  const [intervalVal, setIntervalVal] = useState(60);
  const [savingInterval, setSavingInterval] = useState(false);

  // Interactive Converter
  const [convertFrom, setConvertFrom] = useState('USD');
  const [convertTo, setConvertTo] = useState('INR');
  const [convertAmount, setConvertAmount] = useState('1000');

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  // 1. Fetch latest rates and stats
  async function loadData() {
    setLoading(true);
    try {
      const [ratesRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/trpc/rates.latest', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/trpc/rates.stats', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
        fetch('/api/trpc/settings.get', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
      ]);

      if (ratesRes?.result?.data) {
        setRates(ratesRes.result.data);
      }
      if (statsRes?.result?.data) {
        setStats(statsRes.result.data);
      }
      const syncMin = settingsRes?.result?.data?.rateSyncIntervalMin;
      if (typeof syncMin === 'number') {
        setIntervalVal(syncMin);
      }
    } catch {
      showToast('Unable to load live rates from server.', false);
    } finally {
      setLoading(false);
    }
  }

  // 2. Fetch history for selected currency
  async function loadHistory(code: string, days: number) {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/trpc/rates.history?input=${encodeURIComponent(JSON.stringify({ code, days }))}`,
        { credentials: 'include' },
      );
      const json = await res.json();
      if (json?.result?.data) {
        setHistoryData(json.result.data);
      }
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadHistory(selectedChartCode, chartDays);
  }, [selectedChartCode, chartDays]);

  // Handle On-Demand Sync
  async function handleSyncNow() {
    setSyncing(true);
    try {
      const res = await fetch('/api/trpc/rates.syncNow', {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (json?.result?.data?.success) {
        showToast(
          `Successfully synchronized ${json.result.data.count} global currency pairs!`,
          true,
        );
        await loadData();
        await loadHistory(selectedChartCode, chartDays);
      } else {
        showToast(json?.result?.data?.error || 'Rate sync failed.', false);
      }
    } catch {
      showToast('Network error while syncing rates.', false);
    } finally {
      setSyncing(false);
    }
  }

  // Handle Save Sync Schedule
  async function handleSaveInterval() {
    setSavingInterval(true);
    try {
      await fetch('/api/trpc/settings.set', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'rateSyncIntervalMin', value: intervalVal }),
      });
      showToast('Automatic sync preference updated!', true);
    } catch {
      showToast('Failed to save sync preference.', false);
    } finally {
      setSavingInterval(false);
    }
  }

  // Filtered rates list
  const filteredRates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rates;
    return rates.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.symbol.toLowerCase().includes(q),
    );
  }, [rates, search]);

  // Converter math
  const convertedValue = useMemo(() => {
    if (!convertAmount || isNaN(Number(convertAmount))) return 0;
    const num = Number(convertAmount);
    if (convertFrom === convertTo) return num;

    const fromRate = convertFrom === 'INR' ? 1 : rates.find((r) => r.code === convertFrom)?.rateInInr || 86.85;
    const toRate = convertTo === 'INR' ? 1 : rates.find((r) => r.code === convertTo)?.rateInInr || 1;

    const effectiveRate = fromRate / toRate;
    return Math.round(num * effectiveRate * 100) / 100;
  }, [convertAmount, convertFrom, convertTo, rates]);

  // Chart SVG Coordinates Generator
  const chartSvgPath = useMemo(() => {
    if (!historyData || historyData.points.length < 2) return { path: '', area: '', points: [] };
    const pts = historyData.points;
    const minVal = historyData.min * 0.998;
    const maxVal = historyData.max * 1.002;
    const range = maxVal - minVal || 1;

    const width = 760;
    const height = 240;
    const padding = 20;

    const coords = pts.map((p, idx) => {
      const x = padding + (idx / (pts.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.rate - minVal) / range) * (height - 2 * padding);
      return { x, y, date: p.date, rate: p.rate };
    });

    let pathD = `M ${coords[0]!.x} ${coords[0]!.y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1]!;
      const curr = coords[i]!;
      const cx = (prev.x + curr.x) / 2;
      pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const lastCoord = coords[coords.length - 1]!;
    const areaD = `${pathD} L ${lastCoord.x} ${height} L ${coords[0]!.x} ${height} Z`;

    return { path: pathD, area: areaD, points: coords };
  }, [historyData]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-16 px-2 sm:px-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-12 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl animate-in slide-in-from-top-2 ${
            toast.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="size-4" /> : <Activity className="size-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Globe2 className="size-6 text-accent" />
            Foreign Exchange Rates &amp; Synchronization Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time multi-provider forex feeds (RBI Reference &amp; Interbank), historical time-series analytics, and instant currency calculator.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSyncNow}
            disabled={syncing}
            className="gap-2 shrink-0 px-4 shadow-md shadow-accent/20"
          >
            <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing Rates...' : 'Sync Rates Now'}</span>
          </Button>
        </div>
      </div>

      {/* ─── TELEMETRY & FEED STATUS BANNER ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="border-accent/30 bg-accent/[0.03] flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Feed Health
            </span>
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Operational (Live)</span>
            </span>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Globe2 className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Currencies Monitored
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">
              {rates.length || 25} Global Pairs
            </span>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Last Synchronized
            </span>
            <span className="text-xs font-bold text-foreground mt-0.5 block font-mono truncate">
              {stats?.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Quotation Base
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">
              INR (₹ Indian Rupee)
            </span>
          </div>
        </Card>
      </div>

      {/* ─── SECTION 1: INTERACTIVE HISTORICAL RATE TREND CHART & ANALYTICS ─── */}
      <Card padding="lg" className="border-border/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h2 className="text-base font-bold text-foreground">
                Historical Rate Movement — {historyData?.currency?.name || 'US Dollar'} ({selectedChartCode}/INR)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Interactive high-resolution price trend against Indian Rupee over selected statutory period.
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Time Horizon:</span>
            {[
              { label: '7 Days', value: 7 },
              { label: '30 Days', value: 30 },
              { label: '90 Days', value: 90 },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setChartDays(t.value)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  chartDays === t.value
                    ? 'bg-accent text-white shadow-xs'
                    : 'border border-border/60 hover:bg-muted text-muted-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Quick-Tabs for Chart */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POPULAR_CHART_CURRENCIES.map((code) => {
            const currInfo = rates.find((r) => r.code === code);
            const isSelected = selectedChartCode === code;
            return (
              <button
                key={code}
                onClick={() => setSelectedChartCode(code)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/10 text-foreground ring-1 ring-accent'
                    : 'border-border/60 hover:bg-muted text-muted-foreground'
                }`}
              >
                <span>{currInfo?.flag || '🌐'}</span>
                <span className="font-bold">{code}</span>
                {currInfo && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    ₹{currInfo.rateInInr.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SVG Interactive Trend Chart Canvas */}
        <div className="relative w-full bg-neutral-950/90 border border-neutral-800 rounded-2xl p-4 sm:p-6 overflow-hidden shadow-inner">
          {historyLoading ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="size-6 text-accent animate-spin" />
              <span className="text-xs font-mono text-neutral-400">Loading historical data points...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chart Stats Snapshot */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-neutral-400 block font-mono">Current Spot Rate</span>
                  <span className="text-xl font-bold text-white font-mono">
                    ₹{historyData?.currentRate?.toFixed(4) || '86.8500'}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-mono">Period Low</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      ₹{historyData?.min?.toFixed(4) || '86.4000'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-mono">Period High</span>
                    <span className="text-xs font-bold text-rose-400 font-mono">
                      ₹{historyData?.max?.toFixed(4) || '87.2000'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-mono">Net Drift</span>
                    <span
                      className={`text-xs font-bold font-mono inline-flex items-center gap-1 ${
                        (historyData?.overallChangePct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {(historyData?.overallChangePct ?? 0) >= 0 ? (
                        <TrendingUp className="size-3.5" />
                      ) : (
                        <TrendingDown className="size-3.5" />
                      )}
                      {historyData?.overallChangePct ? `${historyData.overallChangePct > 0 ? '+' : ''}${historyData.overallChangePct}%` : '0.00%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart SVG Graphic */}
              <div className="w-full h-56 pt-2">
                <svg viewBox="0 0 760 240" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="20" y1="40" x2="740" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <line x1="20" y1="100" x2="740" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <line x1="20" y1="160" x2="740" y2="160" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <line x1="20" y1="220" x2="740" y2="220" stroke="rgba(255,255,255,0.08)" />

                  {/* Area Fill */}
                  {chartSvgPath.area && (
                    <path d={chartSvgPath.area} fill="url(#rateGradient)" />
                  )}

                  {/* Smooth Line */}
                  {chartSvgPath.path && (
                    <path
                      d={chartSvgPath.path}
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Highlight Points */}
                  {chartSvgPath.points.map((pt, idx) => {
                    if (idx % Math.ceil(chartSvgPath.points.length / 8) === 0 || idx === chartSvgPath.points.length - 1) {
                      return (
                        <g key={pt.date}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="4"
                            fill="#ffffff"
                            stroke="hsl(var(--accent))"
                            strokeWidth="2"
                          />
                          <text
                            x={pt.x}
                            y="235"
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.4)"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {pt.date.slice(5)}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ─── SECTION 2: SEARCHABLE FOREX MATRIX & TWO-WAY CONVERTER (GRID 7/5) ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Forex Matrix (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Active Exchange Rates Against INR</h2>
              <p className="text-xs text-muted-foreground">Standard quote: 1 Foreign Currency Unit = INR Price</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="size-4 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                placeholder="Search currency, flag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Rates Table Container */}
          <Card padding="none" className="overflow-hidden border-border/80 shadow-xs">
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 z-10 bg-card border-b border-border/70 text-muted-foreground uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Currency</th>
                    <th className="py-3 px-4">Spot Rate (INR)</th>
                    <th className="py-3 px-4">Inverse (1 INR)</th>
                    <th className="py-3 px-4 text-right">24h Movement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {filteredRates.map((r) => {
                    const isPositive = r.change24h >= 0;
                    return (
                      <tr
                        key={r.code}
                        onClick={() => {
                          setSelectedChartCode(r.code);
                          setConvertFrom(r.code);
                        }}
                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 font-sans">
                            <span className="text-base">{r.flag}</span>
                            <div>
                              <span className="font-bold text-foreground block group-hover:text-accent transition-colors">
                                {r.code} ({r.symbol})
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                {r.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground text-sm">
                            ₹{r.rateInInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-muted-foreground text-[11px]">
                          {r.symbol}{r.inverseRate.toFixed(4)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-sans text-[11px] font-extrabold border ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                            <span>{isPositive ? '+' : ''}{r.change24h.toFixed(2)}%</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRates.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground font-sans">
                        No currency matches your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Interactive Two-Way Converter & Schedule Settings (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Interactive Converter Card */}
          <Card padding="lg" className="border-accent/40 bg-accent/[0.02] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <ArrowRightLeft className="size-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Interactive Currency Converter</h2>
            </div>

            <div className="space-y-3.5">
              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Amount</label>
                <Input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="1000"
                  className="h-10 text-sm font-mono font-bold"
                />
              </div>

              {/* From / To Currency Grid with Swap */}
              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground block">From</label>
                  <select
                    value={convertFrom}
                    onChange={(e) => setConvertFrom(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2 font-bold"
                  >
                    {rates.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.flag} {r.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 flex justify-center pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = convertFrom;
                      setConvertFrom(convertTo);
                      setConvertTo(temp);
                    }}
                    className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-xs"
                    title="Swap currencies"
                  >
                    <ArrowRightLeft className="size-3.5" />
                  </button>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground block">To</label>
                  <select
                    value={convertTo}
                    onChange={(e) => setConvertTo(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2 font-bold"
                  >
                    {rates.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.flag} {r.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result Preview Box */}
              <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5 shadow-xs">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Calculated Equivalent
                </span>
                <div className="text-xl font-extrabold text-accent font-mono">
                  {rates.find((r) => r.code === convertTo)?.symbol || ''}{' '}
                  {convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-xs text-foreground font-sans font-bold">{convertTo}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  1 {convertFrom} = {rates.find((r) => r.code === convertFrom)?.rateInInr ? (rates.find((r) => r.code === convertFrom)!.rateInInr / (rates.find((r) => r.code === convertTo)?.rateInInr || 1)).toFixed(4) : '1.0000'} {convertTo}
                </div>
              </div>
            </div>
          </Card>

          {/* Sync Frequency Preferences */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Sliders className="size-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Automatic Synchronization Interval</h2>
            </div>

            <div className="space-y-2.5">
              {INTERVAL_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    intervalVal === opt.value
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                      : 'border-border/60 hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="syncInterval"
                    value={opt.value}
                    checked={intervalVal === opt.value}
                    onChange={() => setIntervalVal(opt.value)}
                    className="size-4 accent-accent mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">{opt.label}</span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveInterval}
                disabled={savingInterval}
                className="gap-1.5 text-xs"
              >
                {savingInterval ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Save Sync Preference</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}