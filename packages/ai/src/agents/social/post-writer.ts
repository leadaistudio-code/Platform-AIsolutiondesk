import type { CompletionRequest, CompletionResult } from '../../providers/types';
import { type AgentDefinition, END } from '../../graph/types';

/**
 * Generates a paired social-media post for a given topic — a professional
 * LinkedIn version plus a punchy X (Twitter) version, in one structured call.
 * Mirrors the n8n "Generate Post (OpenAI)" step but native to the platform.
 */
type CompleteFn = (req: CompletionRequest) => Promise<CompletionResult>;

export interface SocialPostInput {
  topic: string;
}

export interface SocialPostDraft {
  linkedin: string;
  x: string;
}

export interface SocialPostState extends SocialPostInput {
  model: string;
  draft?: SocialPostDraft;
}

const SYSTEM = `You are a social media copywriter. Given a topic, produce TWO posts:
- "linkedin": a professional LinkedIn post, 3-5 short paragraphs, line breaks allowed, with 2-4 relevant hashtags at the end.
- "x": a punchy post for X / Twitter, STRICTLY under 280 characters, max 2 hashtags.
Respond with ONLY a JSON object: { "linkedin": "...", "x": "..." }. No extra text.`;

function parse(content: string): SocialPostDraft | null {
  try {
    const obj = JSON.parse(content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
    if (!obj.linkedin || !obj.x) return null;
    return { linkedin: String(obj.linkedin), x: String(obj.x).slice(0, 280) };
  } catch {
    return null;
  }
}

export function createSocialPostWriterAgent(
  complete: CompleteFn,
): AgentDefinition<SocialPostState> {
  return {
    key: 'social.post_writer',
    entry: 'write',
    nodes: {
      write: async (state, ctx) => {
        const started = Date.now();
        const res = await complete({
          model: state.model,
          temperature: 0.7,
          maxTokens: 700,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: `Topic: ${state.topic}` },
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
        if (!draft) throw new Error('Social post writer returned unparseable output');
        return { patch: { draft }, next: END };
      },
    },
  };
}
