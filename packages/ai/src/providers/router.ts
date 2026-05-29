import { env } from '@aisolutiondesk/config';
import type { ModelProvider } from './types';

/**
 * Resolves a model name (e.g. "gpt-4o-mini", "claude-sonnet-4-6") to the
 * provider that serves it. This is the single place that knows which vendor
 * owns which model, so the rest of the system stays vendor-neutral.
 */
const ANTHROPIC_PREFIXES = ['claude-'];
const OPENAI_PREFIXES = ['gpt-', 'o1', 'o3', 'text-embedding-'];

export type ProviderId = ModelProvider['id'];

export function providerForModel(model: string): ProviderId {
  if (ANTHROPIC_PREFIXES.some((p) => model.startsWith(p))) return 'anthropic';
  if (OPENAI_PREFIXES.some((p) => model.startsWith(p))) return 'openai';
  // Default to the configured smart model's family.
  return env.DEFAULT_SMART_MODEL.startsWith('claude-')
    ? 'anthropic'
    : 'openai';
}

/**
 * Named model tiers let callers pick by intent ("fast" for triage/classify,
 * "smart" for generation/reasoning) instead of hardcoding model strings.
 */
export const Models = {
  fast: () => env.DEFAULT_FAST_MODEL,
  smart: () => env.DEFAULT_SMART_MODEL,
  embedding: () => env.OPENAI_EMBEDDING_MODEL,
} as const;
