import { Card } from '@/components/ui/card';

const STATS = [
  { label: 'Total Revenue', value: '₹ 0', sub: 'This month' },
  { label: 'Invoices', value: '0', sub: '3 draft, 0 sent' },
  { label: 'Overdue', value: '0', sub: 'No pending' },
  { label: 'Compliance', value: 'All clear', sub: 'No alerts' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} padding="md">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}