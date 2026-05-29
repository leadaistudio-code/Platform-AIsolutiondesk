import type { CompletionRequest, CompletionResult } from '../../providers/types';
import { type AgentDefinition, END } from '../../graph/types';

/**
 * The lead-scoring agent. Given a lead's profile, it produces a 0–100 fit
 * score with reasoning and a short qualification — to help reps prioritize.
 */
type CompleteFn = (req: CompletionRequest) => Promise<CompletionResult>;

export interface LeadProfile {
  fullName: string;
  company?: string | null;
  title?: string | null;
  email?: string | null;
}

export interface LeadScore {
  score: number; // 0-100
  reason: string;
  fit: 'low' | 'medium' | 'high';
  intent: 'low' | 'medium' | 'high';
}

export interface LeadScoreState extends LeadProfile {
  model: string;
  score?: LeadScore;
}

const SYSTEM = `You are a B2B sales lead-qualification expert for an AI software platform.
Score the lead from 0-100 on how good a prospect they are (seniority, company fit,
likely budget/authority). Respond with ONLY JSON:
{ "score": 0-100, "fit": "low|medium|high", "intent": "low|medium|high", "reason": "1-2 sentences" }`;

function parse(content: string): LeadScore | null {
  try {
    const obj = JSON.parse(content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    if (typeof obj.score !== 'number') return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(obj.score))),
      reason: String(obj.reason ?? ''),
      fit: obj.fit ?? 'medium',
      intent: obj.intent ?? 'medium',
    };
  } catch {
    return null;
  }
}

export function createLeadScorerAgent(
  complete: CompleteFn,
): AgentDefinition<LeadScoreState> {
  return {
    key: 'sales.lead_scorer',
    entry: 'score',
    nodes: {
      score: async (state, ctx) => {
        const started = Date.now();
        const res = await complete({
          model: state.model,
          temperature: 0,
          maxTokens: 300,
          messages: [
            { role: 'system', content: SYSTEM },
            {
              role: 'user',
              content: `Lead:\nName: ${state.fullName}\nTitle: ${state.title ?? 'unknown'}\nCompany: ${state.company ?? 'unknown'}\nEmail: ${state.email ?? 'unknown'}`,
            },
          ],
        });
        const score = parse(res.content);
        ctx.trace({
          node: 'score',
          startedAt: started,
          finishedAt: Date.now(),
          tokensInput: res.usage.input,
          tokensOutput: res.usage.output,
        });
        if (!score) throw new Error('Lead scorer returned unparseable output');
        return { patch: { score }, next: END };
      },
    },
  };
}
