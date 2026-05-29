import { Ticket, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getServerApi } from '@/lib/api-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarList, Donut } from '@/components/ui/charts';

/**
 * Incident analytics. Server component that pulls aggregated counts from the
 * API and visualizes them with the lightweight chart components.
 */
export default async function AnalyticsPage() {
  let stats;
  let error: string | null = null;
  try {
    const api = await getServerApi();
    stats = await api.getStats();
  } catch (e) {
    error = (e as Error).message;
  }

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="p-4 text-sm text-rose-300">
          Couldn&apos;t load analytics: {error}
        </Card>
      </div>
    );
  }

  const kpis = [
    { label: 'Total tickets', value: stats.total, icon: Ticket },
    { label: 'Triaged', value: stats.triaged, icon: Sparkles },
    {
      label: 'Open',
      value: stats.total - stats.triaged,
      icon: AlertTriangle,
    },
    { label: 'SLA breached', value: stats.slaBreached, icon: ShieldAlert },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Incident Analytics</h1>
        <p className="text-muted-foreground">Live metrics across your service desk.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} hover className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{k.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Tickets by status</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut
              data={stats.byStatus.map((s) => ({ label: s.status, value: s.count }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Tickets by priority</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              data={stats.byPriority.map((p) => ({ label: p.priority, value: p.count }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Tickets by category (AI-assigned)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              data={stats.byCategory.map((c) => ({ label: c.category, value: c.count }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
