import 'reflect-metadata';
import { Worker, type Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { env } from '@aisolutiondesk/config';
import { createRedisConnection, QUEUES, type QueueName } from './events/queues';

/**
 * The background worker process. Run separately from the API with
 * `pnpm worker:dev` (or `node dist/worker.js` in production). It can be scaled
 * independently — add more worker machines when queues get deep.
 *
 * Each queue gets one Worker. The handlers below are intentionally minimal for
 * Phase 1 — they log the job so you can SEE the pipeline working end-to-end.
 * Real processing (ingestion, agent runs, outreach) lands in later phases.
 */
const logger = new Logger('Worker');

type Handler = (job: Job) => Promise<unknown>;

const handlers: Record<QueueName, Handler> = {
  [QUEUES.events]: async (job) => {
    logger.log(`event: ${job.name} for org ${job.data?.organizationId}`);
  },
  [QUEUES.ingestion]: async (job) => {
    logger.log(`ingestion job ${job.id} — TODO: load→chunk→embed→index`);
  },
  [QUEUES.agentRuns]: async (job) => {
    logger.log(`agent run ${job.id} — TODO: execute agent graph`);
  },
  [QUEUES.workflows]: async (job) => {
    logger.log(`workflow ${job.id} — TODO: execute workflow definition`);
  },
  [QUEUES.outreach]: async (job) => {
    logger.log(`outreach ${job.id} — TODO: send message via channel`);
  },
};

function start() {
  const workers = (Object.values(QUEUES) as QueueName[]).map((name) => {
    const worker = new Worker(name, handlers[name], {
      connection: createRedisConnection(),
      concurrency: 5,
    });
    worker.on('failed', (job, err) =>
      logger.error(`[${name}] job ${job?.id} failed: ${err.message}`),
    );
    return worker;
  });

  logger.log(`Workers started in ${env.NODE_ENV} mode for queues: ${Object.values(QUEUES).join(', ')}`);

  // Graceful shutdown so in-flight jobs finish.
  const shutdown = async () => {
    logger.log('Shutting down workers…');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
