import type { CompletionRequest, CompletionResult } from '../../providers/types';
import { type AgentDefinition, END } from '../../graph/types';

/**
 * The Service Desk triage agent. Given a raw ticket, it asks the model to
 * classify, prioritize, summarize, find a likely root cause, and suggest next
 * actions — all in one structured pass. Built on the agent-graph engine so it's
 * traceable and easy to extend (e.g. add a KB-retrieval node later).
 */

/** A function that performs one model completion (provided by the API layer). */
export type CompleteFn = (req: CompletionRequest) => Promise<CompletionResult>;

export interface TriageInput {
  subject: string;
  description: string;
}

export interface TriageAnalysis {
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  rootCause: string;
  suggestedActions: string[];
  sentiment: number; // -1 (angry) .. 1 (happy)
}

export interface TriageState extends TriageInput {
  analysis?: TriageAnalysis;
  model: string;
}

const SYSTEM_PROMPT = `You are an expert IT service-desk triage agent.
Analyze the support ticket and respond with ONLY a JSON object (no markdown) of the form:
{
  "category": "short category, e.g. Network, Hardware, Access, Software, Email",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "one or two sentence summary for an engineer",
  "rootCause": "the most likely root cause",
  "suggestedActions": ["concrete next step", "..."],
  "sentiment": number between -1 and 1 reflecting the requester's tone
}`;

function safeParse(content: string): TriageAnalysis | null {
  try {
    // Strip accidental code fences before parsing.
    const cleaned = content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const obj = JSON.parse(cleaned);
    if (!obj.category || !obj.priority) return null;
    return {
      category: String(obj.category),
      priority: obj.priority,
      summary: String(obj.summary ?? ''),
      rootCause: String(obj.rootCause ?? ''),
      suggestedActions: Array.isArray(obj.suggestedActions)
        ? obj.suggestedActions.map(String)
        : [],
      sentiment: typeof obj.sentiment === 'number' ? obj.sentiment : 0,
    };
  } catch {
    return null;
  }
}

export function createTriageAgent(complete: CompleteFn): AgentDefinition<TriageState> {
  return {
    key: 'service_desk.triage',
    entry: 'analyze',
    nodes: {
      analyze: async (state, ctx) => {
        const started = Date.now();
        const res = await complete({
          model: state.model,
          temperature: 0,
          maxTokens: 700,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Subject: ${state.subject}\n\nDescription:\n${state.description}`,
            },
          ],
        });

        const analysis = safeParse(res.content);
        ctx.trace({
          node: 'analyze',
          startedAt: started,
          finishedAt: Date.now(),
          tokensInput: res.usage.input,
          tokensOutput: res.usage.output,
          note: analysis ? 'parsed ok' : 'parse failed',
        });

        if (!analysis) {
          throw new Error('Triage model returned unparseable output');
        }
        return { patch: { analysis }, next: END };
      },
    },
  };
}
