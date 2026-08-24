'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Zap,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Crown,
  Key,
} from 'lucide-react';

type UserItem = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  isSuperAdmin: boolean;
  banned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  image: string | null;
  createdAt: string;
  tenants: {
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    role: string;
  }[];
  activeSessionCount: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Modal states
  const [banModal, setBanModal] = useState<{ open: boolean; user: UserItem | null; reason: string }>({
    open: false,
    user: null,
    reason: '',
  });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/trpc/admin.users.list?input=${encodeURIComponent(
          JSON.stringify({
            search: search || undefined,
            filter,
          }),
        )}`,
        { credentials: 'include' },
      );
      const json = await res.json();
      if (json?.result?.data) {
        setUsers(json.result.data.users || []);
        setTotal(json.result.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function handleBan() {
    if (!banModal.user || !banModal.reason.trim()) {
      showToast('Please enter a reason for suspension', false);
      return;
    }

    try {
      const res = await fetch('/api/trpc/admin.users.ban', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { userId: banModal.user.id, reason: banModal.reason } }),
      });
      const data = await res.json();
      if (data?.result?.data) {
        showToast(`User "${banModal.user.name}" has been suspended`, true);
        setBanModal({ open: false, user: null, reason: '' });
        loadUsers();
      } else {
        showToast(data?.error?.message || 'Failed to ban user', false);
      }
    } catch {
      showToast('Network error', false);
    }
  }

  async function handleUnban(u: UserItem) {
    try {
      const res = await fetch('/api/trpc/admin.users.unban', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { userId: u.id } }),
      });
      const data = await res.json();
      if (data?.result?.data) {
        showToast(`User "${u.name}" reactivated`, true);
        loadUsers();
      }
    } catch {
      showToast('Network error', false);
    }
  }

  async function handleForceLogout(u: UserItem) {
    try {
      const res = await fetch('/api/trpc/admin.users.forceLogout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { userId: u.id } }),
      });
      const data = await res.json();
      if (data?.result?.data?.success) {
        showToast(`Terminated ${data.result.data.terminatedCount} active session(s) for "${u.name}"`, true);
        loadUsers();
      }
    } catch {
      showToast('Network error', false);
    }
  }

  async function handleToggleAdmin(u: UserItem) {
    const nextState = !u.isSuperAdmin;
    if (confirm(`Are you sure you want to ${nextState ? 'grant' : 'revoke'} Super Admin privileges for "${u.name}"?`)) {
      try {
        const res = await fetch('/api/trpc/admin.users.toggleAdminRole', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: { userId: u.id, isSuperAdmin: nextState } }),
        });
        const data = await res.json();
        if (data?.result?.data) {
          showToast(`Super Admin rights ${nextState ? 'granted to' : 'revoked from'} ${u.name}`, true);
          loadUsers();
        } else {
          showToast(data?.error?.message || 'Action failed', false);
        }
      } catch {
        showToast('Network error', false);
      }
    }
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Global User Accounts</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono">
              {total} REGISTERED
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Global directory of all platform users, active session termination, ban enforcement, and super admin delegation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading} className="gap-1.5 text-xs">
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
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            placeholder="Search by name or email..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs"
          >
            <option value="all">All User Accounts</option>
            <option value="super_admins">Super Admins Only</option>
            <option value="banned">Suspended / Banned</option>
            <option value="active">Active Only</option>
          </select>

          <Button size="sm" onClick={loadUsers} className="text-xs shrink-0">
            Search
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Workspace Memberships</th>
                <th className="py-3 px-4">Status & Roles</th>
                <th className="py-3 px-4">Active Sessions</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Maintainer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="size-6 animate-spin mx-auto mb-2 opacity-50" />
                    <p>Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No user accounts found matching query</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground shrink-0">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.isSuperAdmin && (
                              <span title="Super Admin">
                                <Crown className="size-3.5 text-amber-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground truncate">{u.email}</div>
                          {u.bannedReason && (
                            <div className="text-[10px] text-rose-400 mt-0.5 truncate max-w-xs">
                              Ban reason: {u.bannedReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {u.tenants.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground italic">No workspaces</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.tenants.map((t) => (
                            <span
                              key={t.tenantId}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 text-[10px] font-medium border border-border"
                            >
                              <span>{t.tenantName}</span>
                              <span className="text-[9px] text-muted-foreground uppercase">({t.role})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        {u.banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                            <AlertTriangle className="size-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                            <CheckCircle2 className="size-3" /> Active
                          </span>
                        )}
                        {u.isSuperAdmin && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                            Master
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={u.activeSessionCount > 0 ? 'text-emerald-400' : 'text-muted-foreground'}>
                        {u.activeSessionCount} active
                      </span>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleForceLogout(u)}
                          disabled={u.activeSessionCount === 0}
                          className="h-7 px-2 text-[11px] gap-1"
                          title="Force terminate all active sessions"
                        >
                          <LogOut className="size-3" />
                          <span>Logout</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAdmin(u)}
                          className={`h-7 px-2 text-[11px] gap-1 ${
                            u.isSuperAdmin ? 'text-amber-400 border-amber-500/30' : 'text-muted-foreground'
                          }`}
                          title={u.isSuperAdmin ? 'Revoke Super Admin' : 'Make Super Admin'}
                        >
                          <Key className="size-3" />
                          <span>{u.isSuperAdmin ? 'Revoke' : 'Admin'}</span>
                        </Button>

                        {u.banned ? (
                          <button
                            onClick={() => handleUnban(u)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Reactivate user account"
                          >
                            <CheckCircle2 className="size-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setBanModal({ open: true, user: u, reason: '' })}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Ban / Suspend user"
                          >
                            <AlertTriangle className="size-4" />
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

      {/* Ban User Modal */}
      {banModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-500 font-bold">
              <AlertTriangle className="size-5" />
              <h2>Suspend User Account</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Suspending <strong>{banModal.user?.name}</strong> ({banModal.user?.email}) will instantly invalidate all their active sessions and block them from authenticating.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Reason for Suspension *
              </label>
              <textarea
                value={banModal.reason}
                onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
                placeholder="e.g. Terms violation, credential compromise, abuse..."
                className="w-full h-24 p-3 rounded-lg border border-input bg-background text-xs resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setBanModal({ open: false, user: null, reason: '' })}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleBan} className="bg-rose-600 hover:bg-rose-700 text-white">
                Confirm Ban
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
