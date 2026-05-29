import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus';

/**
 * Makes the EventBus injectable everywhere. Marked @Global so feature modules
 * can publish events without re-importing this module.
 */
@Global()
@Module({
  providers: [EventBus],
  exports: [EventBus],
})
export class EventsModule {}
