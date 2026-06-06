import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * A safety net. If anything throws an error anywhere in the app, this turns
 * it into a clean, predictable JSON response instead of leaking a stack trace
 * to the client. Real errors are still logged on the server for us to see.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status >= 500) {
      // Most errors are real Error instances (log the stack). But some SDKs —
      // notably Razorpay — reject with a plain object; String() on those gives
      // a useless "[object Object]", so serialize them to reveal the cause.
      const detail =
        exception instanceof Error
          ? exception.stack
          : typeof exception === 'object' && exception !== null
            ? JSON.stringify(exception, null, 2)
            : String(exception);
      this.logger.error(`${req.method} ${req.url}`, detail);
    }

    res.status(status).json({
      statusCode: status,
      path: req.url,
      timestamp: new Date().toISOString(),
      error: message,
    });
  }
}
