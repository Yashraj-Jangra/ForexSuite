import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Illustration, type IllustrationProps } from '@/components/ui/illustration';

const SETTINGS_SECTIONS: {
  href: string;
  label: string;
  desc: string;
  illustration: IllustrationProps['name'];
  badge: string;
}[] = [
  {
    href: '/settings/account',
    label: 'Account & Security',
    desc: 'Manage your name, phone number, designation, role permissions, and active device sessions.',
    illustration: 'personalSettings',
    badge: 'Security',
  },
  {
    href: '/settings/profile',
    label: 'Company Profile & Invoice Styles',
    desc: 'Customize RBI licence, GSTIN/CIN, upload brand logo, and select from 5 PDF invoice templates.',
    illustration: 'reviewDesign',
    badge: '5 PDF Styles',
  },
  {
    href: '/settings/team',
    label: 'Team & RBAC Access',
    desc: 'Invite accountants, operators, and compliance officers with role-based permission matrices.',
    illustration: 'teamwork',
    badge: 'Permissions',
  },
  {
    href: '/settings/compliance',
    label: 'Compliance & Modules',
    desc: 'Toggle Exporter Mode (LUT / FIRC / 270-day tracker) and FFMC Money Changer Mode (FLM-8).',
    illustration: 'compliance',
    badge: 'RBI & FEMA',
  },
  {
    href: '/settings/email',
    label: 'Email & SMTP Gateway',
    desc: 'Configure VaultBill cloud delivery, 1-click Gmail OAuth, or custom corporate SMTP.',
    illustration: 'messageSent',
    badge: 'Delivery',
  },
  {
    href: '/settings/backups',
    label: 'Automated Backups & Storage',
    desc: 'Multi-target encryption backups to local disk, Google Drive OAuth, or AWS S3 buckets.',
    illustration: 'vault',
    badge: 'Zero-Knowledge',
  },
  {
    href: '/settings/rates',
    label: 'Exchange Rates & Sync',
    desc: 'Configure automated RBI Reference rate synchronization schedules and on-demand cache refresh.',
    illustration: 'cloudSync',
    badge: 'Live Feed',
  },
  {
    href: '/settings/appearance',
    label: 'Appearance & Theme',
    desc: 'Customize workspace dark / light theme, accent colors, and custom border radius.',
    illustration: 'darkMode',
    badge: 'Custom UI',
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace &amp; Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure statutory compliance engines, personal account details, multi-channel email, and brand styling.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card hover padding="md" className="h-full flex flex-col justify-between p-5 border-border/80 hover:border-accent transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                      {s.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">
                    {s.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                <div className="size-16 shrink-0 flex items-center justify-center p-1 rounded-2xl bg-card border border-border/50 shadow-xs group-hover:scale-105 transition-transform">
                  <Illustration name={s.illustration} size="sm" className="w-12 h-12 object-contain" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-accent transition-colors">
                <span>Configure Settings</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}