'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  ScrollText,
  Building,
  Check,
} from 'lucide-react';

type Customer = { id: string; name: string; country: string; gstin?: string | null };

type ItemRow = {
  description: string;
  hsnCode: string;
  gstRate: number;
  quantity: number;
  unitPrice: number;
};

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState<string>('86.85');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isExport, setIsExport] = useState(false);
  const [activeLut, setActiveLut] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Quick customer modal state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCountry, setNewCustCountry] = useState('US');

  const [items, setItems] = useState<ItemRow[]>([
    { description: 'Software Development & Consulting Services', hsnCode: '998314', gstRate: 18, quantity: 1, unitPrice: 1500 },
  ]);

  async function loadInitialData() {
    try {
      const [custRes, lutRes] = await Promise.all([
        fetch('/api/trpc/customers.list', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/trpc/luts.active', { credentials: 'include' }).then((r) => r.json()),
      ]);

      const custList = Array.isArray(custRes?.result?.data) ? custRes.result.data : (custRes?.result?.data?.data || []);
      setCustomers(custList);
      if (custList.length > 0) setCustomerId(custList[0].id);

      const lutList = Array.isArray(lutRes?.result?.data) ? lutRes.result.data : (lutRes?.result?.data?.data || []);
      if (lutList.length > 0) setActiveLut(lutList[0]);
    } catch { /* ignore */ }
  }


  useEffect(() => {
    loadInitialData();
  }, []);

  // Update exchange rate preview when currency changes
  useEffect(() => {
    if (currency === 'INR') {
      setExchangeRate('1');
      return;
    }
    fetch(`/api/trpc/rates.convert?input=${encodeURIComponent(JSON.stringify({ from: currency, to: 'INR', amount: 1 }))}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.result?.data?.rate) {
          setExchangeRate(String(j.result.data.rate));
        }
      })
      .catch(() => {});
  }, [currency]);

  // Handle Export toggle
  function handleExportToggle(checked: boolean) {
    setIsExport(checked);
    if (checked) {
      // Zero-rate GST for export with LUT
      setItems(items.map((i) => ({ ...i, gstRate: 0 })));
      if (activeLut) {
        setNotes(`SUPPLY MEANT FOR EXPORT UNDER LETTER OF UNDERTAKING (LUT: ${activeLut.referenceNumber}) WITHOUT PAYMENT OF INTEGRATED TAX.`);
      }
    } else {
      setItems(items.map((i) => ({ ...i, gstRate: 18 })));
      setNotes('');
    }
  }

  function addItem() {
    setItems([...items, { description: '', hsnCode: '998314', gstRate: isExport ? 0 : 18, quantity: 1, unitPrice: 0 }]);
  }

  function updateItem(i: number, field: keyof ItemRow, value: any) {
    const copy = [...items];
    copy[i] = { ...copy[i]!, [field]: value };
    setItems(copy);
  }

  function removeItem(i: number) {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== i));
    }
  }

  // Calculations
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const taxAmount = isExport
    ? 0
    : items.reduce((s, i) => {
        const lineTotal = (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0);
        return s + (lineTotal * (Number(i.gstRate) || 0)) / 100;
      }, 0);
  const total = subtotal + taxAmount;
  const inrEquivalent = Math.round(total * Number(exchangeRate || 1) * 100) / 100;

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/trpc/customers.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustName, email: newCustEmail || undefined, country: newCustCountry }),
      });
      const json = await res.json();
      const created = json?.result?.data;
      if (created) {
        setCustomers([...customers, created]);
        setCustomerId(created.id);
        setShowAddCustomer(false);
        setNewCustName('');
        setNewCustEmail('');
      }
    } catch { /* ignore */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/trpc/invoices.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          currency,
          exchangeRate: Number(exchangeRate) || undefined,
          dueAt: dueAt || undefined,
          isExport,
          notes: notes || undefined,
          items: items
            .filter((i) => i.description.trim())
            .map((i) => ({
              description: i.description,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unitPrice),
              hsnCode: i.hsnCode || undefined,
              gstRate: isExport ? 0 : Number(i.gstRate),
            })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message || 'Failed to create invoice');
        setSubmitting(false);
        return;
      }

      router.push('/invoices');
    } catch {
      setError('Failed to connect to server');
      setSubmitting(false);
    }
  }

  return (
    <Container size="md" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-sm text-muted-foreground">Draft an export or domestic multi-currency invoice.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Invoice Meta */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Building className="size-4 text-accent" />
              <span>Customer & Currency</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="text-xs text-accent hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="size-3.5" />
              <span>New Customer</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-semibold font-mono"
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>AED</option>
                  <option>SGD</option>
                  <option>INR</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          {/* Export Mode / LUT Switch */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExport}
                  onChange={(e) => handleExportToggle(e.target.checked)}
                  className="size-4 accent-[hsl(var(--accent))] rounded"
                />
                <span>Export Invoice (Zero-Rated GST under LUT)</span>
              </label>
              <p className="text-xs text-muted-foreground pl-6">
                {activeLut
                  ? `Active LUT registered: ${activeLut.referenceNumber} (Exp: ${activeLut.expiryDate})`
                  : 'Zero-rates IGST for foreign clients. Register LUT in Compliance > LUT Registry.'}
              </p>
            </div>

            {currency !== 'INR' && (
              <div className="text-xs text-right sm:border-l sm:border-border sm:pl-4">
                <span className="text-muted-foreground">Exchange Rate:</span>
                <p className="font-mono font-bold text-accent">1 {currency} = ₹{exchangeRate}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Line Items */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm font-semibold">Line Items</h2>
              <p className="text-xs text-muted-foreground">Itemized services or goods with HSN codes</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs">
              <Plus className="size-3.5" />
              <span>Add Item</span>
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <input
                      placeholder="Service or product description..."
                      value={item.description}
                      onChange={(e) => updateItem(i, 'description', e.target.value)}
                      required
                      className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length <= 1}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">HSN/SAC</span>
                    <input
                      placeholder="998314"
                      value={item.hsnCode}
                      onChange={(e) => updateItem(i, 'hsnCode', e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Qty</span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                      className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-center font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Unit Price ({currency})</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                      className="w-full h-8 px-2.5 rounded-lg border border-input bg-background font-mono text-xs"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Row Total</span>
                    <div className="h-8 px-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-center font-mono font-bold">
                      {currency} {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes / Statutory Declaration</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, or export declaration..."
              className="w-full p-2.5 rounded-lg border border-input bg-background text-xs leading-relaxed"
            />
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono">{currency} {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST Tax ({isExport ? '0% Export LUT' : '18% Domestic'}):</span>
              <span className="font-mono">{currency} {taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/70 text-foreground">
              <span>Grand Total:</span>
              <span className="font-mono text-accent">{currency} {total.toLocaleString()}</span>
            </div>
            {currency !== 'INR' && (
              <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                <span>Equivalent in INR (approx):</span>
                <span className="font-mono font-semibold">₹{inrEquivalent.toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting} className="gap-1.5 shadow-sm">
            <span>{submitting ? 'Generating Invoice...' : 'Create Invoice'}</span>
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/invoices')}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Quick Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card padding="lg" className="w-full max-w-md space-y-4">
            <h3 className="text-base font-bold">Add Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <Input
                label="Customer / Business Name *"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
              />
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Country *</label>
                <select
                  value={newCustCountry}
                  onChange={(e) => setNewCustCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="IN">India (IN)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCustomer(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Customer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Container>
  );
}