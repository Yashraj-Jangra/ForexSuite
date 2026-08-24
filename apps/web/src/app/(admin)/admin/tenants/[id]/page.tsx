'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  FileText,
  Landmark,
  FileCheck2,
  ArrowLeft,
  Zap,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Save,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

type TenantDetail = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: 'active' | 'suspended' | 'deleted';
    plan: string;
    planExpiresAt: string | null;
    notes: string | null;
    suspendedAt: string | null;
    suspendedReason: string | null;
    createdAt: string;
    updatedAt: string;
  };
  members: {
    id: string;
    role: string;
    joinedAt: string;
    userId: string;
    userName: string;
    userEmail: string;
    isSuperAdmin: boolean;
    banned: boolean;
  }[];
  stats: {
    invoicesCount: number;
    customersCount: number;
    fircsCount: number;
    edfCount: number;
    businessProfile: any;
  };
};

export default function AdminTenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'invoices' | 'customers' | 'fircs' | 'edf'>('profile');
  const [peekRecords, setPeekRecords] = useState<any[]>([]);
  const [loadingPeek, setLoadingPeek] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadTenant() {
    setLoading(true);
    try {
      const res = await fetch(`/api/trpc/admin.tenants.get?input=${encodeURIComponent(JSON.stringify({ id }))}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (json?.result?.data) {
        setData(json.result.data);
        setNote(json.result.data.tenant.notes || '');
      }
    } catch (err) {
      console.error('Failed to load tenant:', err);
    }
    setLoading(false);
  }

  async function loadPeekRecords(type: 'invoices' | 'customers' | 'fircs' | 'edf' | 'profile') {
    if (type === 'profile') return;
    setLoadingPeek(true);
    try {
      const res = await fetch(
        `/api/trpc/admin.tenants.peekRecords?input=${encodeURIComponent(
          JSON.stringify({ tenantId: id, recordType: type, limit: 20 }),
        )}`,
        { credentials: 'include' },
      );
      const json = await res.json();
      if (json?.result?.data) {
        setPeekRecords(Array.isArray(json.result.data) ? json.result.data : []);
      }
    } catch {
      setPeekRecords([]);
    }
    setLoadingPeek(false);
  }

  useEffect(() => {
    loadTenant();
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'profile') {
      loadPeekRecords(activeTab);
    }
  }, [activeTab]);

  async function handleSaveNote() {
    setSavingNote(true);
    try {
      const res = await fetch('/api/trpc/admin.tenants.addNote', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { id, note } }),
      });
      if (res.ok) {
        showToast('Internal note saved', true);
      }
    } catch {
      showToast('Failed to save note', false);
    }
    setSavingNote(false);
  }

  function handleImpersonate() {
    if (!data) return;
    localStorage.setItem('vaultbill_impersonate_tenant', data.tenant.id);
    showToast(`Entering workspace for "${data.tenant.name}"...`, true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-muted-foreground space-y-3">
        <RefreshCw className="size-8 animate-spin mx-auto opacity-50" />
        <p className="text-sm">Loading tenant deep inspection...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center space-y-4">
        <AlertTriangle className="size-10 text-rose-500 mx-auto" />
        <p className="font-bold text-lg">Tenant Not Found</p>
        <Link href="/admin/tenants" className="text-xs text-rose-400 hover:underline">
          ← Return to Tenants Directory
        </Link>
      </div>
    );
  }

  const { tenant, members, stats } = data;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-12 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-in slide-in-from-top-2 ${
          toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tenants"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">{tenant.name}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                /{tenant.slug}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {tenant.plan} Plan
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tenant UUID: <span className="font-mono">{tenant.id}</span> · Created: {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleImpersonate}
            className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Zap className="size-3.5" />
            Impersonate Workspace
          </Button>
          <Button variant="outline" size="sm" onClick={loadTenant} className="gap-1.5 text-xs">
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="sm" className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Invoices</div>
          <div className="text-2xl font-black font-mono text-foreground">{stats.invoicesCount}</div>
          <div className="text-[10px] text-muted-foreground">Cash memos & tax invoices</div>
        </Card>

        <Card padding="sm" className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customers</div>
          <div className="text-2xl font-black font-mono text-foreground">{stats.customersCount}</div>
          <div className="text-[10px] text-muted-foreground">Registered KYC accounts</div>
        </Card>

        <Card padding="sm" className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">FIRCs Managed</div>
          <div className="text-2xl font-black font-mono text-foreground">{stats.fircsCount}</div>
          <div className="text-[10px] text-muted-foreground">e-FIRC inward certificates</div>
        </Card>

        <Card padding="sm" className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">EDF Records</div>
          <div className="text-2xl font-black font-mono text-foreground">{stats.edfCount}</div>
          <div className="text-[10px] text-muted-foreground">SOFTEX replacements</div>
        </Card>
      </div>

      {/* Main Grid: Members & Internal Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Members */}
        <Card padding="md" className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="size-4 text-rose-500" />
            Tenant Members ({members.length})
          </h2>

          <div className="divide-y divide-border/40">
            {members.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{m.userName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-muted text-muted-foreground">
                      {m.role}
                    </span>
                    {m.isSuperAdmin && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">
                        SUPER ADMIN
                      </span>
                    )}
                    {m.banned && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                        BANNED
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground font-mono text-[11px]">{m.userEmail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Joined {new Date(m.joinedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Maintainer Internal Notes */}
        <Card padding="md" className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Maintainer Internal Notes</h2>
          <p className="text-[11px] text-muted-foreground">
            Private notes visible only to platform maintainers. Use for recording support incidents or compliance audits.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add internal notes on this tenant..."
            className="w-full h-32 p-3 rounded-lg border border-input bg-background text-xs resize-none"
          />
          <Button
            size="sm"
            onClick={handleSaveNote}
            disabled={savingNote}
            className="w-full gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white"
          >
            {savingNote ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save Note
          </Button>
        </Card>
      </div>

      {/* Live Data Inspector & Peek Tabs */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Live Data Inspector</h2>
            <p className="text-xs text-muted-foreground">
              Troubleshoot issues by peeking directly into the tenant&apos;s isolated database schema.
            </p>
          </div>

          <div className="flex gap-1">
            {(['profile', 'invoices', 'customers', 'fircs', 'edf'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
                  activeTab === tab
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-3 text-xs">
            {stats.businessProfile ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Company Name</div>
                  <div className="font-bold text-foreground mt-0.5">{stats.businessProfile.companyName || '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">RBI Licence No.</div>
                  <div className="font-mono font-bold text-foreground mt-0.5">{stats.businessProfile.rbiLicenceNo || '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">GSTIN</div>
                  <div className="font-mono font-bold text-foreground mt-0.5">{stats.businessProfile.gstin || '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">PAN</div>
                  <div className="font-mono font-bold text-foreground mt-0.5">{stats.businessProfile.pan || '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">CIN</div>
                  <div className="font-mono font-bold text-foreground mt-0.5">{stats.businessProfile.cin || '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Numbering Format</div>
                  <div className="font-mono font-bold text-foreground mt-0.5">{stats.businessProfile.invoiceNumberFormat || 'INV-{YY}-{SEQ}'}</div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">Business profile has not been initialized by tenant.</p>
            )}
          </div>
        )}

        {/* Tab Content: Records Peek */}
        {activeTab !== 'profile' && (
          <div>
            {loadingPeek ? (
              <div className="py-12 text-center text-muted-foreground">
                <RefreshCw className="size-6 animate-spin mx-auto opacity-50 mb-2" />
                <p className="text-xs">Querying tenant records...</p>
              </div>
            ) : peekRecords.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No records found in this category.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 font-mono">ID / Number</th>
                      <th className="py-2.5 px-3">Primary Info</th>
                      <th className="py-2.5 px-3">Status / Amount</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {peekRecords.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-muted/30">
                        <td className="py-2 px-3 font-bold text-foreground">
                          {r.invoiceNumber || r.fircNumber || r.edfNumber || r.name || r.id?.slice(0, 8)}
                        </td>
                        <td className="py-2 px-3 font-sans">
                          {r.currency ? `${r.currency} ${r.total || r.amount || ''}` : (r.email || r.buyerName || '—')}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted uppercase">
                            {r.status || r.country || 'OK'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-[10px]">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
