'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Building2, FileText, Percent, Upload, AlertCircle } from 'lucide-react';

const INVOICE_FORMAT_PRESETS = [
  { label: 'INV-YY-0001', value: 'INV-{YY}-{SEQ}', preview: 'INV-26-0001' },
  { label: 'INV-YYYY-0001', value: 'INV-{YYYY}-{SEQ}', preview: 'INV-2026-0001' },
  { label: 'Custom prefix (e.g. SP/0001)', value: 'SP/{SEQ}', preview: 'SP/0001' },
];

interface Profile {
  companyName: string; address1: string; address2: string; city: string; state: string;
  stateCode: string; pincode: string; phone: string; email: string; website: string;
  rbiLicenceNo: string; cin: string; pan: string; gstin: string;
  logoBase64?: string; signatureBase64?: string;
  invoiceNumberFormat: string; invoiceNumberSeed: number;
  defaultSacCode: string; defaultCgstRate: number; defaultSgstRate: number;
  defaultIgstRate: number; defaultGstTaxableBasePct: number;
  disclaimer1: string; disclaimer2: string;
}

const DEFAULT_PROFILE: Profile = {
  companyName: '', address1: '', address2: '', city: '', state: '', stateCode: '', pincode: '',
  phone: '', email: '', website: '', rbiLicenceNo: '', cin: '', pan: '', gstin: '',
  invoiceNumberFormat: 'INV-{YY}-{SEQ}', invoiceNumberSeed: 0,
  defaultSacCode: '997157', defaultCgstRate: 9, defaultSgstRate: 9, defaultIgstRate: 18,
  defaultGstTaxableBasePct: 1,
  disclaimer1: 'Please count your money before leaving the counter.',
  disclaimer2: 'If any dispute arises against this invoice by any Law Enforcement Agency/Cyber Crime Cell/Any Regulating Authority, Clients will be solely responsible for the same.',
};

