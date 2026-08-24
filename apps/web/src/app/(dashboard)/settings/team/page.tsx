'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Users, UserPlus, Crown, Shield, PenLine, Eye, Mail, RefreshCw, CheckCircle2, XCircle, Trash2, ChevronDown } from 'lucide-react';

type Role = 'owner' | 'admin' | 'accountant' | 'viewer';

const ROLE_CONFIG: Record<Role, { label: string; desc: string; icon: React.ReactNode; cls: string }> = {
  owner: { label: 'Owner', desc: 'Full access, billing, delete, manage team', icon: <Crown className="size-3.5" />, cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  admin: { label: 'Admin', desc: 'Everything except billing and delete', icon: <Shield className="size-3.5" />, cls: 'bg-accent/10 text-accent border-accent/20' },
  accountant: { label: 'Accountant', desc: 'Create/edit invoices, view all, export', icon: <PenLine className="size-3.5" />, cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  viewer: { label: 'Viewer', desc: 'Read-only: view invoices, reports, compliance', icon: <Eye className="size-3.5" />, cls: 'bg-muted text-muted-foreground border-border' },
};

// Static demo data — wired to real API once multi-user auth is in place
const DEMO_MEMBERS = [
  { id: '1', name: 'You (Owner)', email: 'owner@company.com', role: 'owner' as Role, status: 'active' },
];

export default function TeamPage() {
  const [members] = useState(DEMO_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('accountant');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    // Multi-user API wired in the next implementation phase
    await new Promise((r) => setTimeout(r, 800));
    showToast(`Invite sent to ${inviteEmail} as ${ROLE_CONFIG[inviteRole].label}`, true);
    setShowInvite(false);
    setInviteEmail('');
    setSending(false);
  }

  const PERMISSIONS: { action: string; owner: boolean; admin: boolean; accountant: boolean; viewer: boolean }[] = [
    { action: 'View invoices & reports', owner: true, admin: true, accountant: true, viewer: true },
    { action: 'Create new invoices', owner: true, admin: true, accountant: true, viewer: false },
    { action: 'Edit draft invoices', owner: true, admin: true, accountant: true, viewer: false },
    { action: 'Finalize & send invoices', owner: true, admin: true, accountant: true, viewer: false },
    { action: 'Cancel / void invoices', owner: true, admin: true, accountant: false, viewer: false },
    { action: 'Export data & reports', owner: true, admin: true, accountant: true, viewer: false },
    { action: 'Manage compliance (FIRC, LUT, EDF)', owner: true, admin: true, accountant: true, viewer: false },
    { action: 'Edit business profile', owner: true, admin: true, accountant: false, viewer: false },
    { action: 'Manage email & backups', owner: true, admin: true, accountant: false, viewer: false },
    { action: 'Delete records', owner: true, admin: false, accountant: false, viewer: false },
    { action: 'Manage team members', owner: true, admin: true, accountant: false, viewer: false },
    { action: 'Billing & subscription', owner: true, admin: false, accountant: false, viewer: false },
  ];

  return (
    <Container>
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-lg animate-in slide-in-from-top-2 ${
            toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          }`}>
            {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Team & Access</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage who has access to your VaultBill workspace and their permissions.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowInvite(true)} className="gap-1.5">
            <UserPlus className="size-3.5" />
            Invite Member
          </Button>
        </div>

        {/* Invoice Freeze Notice */}
        <Card padding="md" className="border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
          <Shield className="size-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Invoice Integrity Protection — Active</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Invoices are automatically <strong>locked once finalized</strong> (status: Sent, Paid, or Cancelled).
              No role — not even Owner — can edit line items, amounts, or GST after finalization.
              This is enforced at the API level to comply with GST and FEMA audit requirements.
            </p>
          </div>
        </Card>

        {/* Invite Form */}
        {showInvite && (
          <Card padding="md" className="border-accent/30 bg-accent/5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-2">Role</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(['admin', 'accountant', 'viewer'] as Role[]).map((role) => {
                    const rc = ROLE_CONFIG[role];
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`text-left flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                          inviteRole === role ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'
                        }`}
                      >
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 shrink-0 ${rc.cls}`}>
                          {rc.icon}{rc.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{rc.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={sending} className="gap-1.5">
                  {sending ? <RefreshCw className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                  Send Invite
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Members List */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              Workspace Members
            </h2>
            <span className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="divide-y divide-border/40">
            {members.map((member) => {
              const rc = ROLE_CONFIG[member.role];
              return (
                <div key={member.id} className="flex items-center gap-3 py-3">
                  <div className="size-9 rounded-full bg-accent/20 text-accent font-bold text-sm flex items-center justify-center shrink-0">
                    {member.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${rc.cls}`}>
                        {rc.icon}{rc.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  {member.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Change role">
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Remove member">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Permissions Matrix */}
        <Card padding="md" className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Role Permissions Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2.5 font-semibold text-muted-foreground">Permission</th>
                  {(['owner', 'admin', 'accountant', 'viewer'] as Role[]).map((r) => (
                    <th key={r} className="text-center pb-2.5 font-semibold">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_CONFIG[r].cls}`}>
                        {ROLE_CONFIG[r].icon}{ROLE_CONFIG[r].label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {PERMISSIONS.map((row) => (
                  <tr key={row.action} className="hover:bg-muted/30">
                    <td className="py-2.5 text-muted-foreground pr-4">{row.action}</td>
                    {(['owner', 'admin', 'accountant', 'viewer'] as Role[]).map((r) => (
                      <td key={r} className="py-2.5 text-center">
                        {row[r]
                          ? <CheckCircle2 className="size-3.5 text-emerald-500 mx-auto" />
                          : <XCircle className="size-3.5 text-border mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Container>
  );
}
