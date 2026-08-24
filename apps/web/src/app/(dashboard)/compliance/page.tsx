import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Illustration, type IllustrationProps } from '@/components/ui/illustration';

const COMPLIANCE_SUITES: {
  href: string;
  label: string;
  desc: string;
  badge: string;
  badgeColor: string;
  illustration: IllustrationProps['name'];
}[] = [
  {
    href: '/compliance/firc',
    label: 'e-FIRC Reconciliation Manager',
    desc: 'Match inward foreign remittances, AD bank reference numbers, purpose codes, and invoice realization.',
    badge: 'EDPMS Ready',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    illustration: 'confidentialLetter',
  },
  {
    href: '/compliance/lut',
    label: 'GST RFD-11 LUT Registry',
    desc: 'Track annual Letters of Undertaking for zero-rated SEZ/overseas exports with 30-day renewal warnings.',
    badge: 'Zero-Rated GST',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    illustration: 'diaryRegister',
  },
  {
    href: '/compliance/lrs',
    label: 'LRS / Form A2 & TCS Engine',
    desc: 'Automated 20% / 7% TCS calculation, cumulative annual PAN threshold tracking, and Form A2 generation.',
    badge: 'TCS & LRS',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    illustration: 'currencyExchange',
  },
  {
    href: '/compliance/flm8',
    label: 'RBI FLM-8 Return Compiler',
    desc: 'One-click automated compilation of monthly RBI FLM-8 returns from live transaction ledgers.',
    badge: 'RBI Master Circular',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    illustration: 'databaseTables',
  },
  {
    href: '/compliance/flm1-7',
    label: 'Daily Stock & Balance Registers (FLM 1-7)',
    desc: 'Maintain statutory daily physical currency balances, traveler cheques stock, and foreign coin ledgers.',
    badge: 'FFMC Daily',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    illustration: 'fileAnalysis',
  },
  {
    href: '/compliance/edf',
    label: 'EDF / SOFTEX Export Declarations',
    desc: 'Manage RBI export declaration forms for physical goods and software technology exports under FEMA.',
    badge: 'SOFTEX / STPI',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    illustration: 'starlink',
  },
];

export default function CompliancePage() {
  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="size-6 text-accent" />
            Statutory Compliance Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated RBI Master Direction, FEMA 1999, GST RFD-11, and EDPMS statutory reporting modules.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20">
          <Sparkles className="size-3.5" />
          <span>6 Regulatory Engines Active</span>
        </div>
      </div>

      {/* Grid of Compliance Suites */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COMPLIANCE_SUITES.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card hover padding="md" className="h-full flex flex-col justify-between p-5 border-border/80 hover:border-accent transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                  <div className="size-14 shrink-0 flex items-center justify-center p-1 rounded-2xl bg-card border border-border/50 shadow-xs group-hover:scale-105 transition-transform">
                    <Illustration name={s.illustration} size="sm" className="w-11 h-11 object-contain" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">
                    {s.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                    {s.desc}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-accent transition-colors">
                <span>Open Module</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}