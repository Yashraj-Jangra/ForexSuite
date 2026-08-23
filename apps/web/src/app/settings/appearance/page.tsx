'use client';

import { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { ACCENT_PRESETS, RADIUS_PRESETS, type AccentId, type RadiusId, type ThemeMode } from '@/design-system';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Moon, Sun, Monitor, Check } from 'lucide-react';

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function AppearancePage() {
  const { mode, accent, radius, reducedMotion, setMode, setAccent, setRadius, setReducedMotion } = useTheme();
  const [saved, setSaved] = useState(false);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <Container size="sm" className="py-16">
      <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
        &larr; Back home
      </a>
      <h1 className="mb-1">Appearance</h1>
      <p className="text-muted-foreground mb-10">Customize how VaultBill looks and feels.</p>

      {/* Theme mode */}
      <Card padding="lg" className="mb-6">
        <h3 className="mb-4">Theme</h3>
        <section className="grid grid-cols-3 gap-3">
          {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setMode(value); flashSaved(); }}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border border-border transition-all duration-200',
                mode === value
                  ? 'bg-accent-soft border-accent/40 text-accent-soft-foreground'
                  : 'hover:bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </section>
      </Card>

      {/* Accent color */}
      <Card padding="lg" className="mb-6">
        <h3 className="mb-4">Accent color</h3>
        <section className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => { setAccent(preset.id as AccentId); flashSaved(); }}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-border transition-all duration-200',
                accent === preset.id
                  ? 'bg-accent-soft border-accent/40'
                  : 'hover:bg-muted',
              )}
            >
              <span
                className="size-5 rounded-full border-2 border-transparent ring-1 ring-border/50 shrink-0"
                style={{ background: `hsl(${preset.hsl})` }}
              />
              <span className="text-sm font-medium">{preset.name}</span>
              {accent === preset.id && <Check className="size-3.5 text-accent ml-0.5" />}
            </button>
          ))}
        </section>
      </Card>

      {/* Border radius */}
      <Card padding="lg" className="mb-6">
        <h3 className="mb-4">Border radius</h3>
        <section className="flex flex-wrap gap-3">
          {RADIUS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => { setRadius(preset.id as RadiusId); flashSaved(); }}
              className={cn(
                'px-4 py-2.5 rounded-full border border-border text-sm font-medium transition-all duration-200',
                radius === preset.id
                  ? 'bg-accent-soft border-accent/40 text-accent-soft-foreground'
                  : 'hover:bg-muted text-muted-foreground',
              )}
            >
              {preset.name}
            </button>
          ))}
        </section>
      </Card>

      {/* Reduced motion */}
      <Card padding="lg">
        <section className="flex items-center justify-between">
          <article>
            <h4 className="text-base mb-1">Reduced motion</h4>
            <p className="text-sm text-muted-foreground">Disable animations and transitions.</p>
          </article>
          <button
            role="switch"
            aria-checked={reducedMotion}
            onClick={() => { setReducedMotion(!reducedMotion); flashSaved(); }}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              reducedMotion ? 'bg-accent' : 'bg-muted',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                reducedMotion ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </section>
      </Card>

      {/* saved toast */}
      {saved && (
        <span className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium animate-reveal-up z-50">
          Preference saved
        </span>
      )}
    </Container>
  );
}