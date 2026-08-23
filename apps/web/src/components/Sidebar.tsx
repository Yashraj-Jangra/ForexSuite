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
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <VaultBillLogo className="size-7" />
        <span className="font-semibold text-sm">VaultBill</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
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
      </nav>

      <div className="border-t border-border px-5 py-3">
        <Link href="/settings" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ShieldCheck className="size-3.5" />
          Compliance
        </Link>
      </div>
    </aside>
  );
}