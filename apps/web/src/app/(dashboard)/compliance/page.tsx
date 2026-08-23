import { Card } from '@/components/ui/card';
import Link from 'next/link';

const SECTIONS = [
  { href: '/compliance/firc', label: 'FIRC Manager', desc: 'Upload and match inward remittance certificates to invoices' },
  { href: '/compliance/lut', label: 'LUT Registry', desc: 'Manage Letters of Undertaking for zero-rated exports' },
  { href: '/compliance/lrs', label: 'LRS / Form A2', desc: 'Track outward remittances and generate Form A2 PDFs' },
  { href: '/compliance/flm8', label: 'FLM-8', desc: 'Compile monthly RBI returns for money changers' },
];

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Compliance Center</h1>
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        {SECTIONS.map((s) => (
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