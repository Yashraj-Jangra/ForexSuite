'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';

type Vendor = { id: string; name: string; email: string | null; country: string; bankName: string | null; createdAt: string };

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('IN');
  const [bankName, setBankName] = useState('');

  async function load() {
    try {
      const res = await fetch('/api/trpc/vendors.list', { credentials: 'include' });
      const json = await res.json();
      setVendors(json?.result?.data?.data || []);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/trpc/vendors.create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, country, bankName }),
    });
    setName(''); setEmail(''); setCountry('IN'); setBankName(''); setShowForm(false);
    load();
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>Add vendor</Button>
      </div>

      {showForm && (
        <Card padding="md" className="mb-6 max-w-md">
          <form onSubmit={handleCreate} className="space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
            <Input label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <Button type="submit" size="sm">Save</Button>
          </form>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <Card key={v.id} padding="md">
            <p className="font-medium">{v.name}</p>
            {v.email && <p className="text-sm text-muted-foreground">{v.email}</p>}
            <p className="text-xs text-muted-foreground mt-1">{v.country}{v.bankName ? ` · ${v.bankName}` : ''}</p>
          </Card>
        ))}
        {vendors.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-10">No vendors yet</p>
        )}
      </div>
    </Container>
  );
}