import { Users, CheckCircle2, Trophy, Gauge } from 'lucide-react';
import type { SalesAnalyticsDTO } from '@aisolutiondesk/types';
import { getServerApi } from '@/lib/api-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarList, Donut } from '@/components/ui/charts';

/** Sales Analytics — pipeline metrics and distributions. */
export default async function SalesAnalyticsPage() {
  let stats: SalesAnalyticsDTO | undefined;
  let error: string | null = null;
  try {
    const api = await getServerApi();
    stats = await api.getSalesAnalytics();
  } catch (e) {
    error = (e as Error).message;
  }

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="p-4 text-sm text-rose-300">Couldn&apos;t load analytics: {error}</Card>
      </div>
    );
  }

  const kpis = [
    { label: 'Total leads', value: stats.totalLeads, icon: Users },
    { label: 'Qualified', value: stats.qualified, icon: CheckCircle2 },
    { label: 'Won', value: stats.won, icon: Trophy },
    { label: 'Avg. score', value: stats.avgScore, icon: Gauge },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales Analytics</h1>
        <p className="text-muted-foreground">A live view of your pipeline.</p>
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
            <CardTitle className="text-foreground">Leads by status</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut data={stats.byStatus.map((s) => ({ label: s.status, value: s.count }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Score distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={stats.scoreBuckets.map((b) => ({ label: b.label, value: b.count }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold">{stats.outreachCount}</p>
          <p className="text-sm text-muted-foreground">Outreach sent</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold">{stats.proposalCount}</p>
          <p className="text-sm text-muted-foreground">Proposals</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold">{stats.lost}</p>
          <p className="text-sm text-muted-foreground">Lost</p>
        </Card>
      </div>
    </div>
  );
}
