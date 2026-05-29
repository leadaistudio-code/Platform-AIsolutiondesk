import type { CompletionRequest, CompletionResult } from '../../providers/types';
import { type AgentDefinition, END } from '../../graph/types';

/**
 * The outreach-writing agent. Generates a personalized first-touch message for
 * a lead on a given channel (email / LinkedIn / WhatsApp / SMS).
 */
type CompleteFn = (req: CompletionRequest) => Promise<CompletionResult>;

export interface OutreachInput {
  fullName: string;
  company?: string | null;
  title?: string | null;
  channel: string;
  notes?: string;
}

export interface OutreachDraft {
  subject: string;
  body: string;
}

export interface OutreachState extends OutreachInput {
  model: string;
  draft?: OutreachDraft;
}

function systemFor(channel: string): string {
  const lengthHint =
    channel === 'EMAIL'
      ? '80-130 words'
      : channel === 'LINKEDIN'
        ? 'under 80 words, no subject needed'
        : 'under 50 words, casual';
  return `You are an expert SDR writing a ${channel} outreach message for an AI software platform.
Write a concise, personalized, non-spammy first-touch message (${lengthHint}) with a clear,
low-friction call to action. Respond with ONLY JSON:
{ "subject": "compelling subject (empty string if not email)", "body": "the message" }`;
}

function parse(content: string): OutreachDraft | null {
  try {
    const obj = JSON.parse(content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    if (typeof obj.body !== 'string') return null;
    return { subject: String(obj.subject ?? ''), body: obj.body };
  } catch {
    return null;
  }
}

export function createOutreachWriterAgent(
  complete: CompleteFn,
): AgentDefinition<OutreachState> {
  return {
    key: 'sales.outreach_writer',
    entry: 'write',
    nodes: {
      write: async (state, ctx) => {
        const started = Date.now();
        const res = await complete({
          model: state.model,
          temperature: 0.6,
          maxTokens: 500,
          messages: [
            { role: 'system', content: systemFor(state.channel) },
            {
              role: 'user',
              content:
                `Lead: ${state.fullName}, ${state.title ?? 'unknown role'} at ${state.company ?? 'unknown company'}.` +
                (state.notes ? `\nExtra context: ${state.notes}` : ''),
            },
          ],
        });
        const draft = parse(res.content);
        ctx.trace({
          node: 'write',
          startedAt: started,
          finishedAt: Date.now(),
          tokensInput: res.usage.input,
          tokensOutput: res.usage.output,
        });
        if (!draft) throw new Error('Outreach writer returned unparseable output');
        return { patch: { draft }, next: END };
      },
    },
  };
}
