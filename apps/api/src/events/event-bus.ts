import { Injectable } from '@nestjs/common';
import { getQueue, QUEUES } from './queues';

/**
 * The intercom system. When something important happens (a ticket is created,
 * a lead is scored), a service "announces" it by calling publish(). It does NOT
 * need to know who listens. Workers subscribe to these events and react —
 * triggering workflows, updating analytics, sending notifications.
 *
 * This keeps features decoupled: adding a new reaction to "ticket.created"
 * never means editing the code that creates tickets.
 */
export type DomainEventName =
  | 'ticket.created'
  | 'ticket.updated'
  | 'document.uploaded'
  | 'lead.created'
  | 'lead.scored'
  | 'campaign.started'
  | 'agent.run.requested';

export interface DomainEvent<T = Record<string, unknown>> {
  name: DomainEventName;
  organizationId: string;
  payload: T;
  occurredAt: string;
}

@Injectable()
export class EventBus {
  async publish<T extends Record<string, unknown>>(
    name: DomainEventName,
    organizationId: string,
    payload: T,
  ): Promise<void> {
    const event: DomainEvent<T> = {
      name,
      organizationId,
      payload,
      occurredAt: new Date().toISOString(),
    };
    await getQueue(QUEUES.events).add(name, event, {
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }
}
