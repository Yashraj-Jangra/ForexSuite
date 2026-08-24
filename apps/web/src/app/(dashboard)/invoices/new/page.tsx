'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import {
  ArrowLeft, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Info,
  Building2, FileText, Banknote, ScrollText, Users, Globe, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'cash_memo' | 'export_invoice';

type Customer = {
  id: string; name: string; country: string; email?: string | null; phone?: string | null;
  address?: string | null; city?: string | null; state?: string | null; pincode?: string | null;
  gstin?: string | null; pan?: string | null;
  passportNumber?: string | null; nationality?: string | null; gender?: string | null;
  defaultPurpose?: string | null; placeOfSupply?: string | null; defaultDestinationCountry?: string | null;
};

type BusinessProfile = {
  companyName: string; address1?: string; address2?: string; city?: string; state?: string;
  stateCode?: string; pincode?: string; phone?: string; rbiLicenceNo?: string; cin?: string;
  pan?: string; gstin?: string; logoBase64?: string;
  defaultSacCode?: string; defaultCgstRate?: number; defaultSgstRate?: number;
  defaultIgstRate?: number; defaultGstTaxableBasePct?: number;
  disclaimer1?: string; disclaimer2?: string;
};

interface ForexLine {
  currencyCode: string;
  currencyName: string;
  sacCode: string;
  amountForeign: string;
  exchangeRate: string;
  amountInr: number;
  rateSource?: string; // 'FBIL' | 'FEDAI' | 'ECB' | undefined (manual)
};

