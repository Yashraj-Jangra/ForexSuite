'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Flag,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Layers,
  Settings2,
} from 'lucide-react';

type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  isKillSwitch: boolean;
  category: 'release' | 'kill_switch' | 'entitlement' | 'experiment';
  enabledTenants: string[];
  disabledTenants: string[];
  updatedBy: string | null;
  updatedAt: string;
};

const CATEGORY_BADGES: Record<string, string> = {
  kill_switch: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  release: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  entitlement: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  experiment: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [createForm, setCreateForm] = useState({
    key: '',
    name: '',
    description: '',
    category: 'release' as 'release' | 'kill_switch' | 'entitlement' | 'experiment',
    enabled: true,
    isKillSwitch: false,
  });

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadFlags() {
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/admin.flags.list', { credentials: 'include' });
      const json = await res.json();
      if (json?.result?.data) {
        setFlags(json.result.data || []);
      }
    } catch (err) {
      console.error('Failed to load feature flags:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFlags();
  }, []);

  async function handleToggle(flag: FeatureFlag) {
    setTogglingId(flag.id);
    const nextState = !flag.enabled;

    try {
      const res = await fetch('/api/trpc/admin.flags.toggle', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { id: flag.id, enabled: nextState } }),
      });
      const data = await res.json();
      if (data?.result?.data) {
        showToast(`Flag "${flag.name}" set to ${nextState ? 'ENABLED' : 'DISABLED'}`, true);
        loadFlags();
      } else {
        showToast(data?.error?.message || 'Failed to toggle flag', false);
      }
    } catch {
      showToast('Network error', false);
    }
    setTogglingId(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/trpc/admin.flags.create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            ...createForm,
            isKillSwitch: createForm.category === 'kill_switch',
          },
        }),
      });
      const data = await res.json();
      if (data?.result?.data) {
        showToast(`Feature flag "${createForm.name}" created`, true);
        setShowCreateModal(false);
        setCreateForm({
          key: '',
          name: '',
          description: '',
          category: 'release',
          enabled: true,
          isKillSwitch: false,
        });
        loadFlags();
      } else {
        showToast(data?.error?.message || 'Failed to create flag', false);
      }
    } catch {
      showToast('Network error', false);
    }
  }

  async function handleDelete(flag: FeatureFlag) {
    if (confirm(`Delete feature flag "${flag.name}" (${flag.key})?`)) {
      try {
        const res = await fetch('/api/trpc/admin.flags.delete', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: { id: flag.id } }),
        });
        if (res.ok) {
          showToast(`Flag "${flag.name}" removed`, true);
          loadFlags();
        }
      } catch {
        showToast('Network error', false);
      }
    }
  }

  const killSwitches = flags.filter((f) => f.isKillSwitch || f.category === 'kill_switch');
  const regularFlags = flags.filter((f) => !f.isKillSwitch && f.category !== 'kill_switch');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-12 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-in slide-in-from-top-2 ${
          toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Feature Flags &amp; Kill Switches</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono">
              {flags.length} CONTROLS
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dynamic runtime switches and emergency circuit breakers to disable high-risk platform subsystems instantly with zero code redeployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadFlags} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white">
            <Plus className="size-3.5" />
            Add Custom Flag
          </Button>
        </div>
      </div>

      {/* Emergency Kill Switches Section */}
      {killSwitches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-400">
            <Flame className="size-4 text-rose-500" />
            <span>Emergency Kill Switches (Tier 1 Circuit Breakers)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {killSwitches.map((f) => (
              <Card
                key={f.id}
                padding="md"
                className={`space-y-3 border-2 transition-all ${
                  f.enabled
                    ? 'border-border bg-card'
                    : 'border-rose-500/60 bg-rose-500/10 shadow-lg shadow-rose-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{f.name}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border uppercase ${CATEGORY_BADGES[f.category]}`}>
                        KILL SWITCH
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggle(f)}
                    disabled={togglingId === f.id}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      f.enabled ? 'bg-emerald-500' : 'bg-rose-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        f.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono">
                  <span>Key: {f.key}</span>
                  <span className={f.enabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {f.enabled ? '● SERVICE OPERATIONAL' : '■ CIRCUIT TRIPPED (DISABLED)'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Standard Release & Gating Flags */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <Layers className="size-4" />
          <span>Feature Rollouts &amp; Entitlements</span>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Feature Name &amp; Key</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-normal">
                {regularFlags.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{f.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{f.key}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${CATEGORY_BADGES[f.category]}`}>
                        {f.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-sm">
                      {f.description || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(f)}
                        disabled={togglingId === f.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border transition-all ${
                          f.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {f.enabled ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        <span>{f.enabled ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(f)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete feature flag"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Custom Flag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="size-4 text-rose-500" />
              Create Custom Feature Flag
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Flag Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. AI Invoice OCR Parser"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Unique Key (lowercase snake_case) *
                </label>
                <input
                  type="text"
                  value={createForm.key}
                  onChange={(e) => setCreateForm({ ...createForm, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="e.g. ai_invoice_ocr"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Category *
                </label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as any })}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
                >
                  <option value="release">Release (Phased rollouts)</option>
                  <option value="kill_switch">Kill Switch (Emergency cutoff)</option>
                  <option value="entitlement">Entitlement (Tier gating)</option>
                  <option value="experiment">Experiment (A/B testing)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Explain what this feature controls..."
                  className="w-full h-16 p-2.5 rounded-lg border border-input bg-background text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                  Create Flag
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
