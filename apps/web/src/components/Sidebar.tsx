'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { VaultBillLogo } from '@/components/ui/logo';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  Building2,
  Landmark,
  ScrollText,
  ArrowLeftRight,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  FileCheck2,
  ListOrdered,
  UserCog,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useTheme } from '@/providers/ThemeProvider';
import { useBusinessProfile } from '@/context/business-profile-context';

const MAIN_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/vendors', label: 'Vendors', icon: Building2 },
];

const COMPLIANCE_NAV = [
  { href: '/compliance/lrs', label: 'LRS & Form A2', icon: ArrowLeftRight },
  { href: '/compliance/firc', label: 'FIRC Manager', icon: Landmark },
  { href: '/compliance/lut', label: 'LUT Registry', icon: ScrollText },
  { href: '/compliance/flm8', label: 'FLM-8 Return', icon: ShieldCheck },
  { href: '/compliance/flm1-7', label: 'FLM Registers', icon: ListOrdered },
  { href: '/compliance/edf', label: 'EDF / SOFTEX', icon: FileCheck2, badge: 'NEW' },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const [complianceOpen, setComplianceOpen] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const { profile: bizProfile } = useBusinessProfile();

  useEffect(() => {
    fetch('/api/trpc/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.result?.data) setUser(j.result.data);
      })
      .catch(() => { });
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/login');
  }

  // Company initials for fallback avatar
  const initials = bizProfile?.companyName
    ? bizProfile.companyName.trim().slice(0, 2).toUpperCase()
    : null;

  return (
    <aside className="flex h-full w-64 flex-col bg-card border-r border-border select-none">
      {/* Brand Header */}
      <div className="p-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          {/* Company logo or initials avatar */}
          {bizProfile?.logoBase64 ? (
            <img
              src={bizProfile.logoBase64}
              alt={bizProfile.companyName || 'Logo'}
              className="h-8 max-w-[36px] object-contain rounded-lg"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : initials ? (
            <div className="size-8 rounded-xl bg-accent/20 text-accent font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {initials}
            </div>
          ) : (
            <div className="size-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
              <VaultBillLogo className="size-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-foreground truncate max-w-[120px]">
                {bizProfile?.companyName || 'VaultBill'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
                Suite
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">
              {bizProfile?.gstin ? `GSTIN: ${bizProfile.gstin}` : 'Multi-Currency'}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
        {/* Main Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Overview
          </p>
          {MAIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                  active
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Statutory Compliance Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Regulatory
            </p>
            <button
              onClick={() => setComplianceOpen(!complianceOpen)}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <ChevronDown className={cn('size-3.5 transition-transform', complianceOpen && 'rotate-180')} />
            </button>
          </div>

          {complianceOpen && (
            <div className="space-y-0.5 pt-0.5">
              {COMPLIANCE_NAV.map(({ href, label, icon: Icon, badge }: { href: string; label: string; icon: React.ElementType; badge?: string }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      active
                        ? 'bg-accent/15 text-accent font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            System
          </p>
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
              pathname === '/settings'
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
          >
            <Settings className="size-4 shrink-0" />
            <span>Settings</span>
          </Link>
          <Link
            href="/settings/profile"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              pathname.startsWith('/settings/profile')
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
          >
            <Building2 className="size-4 shrink-0" />
            <span>Business Profile</span>
          </Link>
          <Link
            href="/settings/email"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              pathname.startsWith('/settings/email')
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
          >
            <ScrollText className="size-4 shrink-0" />
            <span>Email Settings</span>
          </Link>
          <Link
            href="/settings/team"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              pathname.startsWith('/settings/team')
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
          >
            <UserCog className="size-4 shrink-0" />
            <span>Team & Access</span>
          </Link>
          <Link
            href="/settings/backups"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              pathname.startsWith('/settings/backups')
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
          >
            <ShieldCheck className="size-4 shrink-0" />
            <span>Backups</span>
          </Link>
        </div>
      </nav>

      {/* User Footer Card */}
      <div className="p-3 border-t border-border">
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name[0]?.toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-tight">{user?.name || 'Account'}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{user?.email || 'Logged in'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              title="Toggle dark/light theme"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}