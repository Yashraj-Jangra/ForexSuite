'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';

type Customer = { id: string; name: string; email: string | null; country: string; createdAt: string };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('IN');

  async function load() {
    try {
      const res = await fetch('/api/trpc/customers.list', { credentials: 'include' });
      const json = await res.json();
      setCustomers(json?.result?.data?.data || []);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/trpc/customers.create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, country }),
    });
    setName(''); setEmail(''); setCountry('IN'); setShowForm(false);
    load();
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>Add customer</Button>
      </div>

      {showForm && (
        <Card padding="md" className="mb-6 max-w-md">
          <form onSubmit={handleCreate} className="space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
            <Button type="submit" size="sm">Save</Button>
          </form>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {customers.map((c) => (
          <Card key={c.id} padding="md">
            <p className="font-medium">{c.name}</p>
            {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
            <p className="text-xs text-muted-foreground mt-1">{c.country}</p>
          </Card>
        ))}
        {customers.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-10">No customers yet</p>
        )}
      </div>
    </Container>
  );
}