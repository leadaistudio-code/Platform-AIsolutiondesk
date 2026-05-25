import type { CompletionRequest, CompletionResult } from '../../providers/types';
import { type AgentDefinition, END } from '../../graph/types';

/**
 * Generates a professional sales proposal (markdown) tailored to a lead.
 */
type CompleteFn = (req: CompletionRequest) => Promise<CompletionResult>;

export interface ProposalInput {
  fullName: string;
  company?: string | null;
  title?: string | null;
  notes?: string;
}

export interface ProposalDraft {
  title: string;
  content: string; // markdown
}

export interface ProposalState extends ProposalInput {
  model: string;
  draft?: ProposalDraft;
}

const SYSTEM = `You are a senior sales engineer writing a concise, persuasive B2B proposal
for an AI software platform (AISOLUTIONDESK). Produce a professional proposal in MARKDOWN with
sections: Overview, Recommended Solution, Key Benefits, Pricing (use sensible placeholder tiers),
and Next Steps. Respond with ONLY JSON: { "title": "...", "content": "<markdown>" }`;

function parse(content: string): ProposalDraft | null {
  try {
    const obj = JSON.parse(content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    if (!obj.content) return null;
    return { title: String(obj.title ?? 'Proposal'), content: String(obj.content) };
  } catch {
    return null;
  }
}

export function createProposalWriterAgent(
  complete: CompleteFn,
): AgentDefinition<ProposalState> {
  return {
    key: 'sales.proposal_writer',
    entry: 'write',
    nodes: {
      write: async (state, ctx) => {
        const started = Date.now();
        const res = await complete({
          model: state.model,
          temperature: 0.4,
          maxTokens: 1500,
          messages: [
            { role: 'system', content: SYSTEM },
            {
              role: 'user',
              content:
                `Prospect: ${state.fullName}, ${state.title ?? 'unknown role'} at ${state.company ?? 'their company'}.` +
                (state.notes ? `\nContext: ${state.notes}` : ''),
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
        if (!draft) throw new Error('Proposal writer returned unparseable output');
        return { patch: { draft }, next: END };
      },
    },
  };
}
