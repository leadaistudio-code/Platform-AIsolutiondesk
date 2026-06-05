'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Loader2, Sparkles } from 'lucide-react';
import type { FinanceForecastDTO } from '@aisolutiondesk/types';
import { useApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const usdFull = (n: number) => `$${n.toLocaleString()}`;

export function FinanceForecastClient() {
  const api = useApi();
  const [data, setData] = useState<FinanceForecastDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .generateFinanceForecast()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load forecast'));
  }, [api]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forecast</h1>
          <p className="text-muted-foreground">
            6-month projection from your recent trend, with an AI outlook.
          </p>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!data && !error && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Projecting…
        </p>
      )}

      {data && data.months.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No financial data yet to forecast from.
          </CardContent>
        </Card>
      )}

      {data && data.months.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> AI outlook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {data.commentary}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Projected months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Month</th>
                      <th className="py-2 pr-4 font-medium">Revenue</th>
                      <th className="py-2 pr-4 font-medium">Expenses</th>
                      <th className="py-2 font-medium">Projected cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.months.map((m) => (
                      <tr key={m.period} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium text-foreground">{m.label}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{usdFull(m.projectedRevenue)}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{usdFull(m.projectedExpenses)}</td>
                        <td className="py-2 text-muted-foreground">{usdFull(m.projectedCash)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
