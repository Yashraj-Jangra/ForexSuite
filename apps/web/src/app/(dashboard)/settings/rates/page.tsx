'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const INTERVALS = [
  { value: 60, label: 'Every 1 hour' },
  { value: 360, label: 'Every 6 hours' },
  { value: 1440, label: 'Once daily' },
];

export default function RateSettingsPage() {
  const [interval, setInterval] = useState(60);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Exchange Rates</h1>
      <p className="text-muted-foreground">Configure how often rates are fetched and cached</p>

      <Card padding="md" className="max-w-lg">
        <h3 className="font-medium mb-3">Sync interval</h3>
        <div className="space-y-2">
          {INTERVALS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="interval"
                value={opt.value}
                checked={interval === opt.value}
                onChange={() => setInterval(opt.value)}
                className="accent-[hsl(var(--accent))]"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        <Button size="sm" className="mt-4">Save</Button>
      </Card>

      <Card padding="md" className="max-w-lg">
        <h3 className="font-medium mb-2">Last synced</h3>
        <p className="text-sm text-muted-foreground">No sync yet</p>
        <Button variant="outline" size="sm" className="mt-2">Sync now</Button>
      </Card>
    </div>
  );
}