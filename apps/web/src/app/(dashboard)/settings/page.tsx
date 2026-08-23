import { Card } from '@/components/ui/card';
import Link from 'next/link';

const SETTINGS_SECTIONS = [
  { href: '/settings/compliance', label: 'Compliance', desc: 'Enable exporter mode, money changer mode, or both' },
  { href: '/settings/rates', label: 'Exchange Rates', desc: 'Configure rate sync interval and providers' },
  { href: '/settings/appearance', label: 'Appearance', desc: 'Theme, accent color, and border radius' },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        {SETTINGS_SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card hover padding="md">
              <h3 className="font-medium mb-1">{s.label}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}