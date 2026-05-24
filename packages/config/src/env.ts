import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';

/**
 * Find and load the nearest `.env` file by walking up from the current working
 * directory. This lets any process (API, worker, scripts) pick up the single
 * root .env no matter which sub-folder it runs from.
 */
function loadNearestEnv(): void {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) {
      loadDotenv({ path: candidate });
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // No .env found — rely on real environment variables (e.g. in production).
  loadDotenv();
}

loadNearestEnv();

/**
 * Single source of truth for environment configuration.
 * Fails fast at boot with a readable error if anything is missing/invalid.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),

  // Data stores
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  QDRANT_URL: z.string().url(),
  QDRANT_API_KEY: z.string().optional(),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // AI providers
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-large'),
  DEFAULT_FAST_MODEL: z.string().default('gpt-4o-mini'),
  DEFAULT_SMART_MODEL: z.string().default('claude-sonnet-4-6'),

  // Encryption (32-byte hex => 64 chars) for integration credentials at rest
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, {
    message: 'ENCRYPTION_KEY must be 64 hex chars (32 bytes).',
  }),

  // Billing (optional until the billing module ships)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Local-dev convenience: when true (and NOT production), unauthenticated
  // requests are treated as the OWNER of DEV_ORG_SLUG. Lets you use the app
  // before Clerk is configured. MUST stay false/unset in production.
  DEV_AUTH_BYPASS: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  DEV_ORG_SLUG: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** Parse + cache process.env. Call once at startup. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const env: Env = loadEnv();
