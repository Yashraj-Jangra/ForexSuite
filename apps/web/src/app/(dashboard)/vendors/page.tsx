'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Building2, Plus, Search, Mail, Landmark, CreditCard } from 'lucide-react';

type Vendor = {
  id: string;
  name: string;
  email: string | null;
  country: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankSwiftBic: string | null;
  createdAt: string;
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('US');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankSwiftBic, setBankSwiftBic] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/trpc/vendors.list', { credentials: 'include' });
      const json = await res.json();
      const data = Array.isArray(json?.result?.data) ? json.result.data : (json?.result?.data?.data || []);
      setVendors(data);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/trpc/vendors.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          country,
          bankName: bankName || undefined,
          bankAccountNumber: bankAccountNumber || undefined,
          bankSwift: bankSwiftBic || undefined,
        }),
      });
      if (res.ok) {
        setName('');
        setEmail('');
        setBankName('');
        setBankAccountNumber('');
        setBankSwiftBic('');
        setShowForm(false);
        await load();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }


  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.bankName || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vendor & Beneficiary Directory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Foreign and domestic vendors with SWIFT/BIC and banking remittance profiles.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>Add Vendor</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by vendor or bank..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs"
        />
      </div>

      {/* Add Vendor Form */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-card/90 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Building2 className="size-4 text-accent" />
              <span>Register Vendor & Remittance Details</span>
            </h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input label="Vendor / Beneficiary Name *" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Country *</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="IN">India (IN)</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Input label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Chase / HSBC / Barclays" />
              <Input label="Account / IBAN Number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
              <Input label="SWIFT / BIC Code" value={bankSwiftBic} onChange={(e) => setBankSwiftBic(e.target.value.toUpperCase())} placeholder="CHASUS33" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Vendor'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Vendors Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.map((v) => (
          <Card key={v.id} padding="md" className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm text-foreground">{v.name}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
                  {v.country}
                </span>
              </div>
              <Building2 className="size-4 text-muted-foreground/60" />
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
              {v.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3 text-accent shrink-0" />
                  <span className="truncate">{v.email}</span>
                </div>
              )}
              {v.bankName && (
                <div className="flex items-center gap-1.5">
                  <Landmark className="size-3 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground truncate">{v.bankName}</span>
                </div>
              )}
              {v.bankSwiftBic && (
                <div className="text-[11px] font-mono text-muted-foreground">
                  SWIFT: <strong className="text-foreground">{v.bankSwiftBic}</strong>
                </div>
              )}
            </div>
          </Card>
        ))}

        {filteredVendors.length === 0 && (
          <Card padding="lg" className="col-span-full py-12 text-center text-muted-foreground space-y-2">
            <Building2 className="size-8 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No vendors found</p>
            <p className="text-xs">Add overseas or local suppliers to streamline remittance compliance.</p>
          </Card>
        )}
      </div>
    </Container>
  );
}