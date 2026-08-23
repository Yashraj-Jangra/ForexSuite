import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, Palette, ArrowRight } from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    href: '/settings/compliance',
    label: 'Compliance & Modules',
    desc: 'Toggle Exporter Mode (LUT / FIRC / 270-day tracker) and FFMC Money Changer Mode (FLM-8).',
    icon: ShieldCheck,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  },
  {
    href: '/settings/rates',
    label: 'Exchange Rates & Sync',
    desc: 'Configure automated RBI Reference rate synchronization schedules and on-demand cache refresh.',
    icon: RefreshCw,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure statutory compliance engines, currency feeds, and UI customization.
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