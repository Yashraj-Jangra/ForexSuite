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
  Minimize2,
  Sparkles,
  ExternalLink,
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
    description: 'Clean fintech aesthetic, soft borders, subtle pill badges, right-aligned summary.',
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

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="size-6 text-accent" />
            Company &amp; Invoice Customization
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure RBI/FFMC regulatory credentials, select your PDF invoice template, and customize GST rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFullscreenPreview(true)}
            className="gap-1.5 shrink-0"
          >
            <Maximize2 className="size-4 text-accent" />
            <span>Full-Screen Preview</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0">
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

      {/* ─── SECTION 1: PDF INVOICE TEMPLATE & LIVE SPLIT PREVIEW ─── */}
      <Card padding="lg" className="border-accent/40 bg-accent/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-accent" />
            <h2 className="text-base font-bold text-foreground">Invoice PDF Design &amp; Template</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
            5 Professional Layouts
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose the design archetype for your generated Cash Memos &amp; Tax Invoices. All templates render 100% compliant RBI, FEMA, and GST data.
        </p>

        {/* Template Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {TEMPLATES.map((tmpl) => {
            const isSelected = profile.invoiceTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => set('invoiceTemplate', tmpl.id)}
                className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'border-accent bg-card shadow-md ring-2 ring-accent/30'
                    : 'border-border/70 bg-card/60 hover:bg-card hover:border-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {tmpl.style}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${tmpl.badgeColor}`}>
                      {tmpl.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{tmpl.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tmpl.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-accent flex items-center gap-1">
                    <Eye className="size-3" />
                    <span>{isSelected ? 'Active Selection' : 'Click to Select & Preview'}</span>
                  </span>
                  {isSelected && (
                    <span className="size-5 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="size-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Accent Color Picker */}
        <div className="pt-2 border-t border-border/60">
          <label className="text-xs font-bold text-foreground block mb-2">Primary Accent Color</label>
          <div className="flex flex-wrap items-center gap-3">
            {ACCENT_COLORS.map((col) => (
              <button
                key={col.hex}
                type="button"
                onClick={() => set('invoiceAccentColor', col.hex)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  profile.invoiceAccentColor === col.hex
                    ? 'border-accent bg-accent/10 text-foreground ring-1 ring-accent'
                    : 'border-border/60 hover:bg-muted text-muted-foreground'
                }`}
              >
                <span className="size-3.5 rounded-full shrink-0 shadow-xs" style={{ background: col.hex }} />
                <span>{col.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Inline Live Preview Window */}
        <div className="pt-4 border-t border-border/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Real-Time Render Preview ({TEMPLATES.find((t) => t.id === profile.invoiceTemplate)?.name})
              </h3>
            </div>
            <button
              onClick={() => setFullscreenPreview(true)}
              className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <Maximize2 className="size-3.5" />
              <span>Expand Preview</span>
            </button>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 md:p-6 flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-[760px] h-[520px] bg-white rounded-lg shadow-2xl overflow-hidden border border-neutral-700">
              <iframe
                srcDoc={previewHtml}
                title="Real-Time Invoice Preview"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ─── SECTION 2: COMPANY IDENTITY ─── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground">Company Identity</h2>
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

        <div className="grid sm:grid-cols-4 gap-3">
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

      {/* ─── SECTION 3: REGULATORY CREDENTIALS ─── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground">RBI / Regulatory Identifiers</h2>
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
      </Card>

      {/* ─── SECTION 4: LOGO & SIGNATURE ─── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground">Brand Assets</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Company Logo</label>
            <div className="flex items-center gap-4">
              {profile.logoBase64 ? (
                <img
                  src={profile.logoBase64}
                  alt="Company logo"
                  className="h-14 max-w-[160px] object-contain border rounded-lg p-1 bg-white"
                />
              ) : (
                <div className="h-14 w-28 border border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
                  No logo
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="size-3.5" />
                Upload Logo
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
            <div className="flex items-center gap-4">
              {profile.signatureBase64 ? (
                <img
                  src={profile.signatureBase64}
                  alt="Signature"
                  className="h-14 max-w-[160px] object-contain border rounded-lg p-1 bg-white"
                />
              ) : (
                <div className="h-14 w-28 border border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
                  No signature
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sigRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="size-3.5" />
                Upload Stamp
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

      {/* ─── SECTION 5: INVOICE NUMBER SEQUENCE ─── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground">Invoice Numbering Sequence</h2>
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

      {/* ─── SECTION 6: STATUTORY DISCLAIMERS ─── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground">Statutory RBI Disclaimers</h2>
        <div className="space-y-3">
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

      {/* ─── FULLSCREEN MODAL PREVIEW ─── */}
      {fullscreenPreview && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-5xl h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <Palette className="size-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    PDF Style Preview — {TEMPLATES.find((t) => t.id === profile.invoiceTemplate)?.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>Accent:</span>
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

            {/* Modal Body: Rendered HTML iframe */}
            <div className="flex-1 bg-neutral-950 p-4 md:p-8 flex items-center justify-center overflow-auto">
              <div className="w-full max-w-[800px] h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-neutral-700">
                <iframe
                  srcDoc={previewHtml}
                  title="Fullscreen Invoice PDF Preview"
                  className="w-full h-full border-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-card text-xs text-muted-foreground">
              <span>All 5 templates automatically synchronize with your live company credentials.</span>
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
