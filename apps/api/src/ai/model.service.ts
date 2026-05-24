import { Injectable } from '@nestjs/common';
import {
  providerForModel,
  type CompletionRequest,
  type CompletionResult,
  type EmbeddingResult,
  type ModelProvider,
  type StreamChunk,
} from '@aisolutiondesk/ai';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

/**
 * The switchboard. Other code calls modelService.complete({ model, messages })
 * without caring whether "model" is an OpenAI or a Claude model — this picks
 * the right provider automatically. Embeddings always go through OpenAI.
 */
@Injectable()
export class ModelService {
  constructor(
    private readonly openai: OpenAIProvider,
    private readonly anthropic: AnthropicProvider,
  ) {}

  private provider(model: string): ModelProvider {
    return providerForModel(model) === 'anthropic' ? this.anthropic : this.openai;
  }

  complete(req: CompletionRequest): Promise<CompletionResult> {
    return this.provider(req.model).complete(req);
  }

  stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    return this.provider(req.model).stream(req);
  }

  embed(texts: string[], model?: string): Promise<EmbeddingResult> {
    return this.openai.embed(texts, model);
  }
}
