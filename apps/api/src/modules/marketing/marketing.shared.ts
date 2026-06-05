import { prisma } from '@aisolutiondesk/db';

/** Pull the first JSON object out of an LLM response, tolerating code fences. */
export function parseJsonObject(text: string): Record<string, unknown> {
  const fenced = text.replace(/```(?:json)?/gi, '').trim();
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in response');
  return JSON.parse(fenced.slice(start, end + 1)) as Record<string, unknown>;
}

export function asStringArray(v: unknown, max = 20): string[] {
  return Array.isArray(v)
    ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, max)
    : [];
}

export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/**
 * Build a "match this brand voice" prompt block from the org's brand profile,
 * so every AI generation stays on-brand. Returns '' when no profile is set.
 */
export async function buildBrandBlock(organizationId: string): Promise<string> {
  const p = await prisma.marketingBrandProfile.findUnique({
    where: { organizationId },
  });
  if (!p) return '';
  const lines: string[] = [];
  if (p.brandName) lines.push(`Brand: ${p.brandName}`);
  if (p.description) lines.push(`About: ${p.description}`);
  if (p.tone) lines.push(`Tone: ${p.tone}`);
  if (p.audience) lines.push(`Audience: ${p.audience}`);
  if (p.valueProps) lines.push(`Value propositions: ${p.valueProps}`);
  if (p.keywords.length) lines.push(`Core keywords: ${p.keywords.join(', ')}`);
  if (p.doNotMention) lines.push(`Do NOT mention: ${p.doNotMention}`);
  if (lines.length === 0) return '';
  return `\n\n--- BRAND VOICE — MATCH THIS ---\n${lines.join('\n')}`;
}
