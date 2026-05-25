'use client';

import { useState } from 'react';
import { Lightbulb, Loader2, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import type { SalesInsightsDTO, SalesInsight } from '@aisolutiondesk/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api-client';

const severityStyle: Record<SalesInsight['severity'], { icon: typeof Info; cls: string }> = {
  opportunity: { icon: TrendingUp, cls: 'text-emerald-400' },
  risk: { icon: AlertTriangle, cls: 'text-rose-400' },
  info: { icon: Info, cls: 'text-sky-400' },
};

/** Generates AI insights about the pipeline on demand (avoids cost on every visit). */
export function InsightsPanel() {
  const api = useApi();
  const [data, setData] = useState<SalesInsightsDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      setData(await api.getSalesInsights());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={run} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
        {busy ? 'Analyzing pipeline…' : data ? 'Refresh insights' : 'Generate insights'}
      </Button>

      {error && <Card className="p-4 text-sm text-rose-300">{error}</Card>}

      {data && (
        <>
          {data.summary && (
            <Card className="p-4">
              <p className="text-sm">{data.summary}</p>
            </Card>
          )}
          <div className="space-y-2">
            {data.insights.map((ins, i) => {
              const s = severityStyle[ins.severity];
              const Icon = s.icon;
              return (
                <Card key={i} className="p-4">
                  <div className="flex gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.cls}`} />
                    <div>
                      <p className="font-medium">{ins.title}</p>
                      <p className="text-sm text-muted-foreground">{ins.detail}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
            {data.insights.length === 0 && (
              <Card className="p-4 text-sm text-muted-foreground">{data.summary}</Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
