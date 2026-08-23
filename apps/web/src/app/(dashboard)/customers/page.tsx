'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Users, Plus, Search, Mail, Globe, MapPin, Building, Phone } from 'lucide-react';

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  gstin: string | null;
  pan: string | null;
  // KYC
  passportNumber: string | null;
  nationality: string | null;
  gender: string | null;
  defaultPurpose: string | null;
  placeOfSupply: string | null;
  defaultDestinationCountry: string | null;
  createdAt: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('IN');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  // KYC
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('INDIAN');
  const [gender, setGender] = useState('Ms.');
  const [defaultPurpose, setDefaultPurpose] = useState('PRIVATE VISIT');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [defaultDestinationCountry, setDefaultDestinationCountry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/trpc/customers.list', { credentials: 'include' });
      const json = await res.json();
      const data = Array.isArray(json?.result?.data) ? json.result.data : (json?.result?.data?.data || []);
      setCustomers(data);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/trpc/customers.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
          country,
          gstin: gstin || undefined,
          pan: pan ? pan.toUpperCase() : undefined,
          passportNumber: passportNumber || undefined,
          nationality: nationality || 'INDIAN',
          gender: gender || 'Ms.',
          defaultPurpose: defaultPurpose || undefined,
          placeOfSupply: placeOfSupply || undefined,
          defaultDestinationCountry: defaultDestinationCountry || undefined,
        }),
      });
      if (res.ok) {
        setName(''); setEmail(''); setPhone(''); setAddress('');
        setCity(''); setState(''); setPincode('');
        setGstin(''); setPan(''); setPassportNumber(''); setNationality('INDIAN');
        setGender('Ms.'); setDefaultPurpose('PRIVATE VISIT');
        setPlaceOfSupply(''); setDefaultDestinationCountry('');
        setShowForm(false);
        await load();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }


  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Customer Directory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overseas clients, domestic buyers, and tax identifier registry.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>Add Customer</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs"
        />
      </div>

      {/* Add Customer Modal */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-card/90 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Building className="size-4 text-accent" />
              <span>Register New Customer</span>
            </h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Full Name *" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Country *</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm">
                  <option value="IN">India (IN)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="AU">Australia (AU)</option>
                  <option value="NL">Netherlands (NL)</option>
                  <option value="FR">France (FR)</option>
                </select>
              </div>
              <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="PAN" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} className="font-mono" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
              <Input label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              <Input label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} />
            </div>

            {/* KYC Section */}
            <div className="border-t border-border pt-3">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">KYC</span>
                Identity Details — saved for auto-fill on Cash Memo invoices
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Gender (for narrative)</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)}
                    className="w-full h-8 rounded-xl border border-input bg-background text-xs px-2">
                    <option value="Ms.">Ms.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="M/s.">M/s.</option>
                  </select>
                </div>
                <Input label="Passport Number" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value.toUpperCase())} className="font-mono" />
                <Input label="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value.toUpperCase())} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Default Purpose</label>
                  <select value={defaultPurpose} onChange={(e) => setDefaultPurpose(e.target.value)}
                    className="w-full h-8 rounded-xl border border-input bg-background text-xs px-2">
                    {['PRIVATE VISIT','BUSINESS','EDUCATION','MEDICAL TREATMENT','EMPLOYMENT','EMIGRATION','OTHERS'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <Input label="Place of Supply (e.g. (06) HARYANA)" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />
                <Input label="Default Destination Country" value={defaultDestinationCountry} onChange={(e) => setDefaultDestinationCountry(e.target.value.toUpperCase())} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Saving...' : 'Save Customer'}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Customers Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((c) => (
          <Card key={c.id} padding="md" className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm text-foreground">{c.name}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
                  {c.country}
                </span>
              </div>
              <Building className="size-4 text-muted-foreground/60" />
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
              {c.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3 text-accent shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}
              {c.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{c.address}{c.city ? `, ${c.city}` : ''}</span>
                </div>
              )}
              {c.pan && (
                <div className="text-[11px] font-mono">
                  PAN: <strong className="text-foreground">{c.pan}</strong>
                </div>
              )}
              {c.passportNumber && (
                <div className="text-[11px] font-mono">
                  Passport: <strong className="text-foreground">{c.passportNumber}</strong>
                  {c.nationality && <span className="ml-1 text-muted-foreground">({c.nationality})</span>}
                </div>
              )}
              {c.gstin && (
                <div className="text-[11px] font-mono text-muted-foreground">
                  GSTIN: <strong className="text-foreground">{c.gstin}</strong>
                </div>
              )}
              {c.defaultPurpose && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{c.defaultPurpose}</span>
              )}
            </div>
          </Card>
        ))}

        {filteredCustomers.length === 0 && (
          <Card padding="lg" className="col-span-full py-12 text-center text-muted-foreground space-y-2">
            <Users className="size-8 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No customers found</p>
            <p className="text-xs">Add foreign or domestic clients to start creating multi-currency invoices.</p>
          </Card>
        )}
      </div>
    </Container>
  );
}