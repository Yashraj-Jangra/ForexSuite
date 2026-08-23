'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';

type Customer = { id: string; name: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dueAt, setDueAt] = useState('');
  const [isExport, setIsExport] = useState(false);
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);

  useEffect(() => {
    fetch('/api/trpc/customers.list', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => setCustomers(j?.result?.data?.data || []))
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  function updateItem(i: number, field: string, value: string | number) {
    const copy = [...items];
    (copy[i] as Record<string, unknown>)[field] = value;
    setItems(copy);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/trpc/invoices.create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        currency,
        dueAt: dueAt || undefined,
        isExport,
        items: items.filter((i) => i.description),
      }),
    });
    if (res.ok) router.push('/invoices');
  }

  return (
    <Container size="sm">
      <h1 className="text-2xl font-bold mb-6">New invoice</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="md" className="space-y-4">
          <h3 className="font-medium">Details</h3>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
          >
            <option value="">Select customer...</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-24 h-10 px-3 rounded-lg border border-input bg-background text-sm"
            >
              <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option>
            </select>
            <Input type="date" label="Due date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isExport} onChange={(e) => setIsExport(e.target.checked)} className="accent-[hsl(var(--accent))]" />
            Export invoice (zero-rated GST with LUT)
          </label>
        </Card>

        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add row</Button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-end">
              <input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(i, 'description', e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm"
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                className="w-20 h-10 px-3 rounded-lg border border-input bg-background text-sm text-center"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={item.unitPrice}
                onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                className="w-28 h-10 px-3 rounded-lg border border-input bg-background text-sm"
              />
              <span className="text-sm text-muted-foreground w-20 text-right">{item.quantity * item.unitPrice}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} className="text-red-400 text-sm hover:text-red-300">✕</button>
              )}
            </div>
          ))}

          <div className="text-right text-lg font-bold pt-2 border-t border-border">
            Total: {currency} {subtotal.toLocaleString()}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit">Create invoice</Button>
          <Button type="button" variant="outline" onClick={() => router.push('/invoices')}>Cancel</Button>
        </div>
      </form>
    </Container>
  );
}