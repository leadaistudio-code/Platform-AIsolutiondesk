import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { prisma } from '@aisolutiondesk/db';
import { Public } from '../../common/decorators/public.decorator';

/**
 * A simple "are you alive?" endpoint. Load balancers and uptime monitors call
 * GET /health to decide if this server should receive traffic. It also pings
 * the database so we know that connection works too.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  async check() {
    let database = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'error';
    }
    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
