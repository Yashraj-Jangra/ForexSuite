'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Illustration } from '@/components/ui/illustration';
import {
  FileText,
  Plus,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

type Invoice = {
  invoices: {
    id: string;
    invoiceNumber: string;
    currency: string;
    total: string;
    status: string;
    issuedAt: string;
    isExport: boolean | null;
    customerId: string | null;
  };
  customers: { name: string; email: string | null } | null;
};

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  overdue: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};


export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/invoices.list', { credentials: 'include' });
      const json = await res.json();
      const data = Array.isArray(json?.result?.data) ? json.result.data : (json?.result?.data?.data || []);
      setInvoices(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDownload(e: React.MouseEvent, id: string, invoiceNumber: string) {
    e.stopPropagation();
    setDownloadingId(id);
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
        a.download = data.filename || `${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
    setDownloadingId(null);
  }


  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoices.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customers?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.invoices.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = invoices.reduce((s, i) => s + Number(i.invoices.total || 0), 0);
  const paidCount = invoices.filter((i) => i.invoices.status === 'paid').length;
  const pendingCount = invoices.filter((i) => i.invoices.status === 'draft' || i.invoices.status === 'sent').length;

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage multi-currency export and domestic invoices.
          </p>
        </div>
        <Button size="sm" onClick={() => router.push('/invoices/new')} className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>New invoice</span>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md" className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Invoices</p>
            <p className="text-xl font-bold mt-0.5">{invoices.length}</p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Paid Invoices</p>
            <p className="text-xl font-bold mt-0.5 text-green-400">{paidCount}</p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Pending Invoices</p>
            <p className="text-xl font-bold mt-0.5 text-amber-400">{pendingCount}</p>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border text-left">
                <th className="pb-3 font-semibold">Invoice #</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.invoices.id}
                  onClick={() => router.push(`/invoices/${inv.invoices.id}`)}
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 font-mono font-bold text-foreground flex items-center gap-1.5">
                    <span>{inv.invoices.invoiceNumber}</span>
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-foreground">{inv.customers?.name || 'Walk-in Customer'}</p>
                    {inv.customers?.email && <p className="text-[11px] text-muted-foreground">{inv.customers.email}</p>}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inv.invoices.isExport
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {inv.invoices.isExport ? 'Export (LUT)' : 'Domestic'}
                    </span>
                  </td>
                  <td className="py-3 font-semibold font-mono">
                    {inv.invoices.currency} {Number(inv.invoices.total).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        STATUS_BADGES[inv.invoices.status] || ''
                      }`}
                    >
                      {inv.invoices.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(inv.invoices.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="Download PDF"
                        disabled={downloadingId === inv.invoices.id}
                        onClick={(e) => handleDownload(e, inv.invoices.id, inv.invoices.invoiceNumber)}
                        className="p-1.5 rounded-lg border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/invoices/${inv.invoices.id}`)}
                        className="h-7 px-2 text-[11px]"
                      >
                        Open
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Illustration name="documentReady" size="md" className="mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No invoices found</p>
                    <p className="text-xs mt-1 text-muted-foreground">Try adjusting your filters or generate a new Cash Memo.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
}