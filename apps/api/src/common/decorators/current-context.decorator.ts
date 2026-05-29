import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest, RequestContext } from '../context/request-context';

/**
 * A shortcut so route handlers can grab the request context cleanly:
 *
 *   @Get()
 *   list(@CurrentContext() ctx: RequestContext) {
 *     // ctx.organizationId, ctx.userId, ctx.role ...
 *   }
 */
export const CurrentContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.context) {
      throw new Error('RequestContext missing — is this route behind the guards?');
    }
    return req.context;
  },
);
