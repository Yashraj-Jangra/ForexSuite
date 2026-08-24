'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ShieldAlert,
  Building2,
  Users,
  Mail,
  HardDrive,
  Flag,
  Activity,
  ScrollText,
  LayoutDashboard,
  ArrowRightLeft,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useTheme } from '@/providers/ThemeProvider';
import { Illustration } from '@/components/ui/illustration';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview & KPIs', icon: LayoutDashboard, exact: true },
  { href: '/admin/tenants', label: 'Tenants Directory', icon: Building2 },
  { href: '/admin/users', label: 'Global Users', icon: Users },
  { href: '/admin/smtp', label: 'Platform SMTP', icon: Mail },
  { href: '/admin/backups', label: 'Global Backups', icon: HardDrive },
  { href: '/admin/flags', label: 'Feature Flags & Kill Switches', icon: Flag, highlight: true },
  { href: '/admin/health', label: 'System Health & Metrics', icon: Activity },
  { href: '/admin/audit-log', label: 'Platform Audit Trail', icon: ScrollText },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string; isSuperAdmin?: boolean } | null>(null);
  const [checking, setChecking] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [impersonatingTenant, setImpersonatingTenant] = useState<string | null>(null);

  useEffect(() => {
    // Check if impersonating from localStorage/cookies
    const imp = localStorage.getItem('vaultbill_impersonate_tenant');
    if (imp) setImpersonatingTenant(imp);

    async function checkAuth() {
      try {
        const res = await fetch('/api/trpc/me', { credentials: 'include' });
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const json = await res.json();
        const u = json?.result?.data;
        if (!u) {
          router.push('/login');
          return;
        }
        setUser(u);
        if (!u.isSuperAdmin) {
          setUnauthorized(true);
        } else {
          setUnauthorized(false);
        }
      } catch {
        setUnauthorized(true);
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/login');
  }

  function handleExitImpersonation() {
    localStorage.removeItem('vaultbill_impersonate_tenant');
    setImpersonatingTenant(null);
    window.location.reload();
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white space-y-4">
        <Illustration name="securityShield" size="sm" float />
        <p className="text-sm font-semibold tracking-wider text-neutral-300">Authenticating Super Admin session...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-neutral-900 border border-rose-500/30 rounded-2xl p-8 space-y-5 shadow-2xl">
          <div className="py-2">
            <Illustration name="securityShield" size="md" className="mx-auto" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Restricted Area</h1>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              The <strong>Super Admin Control Plane</strong> is strictly restricted to platform maintainers.
            </p>
            {user?.email && (
              <div className="mt-3 p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-300">
                Logged in as: <strong className="text-white font-mono">{user.email}</strong>
              </div>
            )}
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>Return to User Dashboard</span>
              <ExternalLink className="size-3.5" />
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              Sign out and log in as jangrayash1505@gmail.com
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Super Admin Master Red Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white px-4 py-1.5 border-b border-rose-700/50 shadow-md flex items-center justify-between text-[11px] font-semibold">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 text-[10px] uppercase font-extrabold tracking-wider animate-pulse">
            <Zap className="size-3 text-rose-300" /> Super Admin
          </span>
          <span className="hidden sm:inline text-rose-100 font-bold">
            PLATFORM MAINTAINER CONTROL PLANE · FULL SYSTEM SCOPE
          </span>
        </div>

        <div className="flex items-center gap-3">
          {impersonatingTenant && (
            <div className="flex items-center gap-2 bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-md">
              <span className="text-[10px] font-bold">Impersonating Tenant Mode</span>
              <button
                onClick={handleExitImpersonation}
                className="underline hover:text-white text-[10px] font-extrabold ml-1"
              >
                Exit
              </button>
            </div>
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors text-[11px]"
          >
            <ArrowRightLeft className="size-3" />
            <span>Switch to Tenant Suite</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-md select-none shrink-0">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center shadow-md">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-foreground">VaultBill Ops</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    MASTER
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">Platform Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              System Control
            </p>
            {ADMIN_NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                    active
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.highlight && (
                    <span className="size-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User / Theme Footer */}
          <div className="p-3 border-t border-border">
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">{user?.email || 'admin@vaultbill'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                  title="Toggle theme"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                </button>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header and Drawer */}
        <div className="md:hidden w-full flex flex-col">
          <div className="p-3 border-b border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" />
              <span className="font-bold text-sm">Super Admin Ops</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-border text-muted-foreground"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="p-4 bg-card border-b border-border space-y-2">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto animate-reveal-up">
          {children}
        </main>
      </div>
    </div>
  );
}
