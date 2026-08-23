'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';

type Lut = { id: string; referenceNumber: string; issuedDate: string; expiryDate: string; issuingAuthority: string; isActive: boolean };

export default function LutPage() {
  const [luts, setLuts] = useState<Lut[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');

  async function load() {
    try {
      const res = await fetch('/api/trpc/luts.list', { credentials: 'include' });
      const json = await res.json();
      setLuts(json?.result?.data?.data || []);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/trpc/luts.create', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceNumber, issuedDate, expiryDate, issuingAuthority }),
    });
    setReferenceNumber(''); setIssuedDate(''); setExpiryDate(''); setIssuingAuthority(''); setShowForm(false);
    load();
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">LUT Registry</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>Add LUT</Button>
      </div>

      {showForm && (
        <Card padding="md" className="mb-6 max-w-lg">
          <form onSubmit={handleCreate} className="space-y-3">
            <Input label="Reference number" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} required />
            <Input label="Issuing authority" value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} required />
            <div className="flex gap-3">
              <Input label="Issued date" type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} required />
              <Input label="Expiry date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
            </div>
            <Button type="submit" size="sm">Save LUT</Button>
          </form>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {luts.map((l) => (
          <Card key={l.id} padding="md">
            <div className="flex justify-between items-start">
              <p className="font-medium">{l.referenceNumber}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${l.isActive ? 'bg-green-400/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {l.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{l.issuingAuthority}</p>
            <p className="text-xs text-muted-foreground mt-1">Expires: {l.expiryDate}</p>
          </Card>
        ))}
        {luts.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No LUTs registered</p>}
      </div>
    </Container>
  );
}