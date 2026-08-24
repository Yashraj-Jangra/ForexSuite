'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { renderInvoiceHtml } from '@vaultbill/pdf/templates';
import {
  CheckCircle2,
  Building2,
  Palette,
  Eye,
  X,
  Upload,
  RefreshCw,
  Check,
  Maximize2,
  Sparkles,
  FileText,
  ShieldCheck,
  Hash,
  FileSpreadsheet,
} from 'lucide-react';

const INVOICE_FORMAT_PRESETS = [
  { label: 'INV-YY-0001', value: 'INV-{YY}-{SEQ}', preview: 'INV-26-0001' },
  { label: 'INV-YYYY-0001', value: 'INV-{YYYY}-{SEQ}', preview: 'INV-2026-0001' },
  { label: 'Custom prefix (e.g. SP/0001)', value: 'SP/{SEQ}', preview: 'SP/0001' },
];

export type InvoiceTemplateId = 'modern' | 'executive' | 'classic' | 'minimal' | 'corporate';

const TEMPLATES: {
  id: InvoiceTemplateId;
  name: string;
  badge: string;
  description: string;
  style: string;
  badgeColor: string;
}[] = [
  {
    id: 'modern',
    name: 'Modern Minimalist',
    badge: 'Recommended',
    description: 'Clean fintech aesthetic, soft borders, subtle pill badges, right-aligned summary card.',
    style: 'Modern & Clean',
    badgeColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  },
  {
    id: 'executive',
    name: 'Executive Slate',
    badge: 'Authoritative',
    description: 'Deep slate header band, dual-tone table grid, gold/accent highlights, corporate feel.',
    style: 'Tier-1 Banking',
    badgeColor: 'bg-slate-800 border-slate-700 text-slate-200',
  },
  {
    id: 'classic',
    name: 'Classic Heritage FFMC',
    badge: 'Traditional',
    description: 'Traditional full-border box grid, formal serif accents, double-line rules, money-changer look.',
    style: 'Classic Banking',
    badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  {
    id: 'minimal',
    name: 'Clean Monochrome',
    badge: 'Zero Ink Waste',
    description: 'High-contrast Swiss layout, sharp horizontal rules, zero color fills, ideal for thermal/laser printers.',
    style: 'Swiss Monochrome',
    badgeColor: 'bg-neutral-800 border-neutral-700 text-neutral-300',
  },
  {
    id: 'corporate',
    name: 'Neo Corporate',
    badge: 'Contemporary',
    description: 'Sleek accent top line, floating card sections, colored badges for SAC & purpose codes.',
    style: 'Modern Enterprise',
    badgeColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  },
];

const ACCENT_COLORS = [
  { name: 'Sapphire Blue', hex: '#2563eb' },
  { name: 'Executive Slate', hex: '#0f172a' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Royal Indigo', hex: '#6366f1' },
  { name: 'Ruby Crimson', hex: '#dc2626' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Monochrome', hex: '#171717' },
];

interface Profile {
  companyName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  rbiLicenceNo: string;
  cin: string;
  pan: string;
  gstin: string;
  logoBase64?: string;
  signatureBase64?: string;
  invoiceNumberFormat: string;
  invoiceNumberSeed: number;
  invoiceTemplate: InvoiceTemplateId;
  invoiceAccentColor: string;
  defaultSacCode: string;
  defaultCgstRate: number;
  defaultSgstRate: number;
  defaultIgstRate: number;
  defaultGstTaxableBasePct: number;
  disclaimer1: string;
  disclaimer2: string;
}

const DEFAULT_PROFILE: Profile = {
  companyName: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
  phone: '',
  email: '',
  website: '',
  rbiLicenceNo: '',
  cin: '',
  pan: '',
  gstin: '',
  invoiceNumberFormat: 'INV-{YY}-{SEQ}',
  invoiceNumberSeed: 0,
  invoiceTemplate: 'modern',
  invoiceAccentColor: '#2563eb',
  defaultSacCode: '997157',
  defaultCgstRate: 9,
  defaultSgstRate: 9,
  defaultIgstRate: 18,
  defaultGstTaxableBasePct: 1,
  disclaimer1: 'Please count your money before leaving the counter.',
  disclaimer2:
    'If any dispute arises against this invoice by any Law Enforcement Agency/Cyber Crime Cell/Any Regulating Authority, Clients will be solely responsible for the same.',
};

function generateSampleInvoiceHtml(profile: Profile, tmpl: InvoiceTemplateId, accentColor: string): string {
  return renderInvoiceHtml({
    businessProfile: {
      companyName: profile.companyName || 'ACME FOREX & MONEY CHANGER PVT LTD',
      address1: profile.address1 || 'Suite 401, Financial Express Towers',
      address2: profile.address2 || 'Nariman Point',
      city: profile.city || 'Mumbai',
      state: profile.state || 'Maharashtra',
      stateCode: profile.stateCode || '27',
      pincode: profile.pincode || '400021',
      phone: profile.phone || '+91 22 2847 9000',
      email: profile.email || 'compliance@acmeforex.com',
      website: profile.website || 'www.acmeforex.com',
      rbiLicenceNo: profile.rbiLicenceNo || 'FE.MUM.FFMC/0421/2024',
      cin: profile.cin || 'U74999MH2024PTC123456',
      pan: profile.pan || 'AABCA1234F',
      gstin: profile.gstin || '27AABCA1234F1Z5',
      logoBase64: profile.logoBase64,
      signatureBase64: profile.signatureBase64,
      disclaimer1: profile.disclaimer1 || 'Please count your money before leaving the counter.',
      disclaimer2: profile.disclaimer2 || 'All transactions are subject to FEMA guidelines and RBI master circulars.',
    },
    invoiceNumber: 'CM-26-0421',
    invoiceType: 'cash_memo',
    invoiceDate: new Date().toISOString().split('T')[0] ?? '2026-08-24',
    saleDate: new Date().toISOString().split('T')[0] ?? '2026-08-24',
    placeOfSupply: profile.stateCode ? `(${profile.stateCode}) ${profile.state || 'MAHARASHTRA'}` : '(27) MAHARASHTRA',
    customerName: 'Ms. Sarah Jenkins',
    customerAddress: 'Flat 12B, Sea Green Heights, Worli, Mumbai',
    customerPan: 'ABCDE9876K',
    customerPassport: 'Z9876543',
    customerNationality: 'BRITISH',
    customerDestinationCountry: 'UNITED KINGDOM',
    customerPurpose: 'PRIVATE VISIT',
    customerGender: 'Ms.',
    transactionNarrative:
      'BEING FOREIGN CURRENCY PURCHASED AGAINST BRITISH PASSPORT NO. Z9876543 FOR PRIVATE OVERSEAS TRAVEL UNDER LIBERALISED REMITTANCE SCHEME (LRS).',
    items: [
      {
        description: 'US DOLLAR CURRENCY NOTES',
        currencyName: 'USD - US Dollar',
        sacCode: profile.defaultSacCode || '997157',
        amountForeign: 2500,
        itemExchangeRate: 86.45,
        amountInr: 216125,
      },
      {
        description: 'BRITISH POUND CURRENCY NOTES',
        currencyName: 'GBP - British Pound',
        sacCode: profile.defaultSacCode || '997157',
        amountForeign: 1000,
        itemExchangeRate: 111.2,
        amountInr: 111200,
      },
    ],
    gstTaxableAmount: 3273.25,
    cgstRate: profile.defaultCgstRate || 9,
    cgstAmount: 294.59,
    sgstRate: profile.defaultSgstRate || 9,
    sgstAmount: 294.59,
    roundOff: -0.18,
    total: 327914,
    amountInWords: 'Rupees Three Lakh Twenty Seven Thousand Nine Hundred Fourteen Only',
    paymentMode: 'NEFT / RTGS',
    paymentReference: 'HDFCR520260824987',
    template: tmpl,
    accentColor: accentColor,
  });
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customFormat, setCustomFormat] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/trpc/businessProfile.get', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        const data = j?.result?.data;
        if (data) {
          setProfile({
            companyName: data.companyName ?? '',
            address1: data.address1 ?? '',
            address2: data.address2 ?? '',
            city: data.city ?? '',
            state: data.state ?? '',
            stateCode: data.stateCode ?? '',
            pincode: data.pincode ?? '',
            phone: data.phone ?? '',
            email: data.email ?? '',
            website: data.website ?? '',
            rbiLicenceNo: data.rbiLicenceNo ?? '',
            cin: data.cin ?? '',
            pan: data.pan ?? '',
            gstin: data.gstin ?? '',
            logoBase64: data.logoBase64 ?? undefined,
            signatureBase64: data.signatureBase64 ?? undefined,
            invoiceNumberFormat: data.invoiceNumberFormat ?? 'INV-{YY}-{SEQ}',
            invoiceNumberSeed: Number(data.invoiceNumberSeed ?? 0),
            invoiceTemplate: (data.invoiceTemplate as InvoiceTemplateId) ?? 'modern',
            invoiceAccentColor: data.invoiceAccentColor ?? '#2563eb',
            defaultSacCode: data.defaultSacCode ?? '997157',
            defaultCgstRate: Number(data.defaultCgstRate ?? 9),
            defaultSgstRate: Number(data.defaultSgstRate ?? 9),
            defaultIgstRate: Number(data.defaultIgstRate ?? 18),
            defaultGstTaxableBasePct: Number(data.defaultGstTaxableBasePct ?? 1),
            disclaimer1: data.disclaimer1 ?? DEFAULT_PROFILE.disclaimer1,
            disclaimer2: data.disclaimer2 ?? DEFAULT_PROFILE.disclaimer2,
          });
          const isPreset = INVOICE_FORMAT_PRESETS.some((p) => p.value === data.invoiceNumberFormat);
          setCustomFormat(!isPreset);
        }
      })
      .catch(() => {});
  }, []);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function handleImageUpload(field: 'logoBase64' | 'signatureBase64', file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      set(field, result);
    };
    reader.readAsDataURL(file);
  }

  // Instant real-time rendered HTML (0 latency)
  const previewHtml = useMemo(() => {
    return generateSampleInvoiceHtml(profile, profile.invoiceTemplate, profile.invoiceAccentColor);
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/trpc/businessProfile.save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      /* ignore */
    }
    setSaving(false);
  }

  const activeTemplate = TEMPLATES.find((t) => t.id === profile.invoiceTemplate) || TEMPLATES[0]!;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-16 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="size-6 text-accent" />
            Company &amp; Invoice Customization
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure RBI/FFMC regulatory credentials, select your PDF invoice template with live side-by-side preview, and customize GST rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setFullscreenPreview(true)}
            className="gap-2 shrink-0"
          >
            <Maximize2 className="size-4 text-accent" />
            <span>Full-Screen Preview</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0 px-5">
            {saved ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            )}
          </Button>
        </div>
      </div>

      {/* ─── SECTION 1: SIDE-BY-SIDE PDF TEMPLATE SELECTOR & REAL-TIME PREVIEW ─── */}
      <Card padding="lg" className="border-accent/30 bg-accent/[0.02] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <Palette className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Invoice PDF Design &amp; Live Studio</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch templates or accent colors below to view instant, real-time rendering of your Cash Memos.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
            5 Regulatory Layouts
          </span>
        </div>

        {/* Side-by-Side Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Template Selector & Theme Controls (5 cols on xl) */}
          <div className="xl:col-span-5 space-y-5">
            {/* Template Archetype Cards */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Select Layout Archetype
              </label>

              <div className="space-y-2.5">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = profile.invoiceTemplate === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => set('invoiceTemplate', tmpl.id)}
                      className={`relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-accent bg-card shadow-md ring-2 ring-accent/30'
                          : 'border-border/70 bg-card/60 hover:bg-card hover:border-border'
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`size-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-accent bg-accent text-white'
                              : 'border-muted-foreground/40 bg-muted/20'
                          }`}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-xs font-bold text-foreground truncate">{tmpl.name}</h3>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${tmpl.badgeColor}`}
                          >
                            {tmpl.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {tmpl.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="pt-4 border-t border-border/60 space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Primary Accent Color
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACCENT_COLORS.map((col) => {
                  const isColorActive = profile.invoiceAccentColor === col.hex;
                  return (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => set('invoiceAccentColor', col.hex)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        isColorActive
                          ? 'border-accent bg-accent/10 text-foreground ring-1 ring-accent'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="size-3.5 rounded-full shrink-0 shadow-xs" style={{ background: col.hex }} />
                      <span className="truncate text-[11px]">{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expand Fullscreen Callout */}
            <div className="pt-3">
              <Button
                variant="outline"
                onClick={() => setFullscreenPreview(true)}
                className="w-full gap-2 text-xs font-semibold py-2.5 border-dashed"
              >
                <Maximize2 className="size-3.5 text-accent" />
                <span>Open Expanded A4 High-Res View</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Live Real-Time Invoice Preview Canvas (7 cols on xl) */}
          <div className="xl:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Live Canvas — {activeTemplate.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zero Latency Sync</span>
              </div>
            </div>

            {/* Embedded Live Preview Canvas Container */}
            <div className="w-full h-[660px] xl:h-[720px] bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3 sm:p-4 flex items-center justify-center overflow-hidden shadow-inner">
              <div className="w-full h-full max-w-[800px] bg-white rounded-xl shadow-2xl overflow-hidden border border-neutral-700">
                <iframe
                  srcDoc={previewHtml}
                  title="Real-Time Invoice Preview Canvas"
                  className="w-full h-full border-none"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── SECTION 2 & 3: COMPANY IDENTITY & REGULATORY IDENTIFIERS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Identity */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <Building2 className="size-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Company Identity &amp; Contact</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Company Name *"
              value={profile.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="e.g. S.P. FOREX PRIVATE LIMITED"
            />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+91 11 2345 6789"
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="info@spforex.com"
            />
            <Input
              label="Website"
              value={profile.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="www.spforex.com"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Address Line 1"
              value={profile.address1}
              onChange={(e) => set('address1', e.target.value)}
              placeholder="Shop / Unit No., Building Name"
            />
            <Input
              label="Address Line 2"
              value={profile.address2}
              onChange={(e) => set('address2', e.target.value)}
              placeholder="Street, Area / Landmark"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="City"
              value={profile.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="New Delhi"
            />
            <Input
              label="State"
              value={profile.state}
              onChange={(e) => set('state', e.target.value)}
              placeholder="Delhi"
            />
            <Input
              label="State Code"
              value={profile.stateCode}
              onChange={(e) => set('stateCode', e.target.value)}
              placeholder="07"
              maxLength={2}
            />
            <Input
              label="Pincode"
              value={profile.pincode}
              onChange={(e) => set('pincode', e.target.value)}
              placeholder="110001"
              maxLength={6}
            />
          </div>
        </Card>

        {/* Regulatory Identifiers */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <ShieldCheck className="size-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">RBI / Regulatory Identifiers</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="RBI Licence No."
              value={profile.rbiLicenceNo}
              onChange={(e) => set('rbiLicenceNo', e.target.value)}
              placeholder="e.g. FE.DEL.FFMC/0421/2024"
              className="font-mono"
            />
            <Input
              label="CIN"
              value={profile.cin}
              onChange={(e) => set('cin', e.target.value.toUpperCase())}
              placeholder="U74999DL2024PTC123456"
              className="font-mono"
            />
            <Input
              label="PAN"
              value={profile.pan}
              onChange={(e) => set('pan', e.target.value.toUpperCase())}
              placeholder="AABCS1234F"
              maxLength={10}
              className="font-mono"
            />
            <Input
              label="GSTIN"
              value={profile.gstin}
              onChange={(e) => set('gstin', e.target.value.toUpperCase())}
              placeholder="07AABCS1234F1Z5"
              maxLength={15}
              className="font-mono"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <Input
              label="Default SAC Code"
              value={profile.defaultSacCode}
              onChange={(e) => set('defaultSacCode', e.target.value)}
              placeholder="997157"
              className="font-mono"
            />
            <Input
              label="CGST Rate (%)"
              type="number"
              value={profile.defaultCgstRate}
              onChange={(e) => set('defaultCgstRate', parseFloat(e.target.value) || 0)}
              placeholder="9"
            />
            <Input
              label="SGST Rate (%)"
              type="number"
              value={profile.defaultSgstRate}
              onChange={(e) => set('defaultSgstRate', parseFloat(e.target.value) || 0)}
              placeholder="9"
            />
          </div>
        </Card>
      </div>

      {/* ─── SECTION 4 & 5: BRAND ASSETS & INVOICE NUMBERING ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Assets */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <Upload className="size-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Brand Assets &amp; Authorized Signature</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Company Logo</label>
              <div className="flex items-center gap-3">
                {profile.logoBase64 ? (
                  <img
                    src={profile.logoBase64}
                    alt="Company logo"
                    className="h-14 max-w-[140px] object-contain border rounded-lg p-1 bg-white"
                  />
                ) : (
                  <div className="h-14 w-24 border border-dashed rounded-lg flex items-center justify-center text-[11px] text-muted-foreground bg-muted/20">
                    No logo
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoRef.current?.click()}
                  className="gap-1.5 text-xs"
                >
                  <Upload className="size-3.5" />
                  Upload
                </Button>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('logoBase64', file);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                Authorized Signatory Stamp
              </label>
              <div className="flex items-center gap-3">
                {profile.signatureBase64 ? (
                  <img
                    src={profile.signatureBase64}
                    alt="Signature"
                    className="h-14 max-w-[140px] object-contain border rounded-lg p-1 bg-white"
                  />
                ) : (
                  <div className="h-14 w-24 border border-dashed rounded-lg flex items-center justify-center text-[11px] text-muted-foreground bg-muted/20">
                    No stamp
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => sigRef.current?.click()}
                  className="gap-1.5 text-xs"
                >
                  <Upload className="size-3.5" />
                  Upload
                </Button>
                <input
                  ref={sigRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('signatureBase64', file);
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Invoice Numbering Sequence */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <Hash className="size-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Invoice Numbering Sequence</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Format Pattern</label>
              <select
                value={customFormat ? 'custom' : profile.invoiceNumberFormat}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setCustomFormat(true);
                  } else {
                    setCustomFormat(false);
                    set('invoiceNumberFormat', e.target.value);
                  }
                }}
                className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2"
              >
                {INVOICE_FORMAT_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} (e.g. {p.preview})
                  </option>
                ))}
                <option value="custom">Custom Format...</option>
              </select>
              {customFormat && (
                <Input
                  value={profile.invoiceNumberFormat}
                  onChange={(e) => set('invoiceNumberFormat', e.target.value)}
                  placeholder="e.g. BILL/{YY}/{SEQ}"
                  className="mt-2 font-mono text-xs"
                />
              )}
            </div>
            <Input
              label="Sequence Counter Seed"
              type="number"
              value={profile.invoiceNumberSeed}
              onChange={(e) => set('invoiceNumberSeed', parseInt(e.target.value, 10) || 0)}
              placeholder="0"
            />
          </div>
        </Card>
      </div>

      {/* ─── SECTION 6: STATUTORY DISCLAIMERS ─── */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/50 pb-3">
          <FileText className="size-4 text-accent" />
          <h2 className="text-sm font-bold text-foreground">Statutory RBI Disclaimers</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Disclaimer 1 (Header Note)</label>
            <textarea
              value={profile.disclaimer1}
              onChange={(e) => set('disclaimer1', e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Disclaimer 2 (Legal &amp; FEMA Compliance Note)
            </label>
            <textarea
              value={profile.disclaimer2}
              onChange={(e) => set('disclaimer2', e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </Card>

      {/* ─── EXPANDED FULLSCREEN MODAL (PROPERLY CONSTRAINED TO SCREEN HEIGHT WITH SMOOTH A4 SCROLL) ─── */}
      {fullscreenPreview && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-6xl h-[94vh] max-h-[94vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3">
                <Palette className="size-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    PDF Style Preview — {activeTemplate.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>Theme Accent:</span>
                    <span className="size-2.5 rounded-full" style={{ background: profile.invoiceAccentColor }} />
                    <span className="font-mono">{profile.invoiceAccentColor}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFullscreenPreview(false)}
                  className="gap-1.5"
                >
                  <X className="size-4" />
                  <span>Close Preview</span>
                </Button>
              </div>
            </div>

            {/* Modal Body: Scrollable Vertical Canvas Container */}
            <div className="flex-1 w-full bg-neutral-950 p-4 sm:p-8 overflow-y-auto overflow-x-hidden flex justify-center items-start">
              <div className="w-full max-w-[850px] bg-white rounded-xl shadow-2xl border border-neutral-700 overflow-hidden shrink-0">
                <iframe
                  srcDoc={previewHtml}
                  title="Fullscreen Invoice PDF Preview"
                  className="w-full min-h-[1100px] border-none block"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-card text-xs text-muted-foreground shrink-0">
              <span>Previewing sample Cash Memo with your active credentials and chosen theme.</span>
              <Button size="sm" onClick={() => setFullscreenPreview(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
