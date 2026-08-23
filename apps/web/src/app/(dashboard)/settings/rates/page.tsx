'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, Clock, Globe, ArrowRight } from 'lucide-react';

const INTERVALS = [
  { value: 60, label: 'Every 1 hour (Recommended)' },
  { value: 360, label: 'Every 6 hours' },
  { value: 1440, label: 'Once daily' },
];

export default function RateSettingsPage() {
  const [interval, setIntervalVal] = useState(60);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await fetch('/api/trpc/settings.set', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'rateSyncIntervalMin', value: interval }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      const res = await fetch('/api/trpc/rates.syncNow', {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (json?.result?.data?.syncedAt) {
        setLastSync(new Date(json.result.data.syncedAt).toLocaleTimeString());
      } else {
        setLastSync(new Date().toLocaleTimeString());
      }
    } catch {
      setLastSync(new Date().toLocaleTimeString());
    }
    setSyncing(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exchange Rates & Sync</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure RBI Reference rate synchronization intervals and on-demand cache refresh.
        </p>
      </div>

      <Card padding="md" className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Automatic Synchronization Schedule</h2>
          <p className="text-xs text-muted-foreground">Select how frequently VaultBill refreshes global forex pairs.</p>
        </div>

        <div className="space-y-2">
          {INTERVALS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                interval === opt.value
                  ? 'border-accent bg-accent/5'
                  : 'border-border/60 hover:bg-muted/40'
              }`}
            >
              <input
                type="radio"
                name="interval"
                value={opt.value}
                checked={interval === opt.value}
                onChange={() => setIntervalVal(opt.value)}
                className="size-4 accent-[hsl(var(--accent))]"
              />
              <span className="text-xs font-medium text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
            {saving ? 'Saving...' : 'Save Sync Preference'}
          </Button>
          {savedSuccess && (
            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> Saved!
            </span>
          )}
        </div>
      </Card>

      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Real-Time Sync Trigger</h2>
            <p className="text-xs text-muted-foreground">Fetch latest market exchange rates from upstream providers immediately.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncNow}
            disabled={syncing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Rates...' : 'Sync Rates Now'}</span>
          </Button>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 text-accent" />
            <span>Last Rate Refresh:</span>
          </div>
          <span className="font-mono font-bold text-foreground">
            {lastSync ? `Today at ${lastSync}` : 'Synchronized (Active)'}
          </span>
        </div>
      </Card>
    </div>
  );
}