type ExportLine = { description: string; hsnCode: string; gstRate: number; quantity: number; unitPrice: number; };

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'AED', 'SAR', 'SGD', 'CAD', 'AUD', 'JPY', 'CHF',
  'KWD', 'QAR', 'THB', 'NZD', 'MYR', 'CNY', 'HKD', 'BHD', 'OMR', 'SEK',
];
const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US DOLLAR',
  EUR: 'EURO CURRENCY',
  GBP: 'POUND STERLING',
  AED: 'UAE DIRHAM',
  SAR: 'SAUDI RIYAL',
  SGD: 'SINGAPORE DOLLAR',
  CAD: 'CANADIAN DOLLAR',
  AUD: 'AUSTRALIAN DOLLAR',
  JPY: 'JAPANESE YEN',
  CHF: 'SWISS FRANC',
  KWD: 'KUWAITI DINAR',
  QAR: 'QATARI RIYAL',
  THB: 'THAI BAHT',
  NZD: 'NEW ZEALAND DOLLAR',
  MYR: 'MALAYSIAN RINGGIT',
  CNY: 'CHINESE YUAN',
  HKD: 'HONG KONG DOLLAR',
  BHD: 'BAHRAINI DINAR',
  OMR: 'OMANI RIAL',
  SEK: 'SWEDISH KRONA',
};
const PURPOSES = ['PRIVATE VISIT', 'BUSINESS', 'EDUCATION', 'MEDICAL TREATMENT', 'EMPLOYMENT', 'EMIGRATION', 'OTHERS'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('cash_memo');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [activeLut, setActiveLut] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [nextInvoiceNum, setNextInvoiceNum] = useState('');

  // Invoice header
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0] ?? '');

  // Customer & KYC
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPan, setCustomerPan] = useState('');
  const [customerPassport, setCustomerPassport] = useState('');
  const [customerNationality, setCustomerNationality] = useState('INDIAN');
  const [customerGender, setCustomerGender] = useState('Ms.');
  const [customerPurpose, setCustomerPurpose] = useState('PRIVATE VISIT');
  const [customerDestination, setCustomerDestination] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');

  // GST / Seller override state
  const [showSellerEdit, setShowSellerEdit] = useState(false);
  const [sellerState, setSellerState] = useState('');
  const [sellerStateCode, setSellerStateCode] = useState('');
  const [useIgst, setUseIgst] = useState(false);
  const [igstAuto, setIgstAuto] = useState(true); // was auto-detected
  const [cgstRate, setCgstRate] = useState(9);
  const [sgstRate, setSgstRate] = useState(9);
  const [igstRate, setIgstRate] = useState(18);
  const [gstTaxableBasePct, setGstTaxableBasePct] = useState(1);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [disclaimer1, setDisclaimer1] = useState('');
  const [disclaimer2, setDisclaimer2] = useState('');
  const [customNarrative, setCustomNarrative] = useState('');
  const [editNarrative, setEditNarrative] = useState(false);

  // Forex lines (Cash Memo)
  const [forexLines, setForexLines] = useState<ForexLine[]>([
    { currencyCode: 'EUR', currencyName: 'EURO CURRENCY - -CN', sacCode: '997157', amountForeign: '', exchangeRate: '', amountInr: 0 },
  ]);

  // Export lines
  const [exportLines, setExportLines] = useState<ExportLine[]>([
    { description: 'Software Development & Consulting Services', hsnCode: '998314', gstRate: 18, quantity: 1, unitPrice: 1500 },
  ]);
  const [currency, setCurrency] = useState('USD');
  const [isExport, setIsExport] = useState(false);

  // ─── Load initial data ─────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const [custRes, lutRes, profileRes, nextNumRes] = await Promise.all([
        fetch('/api/trpc/customers.list', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/trpc/luts.active', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/trpc/businessProfile.get', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/trpc/businessProfile.nextInvoiceNumber', { credentials: 'include' }).then(r => r.json()).catch(() => null),
      ]);

      const custList = Array.isArray(custRes?.result?.data) ? custRes.result.data : (custRes?.result?.data?.data || []);
      setCustomers(custList);

      const lutList = Array.isArray(lutRes?.result?.data) ? lutRes.result.data : (lutRes?.result?.data?.data || []);
      setActiveLut(lutList[0] || null);

      const profile = profileRes?.result?.data;
      if (profile) {
        setBusinessProfile(profile);
        setGstTaxableBasePct(Number(profile.defaultGstTaxableBasePct ?? 1));
        setCgstRate(Number(profile.defaultCgstRate ?? 9));
        setSgstRate(Number(profile.defaultSgstRate ?? 9));
        setIgstRate(Number(profile.defaultIgstRate ?? 18));
        setSellerState(profile.state ?? '');
        setSellerStateCode(profile.stateCode ?? '');
        setDisclaimer1(profile.disclaimer1 ?? '');
        setDisclaimer2(profile.disclaimer2 ?? '');
        // Auto-set SAC code in forex lines
        setForexLines(lines => lines.map(l => ({ ...l, sacCode: profile.defaultSacCode ?? '997157' })));
      }

      const nextNum = nextNumRes?.result?.data?.number;
      if (nextNum) { setNextInvoiceNum(nextNum); setInvoiceNumber(nextNum); }
    }
    init();
  }, []);

  // Auto-detect IGST vs CGST+SGST based on place of supply vs seller state
  useEffect(() => {
    if (!igstAuto) return;
    const supplySC = placeOfSupply?.match(/\((\d+)\)/)?.[1] ?? '';
    const sellerSC = sellerStateCode;
    if (supplySC && sellerSC && supplySC !== sellerSC) {
      setUseIgst(true);
    } else {
      setUseIgst(false);
    }
  }, [placeOfSupply, sellerStateCode, igstAuto]);

  // When customer changes — auto-populate KYC fields
  function selectCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find(c => c.id === id);
    setSelectedCustomer(c ?? null);
    if (c) {
      setCustomerName(c.name);
      const addrParts = [c.address, c.city, c.state, c.country, c.pincode].filter(Boolean);
      setCustomerAddress(addrParts.join(', '));
      setCustomerPan(c.pan ?? '');
      setCustomerPassport(c.passportNumber ?? '');
      setCustomerNationality(c.nationality ?? 'INDIAN');
      setCustomerGender(c.gender ?? 'Ms.');
      setCustomerPurpose(c.defaultPurpose ?? 'PRIVATE VISIT');
      setCustomerDestination(c.defaultDestinationCountry ?? '');
      setPlaceOfSupply(c.placeOfSupply ?? '');
    }
  }

  // Auto-fetch exchange rate for a forex line (from RBI/FBIL or FEDAI source)
  async function fetchRate(idx: number, code: string) {
    try {
      const res = await fetch(`/api/trpc/rates.convert?input=${encodeURIComponent(JSON.stringify({ from: code, to: 'INR', amount: 1 }))}`, { credentials: 'include' });
      const j = await res.json();
      const rate = j?.result?.data?.rate ?? j?.result?.data?.convertedAmount;
      const sp: string | undefined = j?.result?.data?.sourceProvider;
      if (rate) {
        setForexLines(lines => {
          const updated = [...lines];
          updated[idx] = { ...updated[idx]!, exchangeRate: String(rate), rateSource: sp };
          return recalcLine(updated, idx);
        });
      }
    } catch { /* ignore */ }
  }

  function recalcLine(lines: ForexLine[], idx: number): ForexLine[] {
    const line = lines[idx]!;
    const af = Number(line.amountForeign);
    const er = Number(line.exchangeRate);
    const inr = af > 0 && er > 0 ? Math.round(af * er * 100) / 100 : 0;
    lines[idx] = { ...line, amountInr: inr };
    return lines;
  }

  function updateForexLine(idx: number, key: keyof ForexLine, value: string) {
    setForexLines(lines => {
      const updated = [...lines];
      updated[idx] = { ...updated[idx]!, [key]: value };
      if (key === 'currencyCode') {
        updated[idx]!.currencyName = CURRENCY_NAMES[value] ?? `${value} CURRENCY`;
        fetchRate(idx, value);
      }
      if (key === 'amountForeign' || key === 'exchangeRate') {
        return recalcLine(updated, idx);
      }
      return updated;
    });
  }

  function addForexLine() {
    setForexLines(l => [...l, { currencyCode: 'USD', currencyName: 'US DOLLAR', sacCode: businessProfile?.defaultSacCode ?? '997157', amountForeign: '', exchangeRate: '', amountInr: 0 }]);
  }

  // ─── Computed values ───────────────────────────────────────────────────────

  const inrTotal = forexLines.reduce((s, l) => s + l.amountInr, 0);
  const gstTaxableAmount = Math.round(inrTotal * gstTaxableBasePct) / 100;
  const cgstAmount = !useIgst ? Math.round(gstTaxableAmount * cgstRate) / 100 : 0;
  const sgstAmount = !useIgst ? Math.round(gstTaxableAmount * sgstRate) / 100 : 0;
  const igstAmount = useIgst ? Math.round(gstTaxableAmount * igstRate) / 100 : 0;
  const rawTotal = inrTotal + cgstAmount + sgstAmount + igstAmount;
  const total = Math.round(rawTotal);
  const roundOff = Math.round((total - rawTotal) * 100) / 100;
  const lrsLine = `${customerName}(Self), PAN - ${customerPan}`;

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!customerId) { setError('Please select a customer'); return; }
    if (mode === 'cash_memo' && forexLines.every(l => !l.amountForeign)) {
      setError('Please add at least one currency transaction line');
      return;
    }
    setSubmitting(true);
    setError('');

    const items = mode === 'cash_memo'
      ? forexLines.map(l => ({
          description: l.currencyName,
          currencyName: l.currencyName,
          sacCode: l.sacCode,
          amountForeign: Number(l.amountForeign),
          itemExchangeRate: Number(l.exchangeRate),
          amountInr: l.amountInr,
          quantity: 1,
          unitPrice: l.amountInr,
        }))
      : exportLines.map(l => ({
          description: l.description,
          hsnCode: l.hsnCode,
          gstRate: l.gstRate,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        }));

    try {
      const body = {
        customerId,
        currency: mode === 'cash_memo' ? 'INR' : currency,
        invoiceType: mode,
        isExport: mode === 'export_invoice' ? isExport : false,
        items,
        saleDate,
        placeOfSupply,
        paymentMode,
        paymentReference: paymentReference || undefined,
        useIgst,
        cgstRate: !useIgst ? cgstRate : undefined,
        sgstRate: !useIgst ? sgstRate : undefined,
        igstRate: useIgst ? igstRate : undefined,
        gstTaxableBasePct,
        transactionNarrative: editNarrative ? customNarrative : undefined,
        customerGender,
        customerPassport,
        customerDestinationCountry: customerDestination,
        customerPurpose,
        lrsLine,
        disclaimer1: disclaimer1 || undefined,
        disclaimer2: disclaimer2 || undefined,
      };

      const res = await fetch('/api/trpc/invoices.create', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const inv = json?.result?.data;
      if (inv?.id) {
        router.push(`/invoices/${inv.id}`);
      } else {
        setError('Failed to create invoice. Please try again.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    }
    setSubmitting(false);
  }

  // ─── UI ────────────────────────────────────────────────────────────────────

  return (
    <Container className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-xs text-muted-foreground">Fill in the details below to generate a compliant invoice</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted/60 rounded-xl border border-border w-fit">
        {([['cash_memo', 'Cash Memo (Forex)', Banknote], ['export_invoice', 'Export Invoice', Globe]] as const).map(([m, label, Icon]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${mode === m ? 'bg-accent text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="size-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── CASH MEMO MODE ── */}
      {mode === 'cash_memo' && (
        <div className="space-y-4">

          {/* Seller Block */}
          <Card padding="md">
            <button onClick={() => setShowSellerEdit(!showSellerEdit)} className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-accent" />
                <span className="text-sm font-bold">Seller / Business Details</span>
                <span className="text-[10px] text-muted-foreground ml-1">(from Business Profile)</span>
              </div>
              {showSellerEdit ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>
            {businessProfile ? (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="font-bold text-foreground text-sm">{businessProfile.companyName}</p>
                <p>{[businessProfile.address1, businessProfile.address2].filter(Boolean).join(', ')}</p>
                <p>{businessProfile.city} - {businessProfile.pincode}</p>
                {businessProfile.phone && <p>Phone: {businessProfile.phone}</p>}
                <p className="mt-1 text-[10px] space-x-3">
                  {businessProfile.rbiLicenceNo && <span>RBI: {businessProfile.rbiLicenceNo}</span>}
                  {businessProfile.pan && <span>PAN: {businessProfile.pan}</span>}
                  {businessProfile.gstin && <span>GSTIN: {businessProfile.gstin}</span>}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg">
                <AlertTriangle className="size-3.5" />
                <span>Business Profile not set up. <Link href="/settings/profile" className="underline">Set it up in Settings</Link></span>
              </div>
            )}
          </Card>

          {/* Invoice Header */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="size-4 text-accent" />
              <span className="text-sm font-bold">Invoice Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Invoice No.</label>
                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="h-8 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Invoice Date</label>
                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Sale Date</label>
                <Input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </Card>

          {/* Customer Block */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-accent" />
              <span className="text-sm font-bold">Customer / Buyer</span>
              <span className="text-[10px] text-muted-foreground">— KYC fields auto-fill from saved profile</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Select Customer</label>
              <select
                className="w-full h-8 rounded-xl border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-accent/40 focus:outline-none"
                value={customerId} onChange={e => selectCustomer(e.target.value)}>
                <option value="">— Choose a customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Full Name</label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="MEHAK SINGLA" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Gender (for narrative)</label>
                <select className="w-full h-8 rounded-xl border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-accent/40 focus:outline-none"
                  value={customerGender} onChange={e => setCustomerGender(e.target.value)}>
                  {['Ms.', 'Mr.', 'M/s.'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Address</label>
                <Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="79A Prem Nagar, Haryana, Tohana - 125120" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">PAN</label>
                <Input value={customerPan} onChange={e => setCustomerPan(e.target.value.toUpperCase())} placeholder="HHNPM4865C" className="h-8 text-xs font-mono tracking-wider" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Passport Number</label>
                <Input value={customerPassport} onChange={e => setCustomerPassport(e.target.value.toUpperCase())} placeholder="AL843374" className="h-8 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nationality</label>
                <Input value={customerNationality} onChange={e => setCustomerNationality(e.target.value.toUpperCase())} placeholder="INDIAN" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Purpose</label>
                <select className="w-full h-8 rounded-xl border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-accent/40 focus:outline-none"
                  value={customerPurpose} onChange={e => setCustomerPurpose(e.target.value)}>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Destination Country</label>
                <Input value={customerDestination} onChange={e => setCustomerDestination(e.target.value.toUpperCase())} placeholder="NETHERLAND" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Place of Supply</label>
                <Input value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} placeholder="(06) HARYANA" className="h-8 text-xs" />
              </div>
            </div>
          </Card>

          {/* Transaction Lines */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-accent" />
                <span className="text-sm font-bold">Currency Transaction Lines</span>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={addForexLine}>
                <Plus className="size-3" /> Add Currency
              </Button>
            </div>

            <div className="space-y-3">
              {forexLines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-muted/30 border border-border/60 relative">
                  {forexLines.length > 1 && (
                    <button onClick={() => setForexLines(l => l.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors">
                      <Trash2 className="size-3" />
                    </button>
                  )}
                  {/* Currency code */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Currency</label>
                    <select className="w-full h-7 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none"
                      value={line.currencyCode} onChange={e => updateForexLine(idx, 'currencyCode', e.target.value)}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* Currency label */}
                  <div className="col-span-4 space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Currency Label</label>
                    <Input value={line.currencyName} onChange={e => updateForexLine(idx, 'currencyName', e.target.value)}
                      placeholder="EURO CURRENCY - -CN" className="h-7 text-xs" />
                  </div>
                  {/* SAC */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">SAC Code</label>
                    <Input value={line.sacCode} onChange={e => updateForexLine(idx, 'sacCode', e.target.value)}
                      placeholder="997157" className="h-7 text-xs font-mono" />
                  </div>
                  {/* Amount */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Amt ({line.currencyCode})</label>
                    <Input type="number" value={line.amountForeign} onChange={e => updateForexLine(idx, 'amountForeign', e.target.value)}
                      placeholder="300.00" className="h-7 text-xs" />
                  </div>
                  {/* Rate */}
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Rate (₹)</label>
                      <button onClick={() => fetchRate(idx, line.currencyCode)} className="text-[9px] text-accent hover:underline">Fetch RBI/FBIL</button>
                    </div>
                    <Input type="number" value={line.exchangeRate} onChange={e => updateForexLine(idx, 'exchangeRate', e.target.value)}
                      placeholder="112.50" className="h-7 text-xs font-mono" />
                    {line.rateSource && (
                      <span className={`text-[9px] font-bold ${
                        line.rateSource === 'FBIL' ? 'text-emerald-400' :
                        line.rateSource === 'FEDAI' ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {line.rateSource === 'FBIL' ? '🔴 RBI/FBIL Official' :
                         line.rateSource === 'FEDAI' ? '🟠 FEDAI Market Rate' : '🔵 ECB Reference'}
                      </span>
                    )}
                  </div>
                  {/* INR Equivalent */}
                  <div className="col-span-12 flex items-center justify-end gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground">INR Equivalent:</span>
                    <span className="text-sm font-bold font-mono text-foreground">
                      ₹{line.amountInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* GST Block */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ScrollText className="size-4 text-accent" />
              <span className="text-sm font-bold">GST Computation</span>
            </div>

            {/* IGST auto-detect notice */}
            <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border ${useIgst ? 'border-blue-500/30 bg-blue-500/5 text-blue-400' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'}`}>
              <div className="flex items-center gap-1.5">
                <Info className="size-3.5" />
                <span>
                  {igstAuto
                    ? `Auto-detected: ${useIgst ? 'IGST (interstate — place of supply differs from seller state)' : 'CGST + SGST (intrastate)'}`
                    : `Manual override: ${useIgst ? 'IGST' : 'CGST + SGST'}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                {igstAuto && <span className="text-[10px] opacity-60">auto</span>}
                <button onClick={() => { setIgstAuto(false); setUseIgst(!useIgst); }}
                  className="text-[10px] underline opacity-80 hover:opacity-100">
                  Switch to {useIgst ? 'CGST+SGST' : 'IGST'}
                </button>
                {!igstAuto && (
                  <button onClick={() => setIgstAuto(true)} className="text-[10px] underline opacity-60">reset auto</button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">GST Taxable Base %</label>
                <Input type="number" value={gstTaxableBasePct} onChange={e => setGstTaxableBasePct(Number(e.target.value))} className="h-7 text-xs" />
              </div>
              {!useIgst ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">CGST %</label>
                    <Input type="number" value={cgstRate} onChange={e => setCgstRate(Number(e.target.value))} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">SGST %</label>
                    <Input type="number" value={sgstRate} onChange={e => setSgstRate(Number(e.target.value))} className="h-7 text-xs" />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">IGST %</label>
                  <Input type="number" value={igstRate} onChange={e => setIgstRate(Number(e.target.value))} className="h-7 text-xs" />
                </div>
              )}
            </div>

            {/* Live computation summary */}
            <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">INR Total (forex):</span><span>₹{inrTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST Taxable ({gstTaxableBasePct}%):</span><span>₹{gstTaxableAmount.toFixed(2)}</span></div>
              {!useIgst ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">CGST @ {cgstRate}%:</span><span>₹{cgstAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SGST @ {sgstRate}%:</span><span>₹{sgstAmount.toFixed(2)}</span></div>
                </>
              ) : (
                <div className="flex justify-between"><span className="text-muted-foreground">IGST @ {igstRate}%:</span><span>₹{igstAmount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Round Off:</span><span>₹{roundOff.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-border pt-1.5 font-bold text-sm">
                <span>Total:</span><span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>

          {/* Payment */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="size-4 text-accent" />
              <span className="text-sm font-bold">Payment</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Mode</label>
                <select className="w-full h-8 rounded-xl border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-accent/40 focus:outline-none"
                  value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                  {['CASH', 'CARD', 'UPI', 'NEFT'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Reference / Txn ID (optional)</label>
                <Input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="UPI ref / cheque no." className="h-8 text-xs" />
              </div>
            </div>
          </Card>

          {/* Auto-generated fields preview */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="size-4 text-accent" />
              <span className="text-sm font-bold">Auto-Generated Fields</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground">Transaction Narrative</label>
                  <button onClick={() => setEditNarrative(!editNarrative)} className="text-[10px] text-accent hover:underline">{editNarrative ? 'Use auto' : 'Edit'}</button>
                </div>
                {editNarrative ? (
                  <textarea rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                    value={customNarrative} onChange={e => setCustomNarrative(e.target.value)} />
                ) : (
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-muted-foreground leading-relaxed">
                    We have sold today Foreign Exchange to <strong className="text-foreground">{customerGender} {customerName || '—'}</strong> holder of PASSPORT <strong className="text-foreground">{customerPassport || '—'}</strong> Nationality <strong className="text-foreground">{customerNationality}</strong> Proceeding to <strong className="text-foreground">{customerDestination || '—'}</strong> against Indian Rupees as per the details given below :
                  </div>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">LRS Line: </span>
                <strong className="text-foreground">{lrsLine || '—'}</strong>
              </div>
            </div>
          </Card>

          {/* Disclaimers */}
          <Card padding="md" className="space-y-3">
            <span className="text-sm font-bold">Disclaimers</span>
            <div className="space-y-1">
              <textarea rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                value={disclaimer1} onChange={e => setDisclaimer1(e.target.value)} placeholder="Disclaimer 1..." />
            </div>
            <div className="space-y-1">
              <textarea rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                value={disclaimer2} onChange={e => setDisclaimer2(e.target.value)} placeholder="Disclaimer 2..." />
            </div>
          </Card>
        </div>
      )}

      {/* ── EXPORT INVOICE MODE ── */}
      {mode === 'export_invoice' && (
        <div className="space-y-4">
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-accent" />
              <span className="text-sm font-bold">Customer</span>
            </div>
            <select className="w-full h-8 rounded-xl border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-accent/40 focus:outline-none"
              value={customerId} onChange={e => selectCustomer(e.target.value)}>
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Currency</label>
                <select className="w-full h-8 rounded-xl border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-accent/40 focus:outline-none"
                  value={currency} onChange={e => setCurrency(e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Due Date</label>
                <Input type="date" className="h-8 text-xs" />
              </div>
            </div>
            {activeLut && (
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={isExport} onChange={e => setIsExport(e.target.checked)} className="rounded" />
                <span>Zero-rated export (LUT: <strong>{activeLut.referenceNumber}</strong>)</span>
              </label>
            )}
          </Card>

          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Line Items</span>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setExportLines(l => [...l, { description: '', hsnCode: '', gstRate: 18, quantity: 1, unitPrice: 0 }])}>
                <Plus className="size-3" /> Add Item
              </Button>
            </div>
            {exportLines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-muted/30 border border-border/60">
                <div className="col-span-5 space-y-1"><label className="text-[10px] font-semibold text-muted-foreground">Description</label>
                  <Input value={line.description} onChange={e => { const l = [...exportLines]; l[idx]!.description = e.target.value; setExportLines(l); }} className="h-7 text-xs" /></div>
                <div className="col-span-2 space-y-1"><label className="text-[10px] font-semibold text-muted-foreground">HSN/SAC</label>
                  <Input value={line.hsnCode} onChange={e => { const l = [...exportLines]; l[idx]!.hsnCode = e.target.value; setExportLines(l); }} className="h-7 text-xs font-mono" /></div>
                <div className="col-span-1 space-y-1"><label className="text-[10px] font-semibold text-muted-foreground">Qty</label>
                  <Input type="number" value={line.quantity} onChange={e => { const l = [...exportLines]; l[idx]!.quantity = Number(e.target.value); setExportLines(l); }} className="h-7 text-xs" /></div>
                <div className="col-span-2 space-y-1"><label className="text-[10px] font-semibold text-muted-foreground">Unit Price</label>
                  <Input type="number" value={line.unitPrice} onChange={e => { const l = [...exportLines]; l[idx]!.unitPrice = Number(e.target.value); setExportLines(l); }} className="h-7 text-xs" /></div>
                <div className="col-span-2 space-y-1"><label className="text-[10px] font-semibold text-muted-foreground">GST %</label>
                  <Input type="number" value={line.gstRate} onChange={e => { const l = [...exportLines]; l[idx]!.gstRate = Number(e.target.value); setExportLines(l); }} className="h-7 text-xs" /></div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Error + Submit */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
          <AlertTriangle className="size-4 shrink-0" />{error}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5 text-xs shadow-sm">
          {submitting ? <><RefreshCw className="size-3.5 animate-spin" /> Creating...</> : 'Create Invoice'}
        </Button>
        <Link href="/invoices"><Button variant="outline" className="text-xs">Cancel</Button></Link>
      </div>
    </Container>
  );
}