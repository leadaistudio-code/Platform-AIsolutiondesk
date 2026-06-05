'use client';

import { useEffect, useState } from 'react';
import { LineChart, TrendingUp, TrendingDown, Wallet, Banknote } from 'lucide-react';
import type { FinanceMetricsDTO } from '@aisolutiondesk/types';
import { useApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const usd = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : `$${n}`;
const usdFull = (n: number) => `$${n.toLocaleString()}`;

export function FinanceOverviewClient() {
  const api = useApi();
  const [data, setData] = useState<FinanceMetricsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getFinanceMetrics()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [api]);

  const burning = (data?.netBurn ?? 0) < 0;
  const max = Math.max(
    1,
    ...(data?.series ?? []).flatMap((p) => [p.revenue, p.expenses]),
  );

  const kpis = data
    ? [
        { label: 'MRR (latest revenue)', value: usdFull(data.mrr), icon: TrendingUp },
        {
          label: burning ? 'Net monthly burn' : 'Net monthly profit',
          value: usdFull(Math.abs(data.netBurn)),
          icon: burning ? TrendingDown : TrendingUp,
        },
        {
          label: 'Runway',
          value: data.runwayMonths !== null ? `${data.runwayMonths} mo` : 'Profitable',
          icon: LineChart,
        },
        { label: 'Cash on hand', value: usdFull(data.cash), icon: Banknote },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <LineChart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Finance Analysis</h1>
          <p className="text-muted-foreground">
            Live KPIs computed from your monthly financial snapshots.
          </p>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!data && !error && (
        <p className="text-sm text-muted-foreground">Loading metrics…</p>
      )}

      {data && !data.hasData && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No financial snapshots yet. Seed data or connect your finance source to
            see KPIs here.
          </CardContent>
        </Card>
      )}

      {data?.hasData && (
        <>
          {/* KPI tiles */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <Card key={k.label}>
                  <CardContent className="pt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{k.label}</span>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold">{k.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Secondary stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                {data.revenueGrowthPct >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-rose-400" />
                )}
                <div>
                  <div className="text-lg font-semibold">
                    {data.revenueGrowthPct >= 0 ? '+' : ''}
                    {data.revenueGrowthPct}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Month-over-month revenue growth
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-lg font-semibold">{data.marginPct}%</div>
                  <div className="text-sm text-muted-foreground">
                    Operating margin (latest month)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue vs expenses chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Revenue vs. expenses
              </CardTitle>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/70" /> Expenses
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex h-56 items-end gap-3 overflow-x-auto">
                {data.series.map((p) => (
                  <div key={p.period} className="flex min-w-[36px] flex-1 flex-col items-center gap-2">
                    <div className="flex h-44 w-full items-end justify-center gap-1">
                      <div
                        className="w-1/2 rounded-t bg-primary"
                        style={{ height: `${(p.revenue / max) * 100}%` }}
                        title={`Revenue ${usdFull(p.revenue)}`}
                      />
                      <div
                        className="w-1/2 rounded-t bg-rose-400/70"
                        style={{ height: `${(p.expenses / max) * 100}%` }}
                        title={`Expenses ${usdFull(p.expenses)}`}
                      />
                    </div>
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {p.label.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Latest cash balance: {usd(data.cash)} · {data.series.length} months of history
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
