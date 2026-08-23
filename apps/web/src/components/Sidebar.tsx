'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/vendors', label: 'Vendors', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const COMPLIANCE_ITEMS = [
  { href: '/compliance/firc', label: 'FIRC', icon: Landmark },
  { href: '/compliance/lut', label: 'LUT', icon: ScrollText },
  { href: '/compliance/lrs', label: 'LRS / Form A2', icon: ArrowLeftRight },
  { href: '/compliance/flm8', label: 'FLM-8', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const [complianceOpen, setComplianceOpen] = useState(pathname.startsWith('/compliance'));

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <VaultBillLogo className="size-7" />
        <span className="font-semibold text-sm">VaultBill</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/5',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}

        <div className="pt-4">
          <button
            onClick={() => setComplianceOpen(!complianceOpen)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/5 w-full transition-colors"
          >
            <ShieldCheck className="size-4" />
            Compliance
            <span className="ml-auto text-xs">{complianceOpen ? '▾' : '▸'}</span>
          </button>

          {complianceOpen && (
            <div className="ml-2 mt-1 space-y-1">
              {COMPLIANCE_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/5',
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}