function invoiceNumberPreview(format: string, seed = 1): string {
  const yy = new Date().getFullYear().toString().slice(-2);
  const yyyy = new Date().getFullYear().toString();
  const seq = String(seed).padStart(4, '0');
  return format.replace('{SEQ}', seq).replace('{YY}', yy).replace('{YYYY}', yyyy);
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customFormat, setCustomFormat] = useState(false);
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
            address1: data.address1 ?? '', address2: data.address2 ?? '',
            city: data.city ?? '', state: data.state ?? '',
            stateCode: data.stateCode ?? '', pincode: data.pincode ?? '',
            phone: data.phone ?? '', email: data.email ?? '', website: data.website ?? '',
            rbiLicenceNo: data.rbiLicenceNo ?? '', cin: data.cin ?? '',
            pan: data.pan ?? '', gstin: data.gstin ?? '',
            logoBase64: data.logoBase64 ?? undefined,
            signatureBase64: data.signatureBase64 ?? undefined,
            invoiceNumberFormat: data.invoiceNumberFormat ?? 'INV-{YY}-{SEQ}',
            invoiceNumberSeed: Number(data.invoiceNumberSeed ?? 0),
            defaultSacCode: data.defaultSacCode ?? '997157',
            defaultCgstRate: Number(data.defaultCgstRate ?? 9),
            defaultSgstRate: Number(data.defaultSgstRate ?? 9),
            defaultIgstRate: Number(data.defaultIgstRate ?? 18),
            defaultGstTaxableBasePct: Number(data.defaultGstTaxableBasePct ?? 1),
            disclaimer1: data.disclaimer1 ?? DEFAULT_PROFILE.disclaimer1,
            disclaimer2: data.disclaimer2 ?? DEFAULT_PROFILE.disclaimer2,
          });
          const isPreset = INVOICE_FORMAT_PRESETS.some(p => p.value === data.invoiceNumberFormat);
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
    } catch { /* ignore */ }
    setSaving(false);
  }

  function field(label: string, key: keyof Profile, placeholder = '', type = 'text') {
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        <Input
          type={type}
          placeholder={placeholder}
          value={String(profile[key] ?? '')}
          onChange={(e) => set(key, type === 'number' ? Number(e.target.value) as any : e.target.value as any)}
          className="h-8 text-xs"
        />
      </div>
    );
  }

  const formatPreview = invoiceNumberPreview(profile.invoiceNumberFormat, profile.invoiceNumberSeed + 1);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your company details are auto-filled into every Cash Memo. All fields are editable at invoice creation time.
        </p>
      </div>

      {/* Company Identity */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-accent/10 text-accent"><Building2 className="size-4" /></div>
          <h2 className="text-sm font-bold">Company Identity</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('Company Name', 'companyName', 'SANDEEP FLIGHTS TICKET PVT.LTD.')}
          {field('Phone', 'phone', '9812379821')}
          {field('Email', 'email', 'info@company.com', 'email')}
          {field('Website', 'website', 'www.company.com')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('Address Line 1', 'address1', '89/22 Kanwersain Gupta Chowk')}
          {field('Address Line 2', 'address2', 'Railway Road')}
          {field('City', 'city', 'Tohana')}
          {field('Pincode', 'pincode', '125120')}
          {field('State', 'state', 'Haryana')}
          {field('State Code', 'stateCode', '06')}
        </div>
      </Card>

      {/* Regulatory Identifiers */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><FileText className="size-4" /></div>
          <h2 className="text-sm font-bold">Regulatory Identifiers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('RBI Licence No.', 'rbiLicenceNo', 'CHG-FFMC-0403-2024')}
          {field('CIN', 'cin', 'U79120HR2023PTC112676')}
          {field('PAN', 'pan', 'ABLCS0715P')}
          {field('GSTIN', 'gstin', '06ABLCS0715P2ZX')}
        </div>
      </Card>

      {/* Invoice Number Format */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><FileText className="size-4" /></div>
          <h2 className="text-sm font-bold">Invoice Numbering</h2>
        </div>
        <div className="space-y-2">
          {INVOICE_FORMAT_PRESETS.map((p) => (
            <label key={p.value} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${profile.invoiceNumberFormat === p.value && !customFormat ? 'border-accent bg-accent/5' : 'border-border/60 hover:bg-muted/40'}`}>
              <div className="flex items-center gap-2">
                <input type="radio" name="invoiceFmt" checked={profile.invoiceNumberFormat === p.value && !customFormat}
                  onChange={() => { set('invoiceNumberFormat', p.value); setCustomFormat(false); }}
                  className="size-3.5 accent-[hsl(var(--accent))]" />
                <span className="text-xs font-medium">{p.label}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{p.preview}</span>
            </label>
          ))}
          <label className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${customFormat ? 'border-accent bg-accent/5' : 'border-border/60 hover:bg-muted/40'}`}>
            <input type="radio" name="invoiceFmt" checked={customFormat}
              onChange={() => setCustomFormat(true)}
              className="size-3.5 accent-[hsl(var(--accent))]" />
            <span className="text-xs font-medium">Custom format</span>
          </label>
          {customFormat && (
            <div className="ml-6 space-y-1">
              <Input
                placeholder="{PREFIX}/{SEQ} — tokens: {SEQ} {YY} {YYYY}"
                value={profile.invoiceNumberFormat}
                onChange={(e) => set('invoiceNumberFormat', e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Available tokens: <code>{'{SEQ}'}</code> <code>{'{YY}'}</code> <code>{'{YYYY}'}</code></p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/60 px-4 py-2.5 text-xs">
          <span className="text-muted-foreground">Next invoice number preview:</span>
          <span className="font-mono font-bold text-accent">{formatPreview}</span>
        </div>
        {field('Invoice Number Seed (last used sequence)', 'invoiceNumberSeed', '0', 'number')}
      </Card>

      {/* GST Defaults */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Percent className="size-4" /></div>
          <h2 className="text-sm font-bold">GST Defaults</h2>
          <span className="text-[10px] text-muted-foreground ml-1">(auto-applied on new invoices, editable per invoice)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {field('CGST %', 'defaultCgstRate', '9', 'number')}
          {field('SGST %', 'defaultSgstRate', '9', 'number')}
          {field('IGST %', 'defaultIgstRate', '18', 'number')}
          {field('GST Taxable Base %', 'defaultGstTaxableBasePct', '1', 'number')}
        </div>
        <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
          <strong>GST Taxable Base %</strong> — For FFMC/Money Changers, GST applies on a small percentage of the INR equivalent (typically <strong>1%</strong>). Example: if you sell EUR worth ₹33,750, the taxable base is ₹337.50 (1%), then CGST 9% = ₹30.38, SGST 9% = ₹30.38.
        </div>
        {field('Default SAC Code', 'defaultSacCode', '997157')}
      </Card>

      {/* Logo + Signature */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Upload className="size-4" /></div>
          <h2 className="text-sm font-bold">Logo & Signature</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Company Logo</label>
            {profile.logoBase64 && (
              <img src={profile.logoBase64} className="h-16 object-contain rounded-lg border border-border bg-muted/30 p-1" alt="logo" />
            )}
            <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full" onClick={() => logoRef.current?.click()}>
              <Upload className="size-3.5" /> {profile.logoBase64 ? 'Replace Logo' : 'Upload Logo'}
            </Button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload('logoBase64', f); }} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Authorised Signature</label>
            {profile.signatureBase64 && (
              <img src={profile.signatureBase64} className="h-16 object-contain rounded-lg border border-border bg-muted/30 p-1" alt="signature" />
            )}
            <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full" onClick={() => sigRef.current?.click()}>
              <Upload className="size-3.5" /> {profile.signatureBase64 ? 'Replace Signature' : 'Upload Signature'}
            </Button>
            <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload('signatureBase64', f); }} />
          </div>
        </div>
      </Card>

      {/* Disclaimers */}
      <Card padding="md" className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"><AlertCircle className="size-4" /></div>
          <h2 className="text-sm font-bold">Invoice Disclaimers</h2>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Disclaimer 1</label>
          <textarea
            rows={2}
            className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
            value={profile.disclaimer1}
            onChange={(e) => set('disclaimer1', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Disclaimer 2</label>
          <textarea
            rows={3}
            className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
            value={profile.disclaimer2}
            onChange={(e) => set('disclaimer2', e.target.value)}
          />
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3 pb-4">
        <Button onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
          {saving ? 'Saving...' : 'Save Business Profile'}
        </Button>
        {saved && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Profile saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}
