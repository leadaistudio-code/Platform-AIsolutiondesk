import { InsightsPanel } from '@/components/sales/insights-panel';

/** AI Insights — the AI analyzes your pipeline and suggests next actions. */
export default function SalesInsightsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          Let the AI review your pipeline and surface prioritized next actions.
        </p>
      </div>
      <InsightsPanel />
    </div>
  );
}
