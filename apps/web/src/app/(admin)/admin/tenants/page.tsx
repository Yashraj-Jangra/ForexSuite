'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Search,
  Filter,
  Users,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Trash2,
} from 'lucide-react';

type TenantItem = {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'deleted';
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  planExpiresAt: string | null;
  notes: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
  memberCount: number;
  createdAt: string;
};

const PLAN_BADGES: Record<string, string> = {
  free: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  deleted: 'bg-muted text-muted-foreground border-border',
};

export default function AdminTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Modal states
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; tenant: TenantItem | null; reason: string }>({
    open: false,
    tenant: null,
    reason: '',
  });
  const [planModal, setPlanModal] = useState<{ open: boolean; tenant: TenantItem | null; plan: string }>({
    open: false,
    tenant: null,
    plan: 'pro',
  });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadTenants() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (planFilter !== 'all') params.set('plan', planFilter);

      const res = await fetch(`/api/trpc/admin.tenants.list?input=${encodeURIComponent(JSON.stringify({
        search: search || undefined,
        status: statusFilter,
        plan: planFilter,
      }))}`, { credentials: 'include' });
      const json = await res.json();
      if (json?.result?.data) {
        setTenants(json.result.data.tenants || []);
        setTotal(json.result.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTenants();
  }, [statusFilter, planFilter]);

  async function handleSuspend() {
    if (!suspendModal.tenant || !suspendModal.reason.trim()) {
      showToast('Please enter a reason for suspension', false);
      return;
    }

    try {
      const res = await fetch('/api/trpc/admin.tenants.suspend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { id: suspendModal.tenant.id, reason: suspendModal.reason } }),
      });
      const data = await res.json();
      if (data?.result?.data) {
        showToast(`Tenant "${suspendModal.tenant.name}" suspended`, true);
        setSuspendModal({ open: false, tenant: null, reason: '' });
        loadTenants();
      } else {
        showToast(data?.error?.message || 'Failed to suspend tenant', false);
      }
    } catch {
      showToast('Network error', false);
    }
  }

  async function handleActivate(tenant: TenantItem) {
    try {
      const res = await fetch('/api/trpc/admin.tenants.activate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { id: tenant.id } }),
      });
      const data = await res.json();
      if (data?.result?.data) {
        showToast(`Tenant "${tenant.name}" reactivated`, true);
        loadTenants();
      }
    } catch {
      showToast('Network error', false);
    }
  }

  async function handleSetPlan() {
    if (!planModal.tenant) return;
    try {
      const res = await fetch('/api/trpc/admin.tenants.setPlan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { id: planModal.tenant.id, plan: planModal.plan } }),
      });
      const data = await res.json();
      if (data?.result?.data) {
        showToast(`Plan updated for "${planModal.tenant.name}"`, true);
        setPlanModal({ open: false, tenant: null, plan: 'pro' });
        loadTenants();
      }
    } catch {
      showToast('Network error', false);
    }
  }

  function handleImpersonate(tenant: TenantItem) {
    localStorage.setItem('vaultbill_impersonate_tenant', tenant.id);
    showToast(`Entering workspace for "${tenant.name}"...`, true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-12 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-in slide-in-from-top-2 ${
          toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Tenants Directory</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono">
              {total} TOTAL
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Global tenant lifecycle management, plan provisioning, suspension, and tenant workspace inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTenants} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm" className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTenants()}
            placeholder="Search tenant name or slug..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
            <option value="deleted">Soft-Deleted</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs uppercase"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <Button size="sm" onClick={loadTenants} className="text-xs shrink-0">
            Search
          </Button>
        </div>
      </Card>

      {/* Tenants Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Tenant Identity</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Maintainer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 opacity-50" />
                    <p>Loading tenant directory...</p>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Building2 className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No tenants match the selected filters</p>
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground text-sm">{t.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">/{t.slug}</div>
                      {t.suspendedReason && (
                        <div className="text-[10px] text-rose-400 mt-0.5 truncate max-w-xs">
                          Reason: {t.suspendedReason}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => setPlanModal({ open: true, tenant: t, plan: t.plan })}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${PLAN_BADGES[t.plan] || ''}`}
                        title="Click to modify plan tier"
                      >
                        <span>{t.plan}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${STATUS_BADGES[t.status] || ''}`}>
                        {t.status === 'active' && <CheckCircle2 className="size-3 text-emerald-400" />}
                        {t.status === 'suspended' && <AlertTriangle className="size-3 text-rose-400" />}
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="size-3.5" />
                        <span>{t.memberCount}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImpersonate(t)}
                          className="h-7 px-2 text-[11px] gap-1 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                          title="Impersonate tenant workspace as owner"
                        >
                          <Zap className="size-3" />
                          <span>Impersonate</span>
                        </Button>

                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="h-7 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="size-3 text-muted-foreground" />
                        </Link>

                        {t.status === 'active' ? (
                          <button
                            onClick={() => setSuspendModal({ open: true, tenant: t, reason: '' })}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Suspend tenant workspace"
                          >
                            <AlertTriangle className="size-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(t)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Activate tenant"
                          >
                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Suspend Modal Dialog */}
      {suspendModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-500 font-bold">
              <AlertTriangle className="size-5" />
              <h2>Suspend Tenant Workspace</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Suspending <strong>{suspendModal.tenant?.name}</strong> will temporarily block all tenant members from accessing their invoicing dashboard and generating PDFs.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Reason for Suspension *
              </label>
              <textarea
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                placeholder="e.g. KYC audit non-compliance, payment dispute, suspicious foreign exchange volume..."
                className="w-full h-24 p-3 rounded-lg border border-input bg-background text-xs resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSuspendModal({ open: false, tenant: null, reason: '' })}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSuspend} className="bg-rose-600 hover:bg-rose-700 text-white">
                Confirm Suspension
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {planModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <h2 className="text-sm font-bold text-foreground">Change Subscription Plan</h2>
            <p className="text-xs text-muted-foreground">
              Modify the subscription tier for <strong>{planModal.tenant?.name}</strong>.
            </p>
            <div className="space-y-2">
              {(['free', 'starter', 'pro', 'enterprise'] as const).map((p) => (
                <label
                  key={p}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    planModal.plan === p ? 'border-rose-500 bg-rose-500/5 font-bold' : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <span className="text-xs uppercase">{p} Tier</span>
                  <input
                    type="radio"
                    name="plan"
                    checked={planModal.plan === p}
                    onChange={() => setPlanModal({ ...planModal, plan: p })}
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPlanModal({ open: false, tenant: null, plan: 'pro' })}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSetPlan} className="bg-rose-600 hover:bg-rose-700 text-white">
                Save Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
