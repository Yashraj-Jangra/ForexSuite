'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Building2,
  FileText,
  Percent,
  Upload,
  AlertCircle,
  Palette,
  Eye,
  X,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
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
  previewHeaderBg: string;
  previewBorder: string;
}[] = [
  {
    id: 'modern',
    name: 'Modern Minimalist',
    badge: 'Recommended',
    description: 'Clean fintech aesthetic, soft borders, subtle pill badges, right-aligned summary.',
    style: 'Modern & Clean',
    previewHeaderBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    previewBorder: 'border-blue-500',
  },
  {
    id: 'executive',
    name: 'Executive Slate',
    badge: 'Authoritative',
    description: 'Deep slate header band, dual-tone table grid, gold/accent highlights, corporate feel.',
    style: 'Tier-1 Banking',
    previewHeaderBg: 'bg-slate-900 border-slate-700 text-slate-200',
    previewBorder: 'border-slate-500',
  },
  {
    id: 'classic',
    name: 'Classic Heritage FFMC',
    badge: 'Traditional',
    description: 'Traditional full-border box grid, formal serif accents, double-line rules, money-changer look.',
    style: 'Classic Banking',
    previewHeaderBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    previewBorder: 'border-amber-500',
  },
  {
    id: 'minimal',
    name: 'Clean Monochrome',
    badge: 'Zero Ink Waste',
    description: 'High-contrast Swiss layout, sharp horizontal rules, zero color fills, ideal for thermal/laser printers.',
    style: 'Swiss Monochrome',
    previewHeaderBg: 'bg-neutral-800 border-neutral-700 text-neutral-300',
    previewBorder: 'border-neutral-400',
  },
  {
    id: 'corporate',
    name: 'Neo Corporate',
    badge: 'Contemporary',
    description: 'Sleek accent top line, floating card sections, colored badges for SAC & purpose codes.',
    style: 'Modern Enterprise',
    previewHeaderBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    previewBorder: 'border-indigo-500',
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

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customFormat, setCustomFormat] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
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

  async function handleOpenPreview(tmpl?: InvoiceTemplateId, color?: string) {
    const targetTemplate = tmpl || profile.invoiceTemplate;
    const targetColor = color || profile.invoiceAccentColor;
    setLoadingPreview(true);
    setPreviewOpen(true);
    try {
      const res = await fetch(
        `/api/trpc/businessProfile.previewHtml?input=${encodeURIComponent(
          JSON.stringify({ template: targetTemplate, accentColor: targetColor }),
        )}`,
        { credentials: 'include' },
      );
      const json = await res.json();
      const html = json?.result?.data?.html || '';
      setPreviewHtml(html);
    } catch {
      /* ignore */
    }
    setLoadingPreview(false);
  }

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
    <div className="space-y-8 max-w-4xl pb-16">
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
            onClick={() => handleOpenPreview()}
            className="gap-1.5 shrink-0"
          >
            <Eye className="size-4 text-accent" />
            <span>Live PDF Preview</span>
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

      {/* ─── SECTION 1: PDF INVOICE TEMPLATE & STYLING ─── */}
      <Card padding="lg" className="border-accent/40 bg-accent/5 space-y-5">
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
                onClick={() => {
                  set('invoiceTemplate', tmpl.id);
                  handleOpenPreview(tmpl.id, profile.invoiceAccentColor);
                }}
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
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${tmpl.previewHeaderBg}`}>
                      {tmpl.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{tmpl.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tmpl.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-accent flex items-center gap-1">
                    <Eye className="size-3" />
                    <span>Click to Preview</span>
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
        <div className="pt-3 border-t border-border/60">
          <label className="text-xs font-bold text-foreground block mb-2">Primary Accent Color</label>
          <div className="flex flex-wrap items-center gap-3">
            {ACCENT_COLORS.map((col) => (
              <button
                key={col.hex}
                type="button"
                onClick={() => {
                  set('invoiceAccentColor', col.hex);
                  if (previewOpen) handleOpenPreview(profile.invoiceTemplate, col.hex);
                }}
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
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Authorized Signatory Stamp</label>
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

      {/* ─── LIVE PREVIEW MODAL ─── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-4xl w-full h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <Eye className="size-4 text-accent" />
                <h3 className="text-sm font-bold text-foreground">
                  Live Invoice Preview — {TEMPLATES.find((t) => t.id === profile.invoiceTemplate)?.name}
                </h3>
                <span
                  className="size-3 rounded-full shadow-xs"
                  style={{ background: profile.invoiceAccentColor }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenPreview(profile.invoiceTemplate, profile.invoiceAccentColor)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Refresh Preview"
                >
                  <RefreshCw className={`size-4 ${loadingPreview ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Rendered HTML iframe */}
            <div className="flex-1 bg-neutral-900 p-4 flex items-center justify-center overflow-auto">
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-white/60 text-sm font-semibold">
                  <RefreshCw className="size-5 animate-spin" />
                  <span>Generating preview...</span>
                </div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  title="Invoice PDF Preview"
                  className="w-full h-full max-w-[800px] bg-white rounded-lg shadow-2xl border border-neutral-700"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-card text-xs">
              <div className="text-muted-foreground">
                Displaying sample Cash Memo with your active credentials and chosen theme.
              </div>
              <Button size="sm" onClick={() => setPreviewOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
