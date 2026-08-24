import { Card } from '@/components/ui/card';
import Link from 'next/link';
import {
  ShieldCheck,
  RefreshCw,
  Palette,
  ArrowRight,
  User,
  Building2,
  Users,
  Mail,
  Database,
} from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    href: '/settings/account',
    label: 'Account & Security',
    desc: 'Manage your name, phone number, designation, role permissions, and active device sessions.',
    icon: User,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  },
  {
    href: '/settings/profile',
    label: 'Company Profile & Invoice Styles',
    desc: 'Customize RBI licence, GSTIN/CIN, upload brand logo, and select from 5 PDF invoice templates.',
    icon: Building2,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  },
  {
    href: '/settings/team',
    label: 'Team & RBAC Access',
    desc: 'Invite accountants, operators, and compliance officers with role-based permission matrices.',
    icon: Users,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  },
  {
    href: '/settings/compliance',
    label: 'Compliance & Modules',
    desc: 'Toggle Exporter Mode (LUT / FIRC / 270-day tracker) and FFMC Money Changer Mode (FLM-8).',
    icon: ShieldCheck,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  },
  {
    href: '/settings/email',
    label: 'Email & SMTP Gateway',
    desc: 'Configure VaultBill cloud delivery, 1-click Gmail OAuth, or custom corporate SMTP.',
    icon: Mail,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
  },
  {
    href: '/settings/backups',
    label: 'Automated Backups & Storage',
    desc: 'Multi-target encryption backups to local disk, Google Drive OAuth, or AWS S3 buckets.',
    icon: Database,
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
  },
  {
    href: '/settings/rates',
    label: 'Exchange Rates & Sync',
    desc: 'Configure automated RBI Reference rate synchronization schedules and on-demand cache refresh.',
    icon: RefreshCw,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
  },
  {
    href: '/settings/appearance',
    label: 'Appearance & Theme',
    desc: 'Customize workspace dark / light theme, accent colors, and custom border radius.',
    icon: Palette,
    color: 'text-accent bg-accent/10',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace &amp; Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure statutory compliance engines, personal account details, multi-channel email, and brand styling.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card hover padding="md" className="h-full flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${s.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground mt-2">{s.label}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{s.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}