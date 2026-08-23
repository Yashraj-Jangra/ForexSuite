'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/providers/ThemeProvider';
import { ACCENT_PRESETS, RADIUS_PRESETS, type AccentId, type RadiusId, type ThemeMode } from '@/design-system';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Moon, Sun, Monitor, Check, ArrowLeft } from 'lucide-react';

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
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <Container size="sm" className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Appearance</h1>
          <p className="text-sm text-muted-foreground">Customize how VaultBill looks and feels on this device.</p>
        </div>
      </div>

      {/* Theme mode */}
      <Card padding="md">
        <h3 className="text-sm font-semibold mb-3">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setMode(value); flashSaved(); }}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200',
                mode === value
                  ? 'bg-accent/10 border-accent text-accent font-medium shadow-sm'
                  : 'border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-5" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Accent color */}
      <Card padding="md">
        <h3 className="text-sm font-semibold mb-3">Accent color</h3>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => { setAccent(preset.id as AccentId); flashSaved(); }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-200',
                accent === preset.id
                  ? 'bg-accent/10 border-accent font-medium shadow-sm'
                  : 'border-border/60 hover:bg-muted/50',
              )}
            >
              <span
                className="size-4 rounded-full ring-1 ring-border/50 shrink-0"
                style={{ background: `hsl(${preset.hsl})` }}
              />
              <span className="text-sm">{preset.name}</span>
              {accent === preset.id && <Check className="size-3.5 text-accent ml-0.5" />}
            </button>
          ))}
        </div>
      </Card>

      {/* Border radius */}
      <Card padding="md">
        <h3 className="text-sm font-semibold mb-3">Border radius</h3>
        <div className="flex flex-wrap gap-2.5">
          {RADIUS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => { setRadius(preset.id as RadiusId); flashSaved(); }}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm transition-all duration-200',
                radius === preset.id
                  ? 'bg-accent/10 border-accent text-accent font-medium shadow-sm'
                  : 'border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground',
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Reduced motion */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold mb-0.5">Reduced motion</h4>
            <p className="text-xs text-muted-foreground">Minimize high-frequency transitions and dynamic animations.</p>
          </div>
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
        </div>
      </Card>

      {/* saved toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 px-4 py-2 rounded-full bg-card border border-border text-foreground text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50 flex items-center gap-2">
          <span className="size-2 rounded-full bg-green-500 inline-block" />
          Preference saved
        </div>
      )}
    </Container>
  );
}
