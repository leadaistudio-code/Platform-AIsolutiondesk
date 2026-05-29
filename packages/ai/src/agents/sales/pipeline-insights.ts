import type { CompletionRequest, CompletionResult } from '../../providers/types';
import { type AgentDefinition, END } from '../../graph/types';

/**
 * Analyzes a snapshot of the sales pipeline and returns a short summary plus
 * a few prioritized, actionable insights.
 */
type CompleteFn = (req: CompletionRequest) => Promise<CompletionResult>;

export interface PipelineInsight {
  title: string;
  detail: string;
  severity: 'info' | 'opportunity' | 'risk';
}

export interface InsightsState {
  model: string;
  /** A compact text snapshot of the pipeline (counts, top leads, etc.). */
  snapshot: string;
  result?: { summary: string; insights: PipelineInsight[] };
}

const SYSTEM = `You are a sales operations analyst. Given a snapshot of a sales pipeline,
return a brief summary and 3-5 prioritized, concrete insights/next-actions.
Respond with ONLY JSON:
{ "summary": "1-2 sentences", "insights": [ { "title": "...", "detail": "...", "severity": "info|opportunity|risk" } ] }`;

function parse(content: string): InsightsState['result'] | null {
  try {
    const obj = JSON.parse(content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    if (!Array.isArray(obj.insights)) return null;
    return {
      summary: String(obj.summary ?? ''),
      insights: obj.insights.slice(0, 6).map((i: any) => ({
        title: String(i.title ?? ''),
        detail: String(i.detail ?? ''),
        severity: ['info', 'opportunity', 'risk'].includes(i.severity) ? i.severity : 'info',
      })),
    };
  } catch {
    return null;
  }
}

export function createPipelineInsightsAgent(
  complete: CompleteFn,
): AgentDefinition<InsightsState> {
  return {
    key: 'sales.pipeline_insights',
    entry: 'analyze',
    nodes: {
      analyze: async (state, ctx) => {
        const started = Date.now();
        const res = await complete({
          model: state.model,
          temperature: 0.3,
          maxTokens: 700,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: `Pipeline snapshot:\n${state.snapshot}` },
          ],
        });
        const result = parse(res.content);
        ctx.trace({
          node: 'analyze',
          startedAt: started,
          finishedAt: Date.now(),
          tokensInput: res.usage.input,
          tokensOutput: res.usage.output,
        });
        if (!result) throw new Error('Insights agent returned unparseable output');
        return { patch: { result }, next: END };
      },
    },
  };
}
