import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, type ZodTypeAny } from 'zod';

/**
 * Validates an incoming request body against a Zod schema. If the data is
 * shaped wrong, the caller gets a clear 400 listing exactly what's invalid —
 * and our handler code can trust the data is correct.
 *
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateTicketSchema)) body: CreateTicket) { ... }
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          issues: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        });
      }
      throw err;
    }
  }
}
