'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Layers, CheckCircle2 } from 'lucide-react';

export default function ComplianceSettingsPage() {
  const [exporter, setExporter] = useState(true);
  const [moneyChanger, setMoneyChanger] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/trpc/settings.get', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        const settingsData = j?.result?.data;
        const val = settingsData?.compliance;
        if (val) {
          if (typeof val.exporter === 'boolean') setExporter(val.exporter);
          if (typeof val.moneyChanger === 'boolean') setMoneyChanger(val.moneyChanger);
        }
      })
      .catch(() => {});
  }, []);


  async function handleSave() {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await fetch('/api/trpc/settings.set', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'compliance', value: { exporter, moneyChanger } }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance & Operational Modes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enable or disable statutory reporting engines based on your legal business classification.
        </p>
      </div>

      <div className="space-y-4">
        {/* Exporter Mode */}
        <Card padding="md" className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 mt-0.5">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Service / Goods Exporter Mode</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enables Letter of Undertaking (LUT) zero-rated GST, FIRC advice linking, and FEMA 270-day export realization monitoring.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={exporter}
            onClick={() => setExporter(!exporter)}
            className={`relative h-6 w-11 rounded-full shrink-0 transition-colors ${
              exporter ? 'bg-accent' : 'bg-muted border border-border'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                exporter ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </Card>

        {/* Money Changer Mode */}
        <Card padding="md" className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 mt-0.5">
              <Layers className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">FFMC / Money Changer Mode</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enables RBI FLM-8 Monthly Returns, statutory currency balance verification, and forex transaction logs.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={moneyChanger}
            onClick={() => setMoneyChanger(!moneyChanger)}
            className={`relative h-6 w-11 rounded-full shrink-0 transition-colors ${
              moneyChanger ? 'bg-accent' : 'bg-muted border border-border'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                moneyChanger ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </Card>

        <div className="flex items-center gap-3 pt-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs">
            {saving ? 'Saving...' : 'Save Compliance Settings'}
          </Button>
          {savedSuccess && (
            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> Settings updated successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}