'use client';

import { useState } from 'react';
import { Sparkles, Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FinanceReportDTO } from '@aisolutiondesk/types';
import { useApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function Section({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: string[];
  tone: string;
}) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Icon className={`h-4 w-4 ${tone}`} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${tone.replace('text-', 'bg-')}`} />
              {it}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function FinanceReportClient() {
  const api = useApi();
  const [report, setReport] = useState<FinanceReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      setReport(await api.generateFinanceReport());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            AI-written analysis grounded on your monthly financials.
          </p>
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate report
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!report && !loading && !error && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Click <span className="font-medium text-foreground">Generate report</span> to
            have the AI analyze your revenue, burn, runway, and margins and write a
            summary with highlights, risks, and recommendations.
          </CardContent>
        </Card>
      )}

      {report && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {report.summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Section title="Highlights" icon={TrendingUp} items={report.highlights} tone="text-emerald-400" />
            <Section title="Risks" icon={AlertTriangle} items={report.risks} tone="text-amber-400" />
            <Section title="Recommendations" icon={CheckCircle2} items={report.recommendations} tone="text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
