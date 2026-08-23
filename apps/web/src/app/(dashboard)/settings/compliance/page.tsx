'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ComplianceSettingsPage() {
  const [exporter, setExporter] = useState(true);
  const [moneyChanger, setMoneyChanger] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Compliance Settings</h1>
      <p className="text-muted-foreground">Enable compliance features for your workspace</p>

      <div className="grid gap-4 max-w-lg">
        <Card padding="md" className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Exporter Mode</h3>
            <p className="text-sm text-muted-foreground">LUT, FIRC, and FEMA 270-day tracker</p>
          </div>
          <button
            onClick={() => setExporter(!exporter)}
            className={`relative h-6 w-11 rounded-full transition-colors ${exporter ? 'bg-accent' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${exporter ? 'translate-x-5' : ''}`} />
          </button>
        </Card>

        <Card padding="md" className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Money Changer Mode</h3>
            <p className="text-sm text-muted-foreground">FLM-8 monthly statements and forex transactions</p>
          </div>
          <button
            onClick={() => setMoneyChanger(!moneyChanger)}
            className={`relative h-6 w-11 rounded-full transition-colors ${moneyChanger ? 'bg-accent' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${moneyChanger ? 'translate-x-5' : ''}`} />
          </button>
        </Card>

        <Button size="sm" className="w-fit">Save settings</Button>
      </div>
    </div>
  );
}