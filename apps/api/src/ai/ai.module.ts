import { Global, Module } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { ModelService } from './model.service';
import { QdrantService } from './qdrant.client';

/**
 * Bundles the AI infrastructure. Marked @Global so any feature module can
 * inject ModelService or QdrantService without re-importing this module.
 */
@Global()
@Module({
  providers: [OpenAIProvider, AnthropicProvider, ModelService, QdrantService],
  exports: [ModelService, QdrantService],
})
export class AiModule {}
