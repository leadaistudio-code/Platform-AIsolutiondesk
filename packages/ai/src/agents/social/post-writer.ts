import type { CompletionRequest, CompletionResult } from '../../providers/types';
import { type AgentDefinition, END } from '../../graph/types';

/**
 * Generates a paired social-media post for a given topic — a professional
 * LinkedIn version plus a punchy X (Twitter) version, in one structured call.
 * When a SocialPersonaInput is provided, it's woven into the system prompt so
 * the post matches the brand's voice.
 */
type CompleteFn = (req: CompletionRequest) => Promise<CompletionResult>;

export interface SocialPersonaInput {
  name?: string;
  description?: string;
  tone?: string;
  audience?: string;
  doNotMention?: string;
  sampleVoice?: string;
}

export interface SocialPostInput {
  topic: string;
}

export interface SocialPostDraft {
  linkedin: string;
  x: string;
}

export interface SocialPostState extends SocialPostInput {
  model: string;
  persona?: SocialPersonaInput;
  draft?: SocialPostDraft;
}

const BASE_SYSTEM = `You are a social media copywriter. Given a topic, produce TWO posts:
- "linkedin": a professional LinkedIn post, 3-5 short paragraphs, line breaks allowed, with 2-4 relevant hashtags at the end.
- "x": a punchy post for X / Twitter, STRICTLY under 280 characters, max 2 hashtags.
Respond with ONLY a JSON object: { "linkedin": "...", "x": "..." }. No extra text.`;

function buildSystem(persona?: SocialPersonaInput): string {
  if (!persona) return BASE_SYSTEM;
  const present = Object.values(persona).some((v) => v && v.trim?.());
  if (!present) return BASE_SYSTEM;

  const lines: string[] = [BASE_SYSTEM, '', '--- BRAND VOICE — MATCH THIS ---'];
  if (persona.name) lines.push(`Brand / author: ${persona.name}`);
  if (persona.description) lines.push(`About: ${persona.description}`);
  if (persona.tone) lines.push(`Desired tone: ${persona.tone}`);
  if (persona.audience) lines.push(`Target audience: ${persona.audience}`);
  if (persona.doNotMention) lines.push(`Avoid mentioning: ${persona.doNotMention}`);
  if (persona.sampleVoice) {
    lines.push('Sample posts that capture the voice (write in this style):');
    lines.push(persona.sampleVoice);
  }
  return lines.join('\n');
}

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
            { role: 'system', content: buildSystem(state.persona) },
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
