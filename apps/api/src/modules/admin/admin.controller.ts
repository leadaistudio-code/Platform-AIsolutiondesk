import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  UpdateOrgProductsSchema,
  type UpdateOrgProductsInput,
} from '@aisolutiondesk/types';
import { CurrentContext } from '../../common/decorators/current-context.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestContext } from '../../common/context/request-context';
import { AdminService } from './admin.service';

/**
 * Platform-admin endpoints. The service enforces ctx.isPlatformAdmin on every
 * method — these routes are intentionally NOT decorated with a per-product
 * permission since they cross organizations.
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('organizations')
  listOrgs(@CurrentContext() ctx: RequestContext) {
    return this.admin.listOrgs(ctx);
  }

  @Get('organizations/:id')
  getOrg(@CurrentContext() ctx: RequestContext, @Param('id') id: string) {
    return this.admin.getOrg(ctx, id);
  }

  /** Toggle which products an organization is entitled to use. */
  @Patch('organizations/:id/products')
  updateProducts(
    @CurrentContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrgProductsSchema)) body: UpdateOrgProductsInput,
  ) {
    return this.admin.updateProducts(ctx, id, body);
  }
}
