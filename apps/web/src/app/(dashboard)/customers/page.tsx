'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Illustration } from '@/components/ui/illustration';
import {
  Users,
  Plus,
  Search,
  Mail,
  MapPin,
  Building2,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Save,
  RefreshCw,
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Create form state
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
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('INDIAN');
  const [gender, setGender] = useState('Ms.');
  const [defaultPurpose, setDefaultPurpose] = useState('PRIVATE VISIT');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [defaultDestinationCountry, setDefaultDestinationCountry] = useState('');

  // Edit Modal state
  const [editModal, setEditModal] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/customers.list', { credentials: 'include' });
      const json = await res.json();
      const data = Array.isArray(json?.result?.data) ? json.result.data : json?.result?.data?.data || [];
      setCustomers(data);
    } catch {
      /* ignore */
    }
    setLoading(false);
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
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setCity('');
        setState('');
        setPincode('');
        setGstin('');
        setPan('');
        setPassportNumber('');
        setNationality('INDIAN');
        setGender('Ms.');
        setDefaultPurpose('PRIVATE VISIT');
        setPlaceOfSupply('');
        setDefaultDestinationCountry('');
        setShowForm(false);
        showToast('Customer profile created successfully', true);
        await load();
      } else {
        showToast('Failed to create customer', false);
      }
    } catch {
      showToast('Network error', false);
    }
    setSubmitting(false);
  }

  function openEditModal(c: Customer) {
    setEditModal({ open: true, customer: c });
    setEditForm({ ...c });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal.customer) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/trpc/customers.update', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.customer.id,
          data: {
            name: editForm.name,
            email: editForm.email || undefined,
            phone: editForm.phone || undefined,
            address: editForm.address || undefined,
            city: editForm.city || undefined,
            state: editForm.state || undefined,
            country: editForm.country || 'IN',
            pincode: editForm.pincode || undefined,
            gstin: editForm.gstin || undefined,
            pan: editForm.pan ? editForm.pan.toUpperCase() : undefined,
            passportNumber: editForm.passportNumber || undefined,
            nationality: editForm.nationality || 'INDIAN',
            gender: editForm.gender || 'Ms.',
            defaultPurpose: editForm.defaultPurpose || undefined,
            placeOfSupply: editForm.placeOfSupply || undefined,
            defaultDestinationCountry: editForm.defaultDestinationCountry || undefined,
          },
        }),
      });
      if (res.ok) {
        showToast('Customer KYC profile updated', true);
        setEditModal({ open: false, customer: null });
        await load();
      } else {
        showToast('Failed to update customer', false);
      }
    } catch {
      showToast('Network error', false);
    }
    setSavingEdit(false);
  }

  async function handleDelete(c: Customer) {
    if (confirm(`Are you sure you want to remove customer "${c.name}"?`)) {
      try {
        const res = await fetch('/api/trpc/customers.delete', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(c.id),
        });
        if (res.ok) {
          showToast(`Customer "${c.name}" removed`, true);
          load();
        }
      } catch {
        showToast('Failed to delete customer', false);
      }
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      (c.pan || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.passportNumber || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Container className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-12 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-in slide-in-from-top-2 ${
            toast.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-6 text-accent" />
            Customers &amp; KYC Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage domestic &amp; foreign clients, KYC identity records, and auto-narrative profiles.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
          <Plus className="size-4" />
          {showForm ? 'Cancel' : 'Add Customer'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, country, PAN, or passport number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <Card padding="lg" className="border-accent/40 bg-accent/5">
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">New Client &amp; KYC Registration</h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Input
                label="Full Legal Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Johnathan Doe"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Country *</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2"
                >
                  <option value="IN">India (IN)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="AU">Australia (AU)</option>
                </select>
              </div>
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
              <Input
                label="PAN"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="ABCDE1234F"
                className="font-mono"
              />
              <Input
                label="GSTIN (if corporate)"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="06ABCDE1234F1Z5"
                className="font-mono"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
              />
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
              <Input
                label="State / Province"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
              />
            </div>

            {/* KYC Section */}
            <div className="border-t border-border pt-3">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">KYC</span>
                Identity Details — saved for auto-fill on Cash Memo invoices
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Gender (for narrative)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2"
                  >
                    <option value="Ms.">Ms.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="M/s.">M/s.</option>
                  </select>
                </div>
                <Input
                  label="Passport Number"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                  className="font-mono"
                  placeholder="e.g. Z1234567"
                />
                <Input
                  label="Nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value.toUpperCase())}
                  placeholder="e.g. INDIAN"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Default Purpose
                  </label>
                  <select
                    value={defaultPurpose}
                    onChange={(e) => setDefaultPurpose(e.target.value)}
                    className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2"
                  >
                    {[
                      'PRIVATE VISIT',
                      'BUSINESS',
                      'EDUCATION',
                      'MEDICAL TREATMENT',
                      'EMPLOYMENT',
                      'EMIGRATION',
                      'OTHERS',
                    ].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Place of Supply (e.g. (06) HARYANA)"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  placeholder="(06) HARYANA"
                />
                <Input
                  label="Default Destination Country"
                  value={defaultDestinationCountry}
                  onChange={(e) => setDefaultDestinationCountry(e.target.value.toUpperCase())}
                  placeholder="e.g. USA"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Customer Profile'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Customers Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((c) => (
          <Card key={c.id} padding="md" className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm text-foreground">{c.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
                    {c.country}
                  </span>
                </div>
                <Building2 className="size-4 text-muted-foreground/60" />
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                {c.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3 text-accent shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.phone}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {c.address}
                      {c.city ? `, ${c.city}` : ''}
                    </span>
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
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {c.defaultPurpose}
                  </span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-border/50 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditModal(c)}
                className="h-7 px-2.5 text-[11px] gap-1"
              >
                <Edit2 className="size-3" />
                <span>Edit Profile</span>
              </Button>
              <button
                onClick={() => handleDelete(c)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove Customer"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </Card>
        ))}

        {filteredCustomers.length === 0 && !loading && (
          <Card padding="lg" className="col-span-full py-12 text-center text-muted-foreground space-y-3">
            <Illustration name="customers" size="md" className="mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">No client profiles found</p>
              <p className="text-xs mt-1 text-muted-foreground">Register foreign or domestic clients to start generating compliant Cash Memos.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Customer Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-xl w-full rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="size-4 text-accent" />
                <h2 className="text-sm font-bold text-foreground">Edit Customer &amp; KYC Profile</h2>
              </div>
              <button
                onClick={() => setEditModal({ open: false, customer: null })}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  label="Full Legal Name *"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <Input
                  label="PAN"
                  value={editForm.pan || ''}
                  onChange={(e) => setEditForm({ ...editForm, pan: e.target.value.toUpperCase() })}
                  maxLength={10}
                  className="font-mono"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <Input
                  label="Address"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
                <Input
                  label="City"
                  value={editForm.city || ''}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
                <Input
                  label="State"
                  value={editForm.state || ''}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                />
              </div>

              {/* KYC Fields */}
              <div className="border-t border-border pt-3 space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">KYC</span>
                  Foreign Exchange Narrative Auto-Fill
                </p>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Gender</label>
                    <select
                      value={editForm.gender || 'Ms.'}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2"
                    >
                      <option value="Ms.">Ms.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="M/s.">M/s.</option>
                    </select>
                  </div>
                  <Input
                    label="Passport Number"
                    value={editForm.passportNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, passportNumber: e.target.value.toUpperCase() })}
                    className="font-mono"
                  />
                  <Input
                    label="Nationality"
                    value={editForm.nationality || 'INDIAN'}
                    onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Default Purpose
                    </label>
                    <select
                      value={editForm.defaultPurpose || 'PRIVATE VISIT'}
                      onChange={(e) => setEditForm({ ...editForm, defaultPurpose: e.target.value })}
                      className="w-full h-9 rounded-xl border border-input bg-background text-xs px-2"
                    >
                      {[
                        'PRIVATE VISIT',
                        'BUSINESS',
                        'EDUCATION',
                        'MEDICAL TREATMENT',
                        'EMPLOYMENT',
                        'EMIGRATION',
                        'OTHERS',
                      ].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Default Destination Country"
                    value={editForm.defaultDestinationCountry || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, defaultDestinationCountry: e.target.value.toUpperCase() })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModal({ open: false, customer: null })}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingEdit} className="gap-1">
                  {savingEdit ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  );
}