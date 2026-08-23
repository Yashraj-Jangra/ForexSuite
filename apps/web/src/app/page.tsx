import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Illustration } from '@/components/ui/illustration';
import { VaultBillLogo } from '@/components/ui/logo';
import { Divider } from '@/components/ui/divider';
import { Shield, Globe, FileText, TrendingUp } from 'lucide-react';

const SCENARIO_CARDS = [
  { label: '08:42', title: 'Create an invoice in 3 currencies at once' },
  { label: '11:15', title: 'Auto-calculate GST based on customer location' },
  { label: '14:30', title: 'Track FEMA export realization deadlines' },
  { label: '16:50', title: 'Generate Form A2 for outward remittances' },
  { label: '19:10', title: 'Compile monthly FLM-8 statement in one click' },
  { label: '21:45', title: 'Receive FIRC alerts when payment comes in' },
];

const FAQS = [
  {
    q: 'What currencies does VaultBill support?',
    a: 'All major currencies including USD, EUR, GBP, JPY, AUD, and 150+ more. Rates sync hourly from RBI FBIL and open exchange APIs for real-time accuracy.',
  },
  {
    q: 'Is my data secure and compliant?',
    a: 'Yes. Each business gets its own isolated database schema. We support FEMA, LRS, and RBI reporting requirements with encrypted storage and automated backups.',
  },
  {
    q: 'Can I track export invoice compliance?',
    a: 'VaultBill monitors FEMA 270-day export realization deadlines, links FIRC documents to invoices, and auto-applies LUT numbers for zero-rated GST exports.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes. VaultBill is a Progressive Web App (PWA) — install it from your browser on any device. No app store required.',
  },
];

const FEATURES = [
  { icon: Globe, title: 'Multi-Currency', desc: 'Invoice in 150+ currencies with live exchange rates synced every hour.' },
  { icon: Shield, title: 'Compliance Ready', desc: 'FEMA, LRS, FLM-8 reporting built-in. Auto-generate Form A2s and track limits.' },
  { icon: FileText, title: 'Smart PDFs', desc: 'Pixel-perfect invoice PDFs with GST splits, LUT references, and payment links.' },
  { icon: TrendingUp, title: 'Live Dashboard', desc: 'Revenue analytics, compliance scorecard, and pending realization alerts at a glance.' },
];

