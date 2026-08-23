'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Send,
  XCircle,
  FileText,
  Calendar,
  Building,
  ScrollText,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

type InvoiceDetail = {
  invoices: {
    id: string;
    invoiceNumber: string;
    currency: string;
    exchangeRate: string | null;
    total: string;
    subtotal: string;
    taxAmount: string;
    status: string;
    notes: string | null;
    isExport: boolean | null;
    lutNumber: string | null;
    issuedAt: string;
    dueAt: string | null;
  };
  customers: {
    name: string;
    email: string | null;
    address: string | null;
    country: string;
    gstin: string | null;
  } | null;
  items: { id: string; description: string; hsnCode: string | null; gstRate: string | null; quantity: string; unitPrice: string; amount: string }[];
};

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  overdue: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};


export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/trpc/invoices.get?input=${encodeURIComponent(JSON.stringify(id))}`, { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data?.invoices ? json.result.data : (json?.result?.data?.data || null);
      setInvoice(data);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(status: string) {
    setUpdating(true);
    await fetch('/api/trpc/invoices.updateStatus', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await load();
    setUpdating(false);
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/trpc/pdf.download?input=${encodeURIComponent(JSON.stringify(id))}`, { credentials: 'include' });
      const json = await res.json();
      const data = json?.result?.data?.pdf ? json.result.data : json?.result?.data?.data;
      if (data?.pdf) {
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || `${invoice?.invoices.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setDownloading(false);
  }


  if (!invoice) {
    return (
      <Container size="md" className="py-12 text-center text-muted-foreground space-y-2">
        <FileText className="size-8 mx-auto animate-pulse" />
        <p className="text-sm">Loading invoice details...</p>
      </Container>
    );
  }

  const { invoices: inv, customers: cust, items } = invoice;

  return (
    <Container size="md" className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono tracking-tight">{inv.invoiceNumber}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_BADGES[inv.status] || ''}`}>
                {inv.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Issued on {new Date(inv.issuedAt).toLocaleDateString()}
              {inv.dueAt && ` · Due ${new Date(inv.dueAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {inv.status !== 'sent' && inv.status !== 'paid' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus('sent')} disabled={updating} className="gap-1.5 text-xs">
              <Send className="size-3.5" />
              <span>Mark Sent</span>
            </Button>
          )}

          {inv.status !== 'paid' && (
            <Button size="sm" onClick={() => updateStatus('paid')} disabled={updating} className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="size-3.5" />
              <span>Mark Paid</span>
            </Button>
          )}

          {inv.status !== 'cancelled' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus('cancelled')} disabled={updating} className="gap-1.5 text-xs text-red-400 hover:text-red-300">
              <XCircle className="size-3.5" />
              <span>Cancel</span>
            </Button>
          )}

          <Button size="sm" onClick={downloadPdf} disabled={downloading} className="gap-1.5 text-xs shadow-sm">
            <Download className="size-3.5" />
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Export LUT Compliance Banner if Export */}
      {inv.isExport && (
        <Card padding="md" className="border-purple-500/30 bg-purple-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="size-4" />
            <span>FEMA Export Invoice (Zero-Rated GST)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Supplied under Letter of Undertaking {inv.lutNumber ? `(${inv.lutNumber})` : '(LUT Active)'} without payment of IGST. Subject to 270-day export realization monitoring.
          </p>
        </Card>
      )}

      {/* Formal Document Sheet */}
      <Card padding="lg" className="border-border/80 space-y-8 bg-card/90">
        {/* Header: Business & Customer Details */}
        <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-border">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Billed To</span>
            <p className="text-base font-bold text-foreground">{cust?.name || 'Walk-in Customer'}</p>
            {cust?.email && <p className="text-xs text-muted-foreground">{cust.email}</p>}
            {cust?.address && <p className="text-xs text-muted-foreground whitespace-pre-line">{cust.address}</p>}
            {cust?.country && <p className="text-xs font-medium text-foreground">{cust.country}</p>}
            {cust?.gstin && <p className="text-xs font-mono text-muted-foreground">GSTIN: {cust.gstin}</p>}
          </div>

          <div className="sm:text-right space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Invoice Summary</span>
            <p className="text-xs text-muted-foreground">Invoice #: <strong className="text-foreground font-mono">{inv.invoiceNumber}</strong></p>
            <p className="text-xs text-muted-foreground">Issue Date: <strong className="text-foreground">{new Date(inv.issuedAt).toLocaleDateString()}</strong></p>
            {inv.dueAt && (
              <p className="text-xs text-muted-foreground">Due Date: <strong className="text-foreground">{new Date(inv.dueAt).toLocaleDateString()}</strong></p>
            )}
            <p className="text-xs text-muted-foreground">Currency: <strong className="text-foreground font-mono">{inv.currency}</strong></p>
            {inv.exchangeRate && inv.currency !== 'INR' && (
              <p className="text-xs text-muted-foreground font-mono">1 {inv.currency} = ₹{inv.exchangeRate}</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border text-left">
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold text-center">HSN/SAC</th>
                <th className="pb-3 font-semibold text-center">Qty</th>
                <th className="pb-3 font-semibold text-right">Unit Price</th>
                <th className="pb-3 font-semibold text-right">Amount ({inv.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 font-medium text-foreground">{item.description}</td>
                  <td className="py-3.5 text-center font-mono text-muted-foreground">{item.hsnCode || '—'}</td>
                  <td className="py-3.5 text-center font-mono">{item.quantity}</td>
                  <td className="py-3.5 text-right font-mono">{Number(item.unitPrice).toLocaleString()}</td>
                  <td className="py-3.5 text-right font-mono font-bold">{Number(item.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Breakdown */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-start pt-4 border-t border-border gap-4">
          <div className="max-w-xs space-y-1">
            {inv.notes ? (
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Notes & Terms</span>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{inv.notes}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No additional notes attached.</p>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono">{inv.currency} {Number(inv.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (GST):</span>
              <span className="font-mono">{inv.currency} {Number(inv.taxAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border text-foreground">
              <span>Total:</span>
              <span className="font-mono text-accent">{inv.currency} {Number(inv.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Card>
    </Container>
  );
}