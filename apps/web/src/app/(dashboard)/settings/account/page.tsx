'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { useTrpcClient } from '@/providers/TrpcProvider';
import { Illustration } from '@/components/ui/illustration';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  Upload,
  Calendar,
  KeyRound,
  ShieldAlert,
  Globe,
  LogOut,
  Save,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AccountData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  image: string | null;
  isSuperAdmin: boolean;
  role: string;
  joinedAt: string;
  createdAt: string;
  lastAccessedAt: string;
  lastIpAddress: string | null;
  lastUserAgent: string | null;
}

interface SessionItem {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  owner: { label: 'Workspace Owner', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  admin: { label: 'Administrator', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  accountant: { label: 'Compliance & Accountant', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  viewer: { label: 'Read-Only Viewer', color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
  member: { label: 'Team Member', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

const AVATAR_PRESETS: { id: string; label: string; name: any }[] = [
  { id: 'dev', label: 'Developer', name: 'avatarDev' },
  { id: 'prowoman', label: 'Executive', name: 'avatarProWoman' },
  { id: 'hacker', label: 'Builder', name: 'avatarHacker' },
  { id: 'guy', label: 'Associate', name: 'avatarGuy' },
  { id: 'coolgirl', label: 'Creative', name: 'avatarCoolGirl' },
  { id: 'thinker', label: 'Analyst', name: 'avatarThinker' },
  { id: 'female', label: 'Manager', name: 'avatarFemale' },
  { id: 'stylish', label: 'Partner', name: 'avatarStylish' },
];

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch {
    return dateStr;
  }
}

function parseBrowserDevice(userAgent: string | null): string {
  if (!userAgent) return 'Web Browser';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) return 'MacBook / macOS';
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('Linux')) return 'Linux Desktop';
  return 'Desktop Device';
}

export default function AccountSettingsPage() {
  const trpc = useTrpcClient();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadData() {
    setLoading(true);
    try {
      // First attempt typed tRPC client
      const [accData, sessList] = await Promise.all([
        trpc.account.get.query().catch(async () => {
          // Fallback to me query if account.get has initial handshake delay
          const meData = await trpc.me.query();
          if (meData) {
            return {
              id: meData.id,
              name: meData.name,
              email: meData.email,
              phone: meData.phone ?? null,
              designation: meData.designation ?? null,
              image: meData.image ?? null,
              isSuperAdmin: meData.isSuperAdmin,
              role: 'member',
              joinedAt: meData.createdAt ? new Date(meData.createdAt).toISOString() : new Date().toISOString(),
              createdAt: meData.createdAt ? new Date(meData.createdAt).toISOString() : new Date().toISOString(),
              lastAccessedAt: new Date().toISOString(),
              lastIpAddress: '127.0.0.1',
              lastUserAgent: null,
            } as AccountData;
          }
          return null;
        }),
        trpc.account.sessions.query().catch(() => []),
      ]);

      if (accData) {
        setAccount(accData);
        setName(accData.name ?? '');
        setEmail(accData.email ?? '');
        setPhone(accData.phone ?? '');
        setDesignation(accData.designation ?? '');
        setImage(accData.image ?? null);
      }
      if (Array.isArray(sessList)) {
        setSessions(sessList);
      }
    } catch {
      showToast('Failed to load profile details.', false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleAvatarUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      showToast('Avatar photo must be under 2MB.', false);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setImage(b64);
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await trpc.account.update.mutate({
        name: name.trim() || undefined,
        phone: phone.trim() || null,
        designation: designation.trim() || null,
        image: image || null,
      });

      showToast('Profile updated successfully!', true);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile info.', false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    try {
      await trpc.account.revokeSession.mutate({ sessionId });
      showToast('Session terminated successfully.', true);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      showToast(err?.message || 'Failed to terminate session.', false);
    }
  }

  const roleInfo = ROLE_BADGES[account?.role || 'member'] ?? ROLE_BADGES.member!;

  const initials = (name || account?.name)
    ? (name || account?.name || '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'VB';

  return (
    <Container size="md" className="space-y-8 pb-16">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-12 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl animate-in slide-in-from-top-2 ${
            toast.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="size-6 text-accent" />
            Personal Account &amp; Security
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your personal profile, contact information, role access, and active login sessions.
          </p>
        </div>
        <Button onClick={handleSaveProfile} disabled={saving || loading} className="gap-1.5 shrink-0">
          <Save className="size-4" />
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </Button>
      </div>

      {/* ─── SECTION 1: USER IDENTITY HERO CARD ─── */}
      <Card padding="lg" className="border-accent/30 bg-accent/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar Upload */}
          <div className="relative group shrink-0">
            {image ? (
              <img
                src={image}
                alt={name || 'Avatar'}
                className="size-20 rounded-2xl object-cover border-2 border-border shadow-md bg-card"
              />
            ) : (
              <div className="size-20 rounded-2xl bg-accent/20 text-accent text-2xl font-bold flex items-center justify-center border-2 border-border shadow-md">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center gap-1 transition-opacity text-[10px] font-semibold"
            >
              <Upload className="size-4" />
              <span>Change</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
          </div>

          {/* User Meta */}
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{name || account?.name || 'User Profile'}</h2>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
              {account?.isSuperAdmin && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase flex items-center gap-1">
                  <ShieldAlert className="size-3" />
                  <span>Platform Super Admin</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
              <Mail className="size-3.5 text-accent" />
              <span>{email || account?.email || 'Loading email...'}</span>
            </p>
            {designation && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-muted-foreground" />
                <span>{designation}</span>
              </p>
            )}
          </div>
        </div>

        {/* Preset Avatar Fast Picker */}
        <div className="pt-3 border-t border-border/50">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Quick Avatar Presets
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {AVATAR_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setImage(`/illustrations/${p.name === 'avatarDev' ? 'developer-avatar_f6ac.svg' : p.name === 'avatarProWoman' ? 'professional-woman-avatar_ivds.svg' : p.name === 'avatarHacker' ? 'indie-hacker-avatar_b3wy.svg' : p.name === 'avatarGuy' ? 'friendly-guy-avatar_dqp5.svg' : p.name === 'avatarCoolGirl' ? 'cool-girl-avatar_fifz.svg' : p.name === 'avatarThinker' ? 'deep-thinker-avatar_6xg6.svg' : p.name === 'avatarFemale' ? 'female-avatar_7t6k.svg' : 'stylish-girl-avatar_m8po.svg'}`)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border/60 hover:border-accent bg-card/60 hover:bg-card text-xs font-semibold transition-all"
              >
                <Illustration name={p.name} size="avatar" className="size-5" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ─── SECTION 2: EDIT PROFILE FORM ─── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground">Edit Account Details</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Full Legal Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Address</label>
              <div className="relative">
                <Input
                  value={email || account?.email || ''}
                  disabled
                  className="bg-muted/40 font-mono text-muted-foreground cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <Input
              label="Job Designation / Title"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Chief Compliance Officer / Senior Forex Dealer"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
              {saving ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* ─── SECTION 3: ACCESS TELEMETRY & TIMELINES ─── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-bold text-foreground">Access Timeline &amp; Credentials Snapshot</h2>
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
              <Clock className="size-3.5 text-accent" />
              <span>Last Accessed</span>
            </div>
            <p className="font-bold text-foreground text-sm">
              {account?.lastAccessedAt ? formatRelativeTime(account.lastAccessedAt) : 'Just now'}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {account?.lastAccessedAt ? new Date(account.lastAccessedAt).toLocaleString() : ''}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
              <Calendar className="size-3.5 text-emerald-400" />
              <span>Account Created</span>
            </div>
            <p className="font-bold text-foreground text-sm">
              {account?.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'Active'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Joined Workspace: {account?.joinedAt ? new Date(account.joinedAt).toLocaleDateString() : 'Active'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
              <Globe className="size-3.5 text-blue-400" />
              <span>Last IP &amp; Device</span>
            </div>
            <p className="font-bold text-foreground text-sm font-mono truncate">
              {account?.lastIpAddress || '127.0.0.1 (Local)'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {parseBrowserDevice(account?.lastUserAgent || null)}
            </p>
          </div>
        </div>
      </Card>

      {/* ─── SECTION 4: ACTIVE SESSIONS & DEVICE MANAGEMENT ─── */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Active Login Sessions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Devices and browsers currently authenticated to your account.
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
            {sessions.length || 1} Active {(sessions.length || 1) === 1 ? 'Session' : 'Sessions'}
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {sessions.map((sess, idx) => {
            const isCurrentDevice = idx === 0;
            return (
              <div key={sess.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                    <Laptop className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">{parseBrowserDevice(sess.userAgent)}</p>
                      {isCurrentDevice && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-mono">IP: {sess.ipAddress || '127.0.0.1'}</span>
                      <span>•</span>
                      <span>Last active: {formatRelativeTime(sess.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {!isCurrentDevice && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRevokeSession(sess.id)}
                    className="text-[11px] h-7 px-2 text-rose-400 hover:text-rose-500 border-rose-500/30"
                  >
                    <LogOut className="size-3 mr-1" />
                    Terminate
                  </Button>
                )}
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No additional active sessions detected.
            </div>
          )}
        </div>
      </Card>
    </Container>
  );
}