export default function Home() {
  return (
    <>
      {/* ── Navigation ── */}
      <header className="fixed top-0 inset-x-0 z-40 flex justify-center pt-4 px-4">
        <nav className="flex items-center gap-6 px-5 py-2.5 bg-[hsl(var(--surface-overlay))] backdrop-blur-xl rounded-full border border-border/50 shadow-sm max-w-full">
          <a href="/" className="shrink-0" aria-label="VaultBill home">
            <VaultBillLogo className="size-8" />
          </a>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Features
          </a>
          <a href="#compliance" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Compliance
          </a>
          <Divider className="hidden sm:flex h-5 w-px bg-border" />
          <a href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </a>
          <Button size="sm" asChild>
            <a href="/signup">Start free</a>
          </Button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main>
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          {/* background blobs */}
          <span
            className="absolute top-1/4 -left-32 size-[500px] rounded-full opacity-30 blur-[120px] animate-float-slow"
            style={{ background: 'hsl(var(--accent) / 0.3)' }}
            aria-hidden="true"
          />
          <span
            className="absolute bottom-1/4 -right-32 size-[400px] rounded-full opacity-25 blur-[100px] animate-float"
            style={{ background: 'hsl(var(--accent-h) 50% 65% / 0.35)' }}
            aria-hidden="true"
          />

          <Container size="sm" className="text-center relative z-10">
            <Badge className="mb-6">Multi-currency invoicing platform</Badge>
            <h1 className="mb-6">
              Invoice across borders.{' '}
              <span className="font-accent text-accent">effortlessly.</span>
            </h1>
            <p className="text-lg md:text-xl max-w-lg mx-auto mb-10 text-muted-foreground">
              Self-hosted invoicing and compliance for businesses that operate in multiple currencies. GST, FEMA, LRS, and FLM-8 — all in one place.
            </p>
            <span className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <a href="/signup">Create your workspace</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#features">See how it works</a>
              </Button>
            </span>

            {/* hero illustration */}
            <Illustration
              name="hero"
              alt=""
              className="mt-16 mx-auto max-w-sm w-full animate-float-slow"
            />
          </Container>
        </section>

        {/* ── Scenario Scroll ── */}
        <section className="py-20 overflow-hidden">
          <Container>
            <h2 className="text-center mb-2">Designed for speed</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-md mx-auto">
              Every workflow is optimized so you spend less time in menus.
            </p>
          </Container>
          <section className="flex gap-4 overflow-x-auto px-4 sm:px-8 pb-4 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {SCENARIO_CARDS.map((card) => (
              <Card
                key={card.title}
                hover
                className="min-w-[280px] h-[160px] flex flex-col justify-between snap-start shrink-0"
              >
                <small className="text-muted-foreground">{card.label}</small>
                <p className="text-xl font-medium text-foreground">{card.title}</p>
              </Card>
            ))}
          </section>
        </section>

        {/* ── Features grid ── */}
        <Container id="features" className="py-20">
          <h2 className="text-center mb-2">Everything you need</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            Built for business owners who deal with multi-currency transactions and compliance.
          </p>
          <section className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} hover padding="lg" className="group">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="size-5" />
                </span>
                <h4 className="mb-2">{title}</h4>
                <p className="text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </section>
        </Container>

        {/* ── App Experience Preview ── */}
        <Container className="py-20">
          <section className="relative flex justify-center items-end gap-4 md:gap-8 h-[500px]">
            {[
              { offset: 'translate-y-12', opacity: 'opacity-80', color: 'bg-accent-soft' },
              { offset: '', opacity: '', color: 'bg-card' },
              { offset: 'translate-y-24', opacity: 'opacity-60', color: 'bg-accent-soft' },
            ].map((phone, i) => (
              <article
                key={i}
                className={`relative w-[240px] md:w-[260px] h-[400px] md:h-[480px] rounded-[2rem] border-4 border-border shadow-lg ${phone.offset} ${phone.opacity} ${phone.color} overflow-hidden hidden sm:block`}
              >
                <span className="absolute top-4 inset-x-0 flex justify-center">
                  <span className="w-16 h-1.5 rounded-full bg-muted-foreground/20" />
                </span>
                {i === 1 && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="animate-pulse-soft px-6 py-3 rounded-full bg-accent text-primary-foreground text-sm font-medium">
                      Breathe
                    </span>
                  </span>
                )}
              </article>
            ))}
            <Illustration name="dashboard" alt="" className="absolute bottom-0 sm:hidden max-w-xs w-full" />
          </section>
        </Container>

        {/* ── Compliance highlight ── */}
        <Container id="compliance" className="py-20">
          <Card padding="lg" className="text-center max-w-2xl mx-auto">
            <Badge variant="success" className="mb-4">Compliance</Badge>
            <h3 className="mb-3">Regulatory made simple</h3>
            <p className="text-muted-foreground mb-6">
              Auto-generate Form A2 for outward remittances, track FEMA 270-day export realization, compile monthly FLM-8 statements, and link FIRC documents — all with a few clicks.
            </p>
            <Illustration name="compliance" alt="" className="mx-auto max-w-xs w-full" />
          </Card>
        </Container>

        {/* ── FAQ ── */}
        <Container className="py-20">
          <h3 className="text-center mb-10">Frequently asked</h3>
          <section className="grid gap-3 max-w-2xl mx-auto">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border bg-card transition-colors duration-300">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-foreground select-none">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </summary>
                <p className="px-6 pb-4 text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </section>
        </Container>

        {/* ── CTA ── */}
        <Container className="py-20 pb-32">
          <Card padding="lg" className="text-center max-w-xl mx-auto relative overflow-hidden">
            <span
              className="absolute inset-0 opacity-20 blur-3xl"
              style={{ background: 'hsl(var(--accent) / 0.4)' }}
              aria-hidden="true"
            />
            <span className="relative z-10">
              <article className="inline-flex size-14 items-center justify-center rounded-2xl bg-foreground text-background mb-6">
                <Shield className="size-7" />
              </article>
              <h3 className="mb-3">Ready to simplify your invoicing?</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Free to start. No credit card. Self-host on your own infrastructure.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="h-12 px-5 rounded-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit" size="lg">
                  Get early access
                </Button>
              </form>
            </span>
          </Card>
        </Container>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <VaultBillLogo className="size-6" />
            VaultBill
          </span>
          <nav className="flex gap-6">
            <a href="/login" className="hover:text-foreground transition-colors">Sign in</a>
            <a href="/signup" className="hover:text-foreground transition-colors">Sign up</a>
            <a href="/settings/appearance" className="hover:text-foreground transition-colors">Appearance</a>
          </nav>
        </Container>
      </footer>
    </>
  );
}