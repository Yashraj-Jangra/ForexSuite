'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

type InvoiceDetail = {
  invoices: { id: string; invoiceNumber: string; currency: string; total: string; subtotal: string; taxAmount: string; status: string; notes: string | null; issuedAt: string; dueAt: string | null };
  customers: { name: string; email: string | null; address: string | null } | null;
  items: { id: string; description: string; quantity: string; unitPrice: string; amount: string }[];
};

const STATUS_ACTIONS = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/trpc/invoices.get?input=${encodeURIComponent(JSON.stringify(id))}`, { credentials: 'include' });
      const json = await res.json();
      setInvoice(json?.result?.data?.data || null);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: string) {
    await fetch('/api/trpc/invoices.updateStatus', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/trpc/pdf.download?input=${encodeURIComponent(JSON.stringify(id))}`, { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data?.data;
      if (data?.pdf) {
        const blob = new Uint8Array(atob(data.pdf).split('').map((c) => c.charCodeAt(0)));
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setDownloading(false);
  }

  if (!invoice) return <Container><p className="text-muted-foreground">Loading...</p></Container>;

  return (
    <Container size="sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoices.invoiceNumber}</h1>
          <p className="text-muted-foreground text-sm">{new Date(invoice.invoices.issuedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          {STATUS_ACTIONS.map((s) =>
            s !== invoice.invoices.status && (
              <Button key={s} variant="outline" size="sm" onClick={() => updateStatus(s)}>{s}</Button>
            ),
          )}
          <Button size="sm" onClick={downloadPdf} disabled={downloading}>
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <Card padding="md" className="mb-4">
        <h3 className="font-medium mb-1">{invoice.customers?.name ?? 'Unknown'}</h3>
        {invoice.customers?.email && <p className="text-sm text-muted-foreground">{invoice.customers.email}</p>}
        {invoice.customers?.address && <p className="text-sm text-muted-foreground">{invoice.customers.address}</p>}
      </Card>

      <Card padding="md">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left pb-3 font-medium">Item</th>
              <th className="text-center pb-3 font-medium">Qty</th>
              <th className="text-right pb-3 font-medium">Unit price</th>
              <th className="text-right pb-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">{Number(item.unitPrice).toLocaleString()}</td>
                <td className="py-3 text-right">{invoice.invoices.currency} {Number(item.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-4 pt-4 border-t border-border space-y-1">
          <p className="text-sm text-muted-foreground">Subtotal: {invoice.invoices.currency} {Number(invoice.invoices.subtotal).toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Tax: {invoice.invoices.currency} {Number(invoice.invoices.taxAmount).toLocaleString()}</p>
          <p className="text-lg font-bold">Total: {invoice.invoices.currency} {Number(invoice.invoices.total).toLocaleString()}</p>
        </div>
      </Card>

      {invoice.invoices.notes && (
        <Card padding="md" className="mt-4">
          <h3 className="text-sm font-medium mb-1">Notes</h3>
          <p className="text-sm text-muted-foreground">{invoice.invoices.notes}</p>
        </Card>
      )}
    </Container>
  );
}