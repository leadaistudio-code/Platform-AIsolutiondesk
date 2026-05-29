import { Queue } from 'bullmq';
import IORedis, { type RedisOptions } from 'ioredis';
import { env } from '@aisolutiondesk/config';

/**
 * The names of our background job queues. Each maps to a kind of slow work.
 * Producers (the API) add jobs; workers (worker.ts) process them.
 */
export const QUEUES = {
  /** Domain events fan-out (ticket.created, lead.scored, …). */
  events: 'events',
  /** Document load → chunk → embed → index into Qdrant. */
  ingestion: 'ingestion',
  /** Run an agent graph in the background. */
  agentRuns: 'agent-runs',
  /** Execute a workflow definition. */
  workflows: 'workflows',
  /** Send outbound sales messages (email/LinkedIn/WhatsApp). */
  outreach: 'outreach',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

/**
 * A single shared Redis connection config. `maxRetriesPerRequest: null` is
 * required by BullMQ workers so long-blocking commands aren't aborted.
 */
const redisOptions: RedisOptions = { maxRetriesPerRequest: null };

export function createRedisConnection(): IORedis {
  return new IORedis(env.REDIS_URL, redisOptions);
}

// Cache Queue instances so we don't open a new connection per call.
const queueCache = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue {
  let q = queueCache.get(name);
  if (!q) {
    q = new Queue(name, { connection: createRedisConnection() });
    queueCache.set(name, q);
  }
  return q;
}
