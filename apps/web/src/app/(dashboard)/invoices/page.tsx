'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

type Invoice = {
  invoices: { id: string; invoiceNumber: string; currency: string; total: string; status: string; issuedAt: string; customerId: string | null };
  customers: { name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-yellow-400 bg-yellow-400/10',
  sent: 'text-blue-400 bg-blue-400/10',
  paid: 'text-green-400 bg-green-400/10',
  overdue: 'text-red-400 bg-red-400/10',
  cancelled: 'text-muted-foreground bg-muted',
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  async function load() {
    try {
      const res = await fetch('/api/trpc/invoices.list', { credentials: 'include' });
      const json = await res.json();
      setInvoices(json?.result?.data?.data || []);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, []);

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button size="sm" onClick={() => router.push('/invoices/new')}>New invoice</Button>
      </div>

      <Card padding="md">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left pb-3 font-medium">#</th>
              <th className="text-left pb-3 font-medium">Customer</th>
              <th className="text-left pb-3 font-medium">Amount</th>
              <th className="text-left pb-3 font-medium">Status</th>
              <th className="text-left pb-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.invoices.id}
                className="border-b border-border/50 hover:bg-accent/5 cursor-pointer transition-colors"
                onClick={() => router.push(`/invoices/${inv.invoices.id}`)}
              >
                <td className="py-3 font-medium">{inv.invoices.invoiceNumber}</td>
                <td className="py-3">{inv.customers?.name ?? '-'}</td>
                <td className="py-3">{inv.invoices.currency} {Number(inv.invoices.total).toLocaleString()}</td>
                <td className="py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.invoices.status] ?? ''}`}>
                    {inv.invoices.status}
                  </span>
                </td>
                <td className="py-3 text-muted-foreground">{new Date(inv.invoices.issuedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No invoices yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </Container>
  );
}