import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { env } from '@aisolutiondesk/config';
import type {
  ChatMessage,
  CompletionRequest,
  CompletionResult,
  EmbeddingProvider,
  EmbeddingResult,
  ModelProvider,
  StreamChunk,
  ToolCall,
} from '@aisolutiondesk/ai';

/**
 * OpenAI implementation of our vendor-neutral ModelProvider + EmbeddingProvider.
 * It translates our generic message/tool shapes into OpenAI's SDK shapes and
 * back, so nothing else in the app touches the OpenAI SDK directly.
 */
@Injectable()
export class OpenAIProvider implements ModelProvider, EmbeddingProvider {
  readonly id = 'openai' as const;
  private readonly client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const res = await this.client.chat.completions.create({
      model: req.model,
      messages: this.toOpenAIMessages(req.messages),
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens,
      tools: req.tools?.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    });

    const choice = res.choices[0];
    const toolCalls: ToolCall[] =
      choice?.message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: safeJson(tc.function.arguments),
      })) ?? [];

    return {
      content: choice?.message.content ?? '',
      toolCalls,
      usage: {
        input: res.usage?.prompt_tokens ?? 0,
        output: res.usage?.completion_tokens ?? 0,
      },
      model: res.model,
      finishReason:
        toolCalls.length > 0
          ? 'tool_calls'
          : ((choice?.finish_reason as CompletionResult['finishReason']) ?? 'stop'),
    };
  }

  async *stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: req.model,
      messages: this.toOpenAIMessages(req.messages),
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens,
      stream: true,
    });
    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content ?? '';
      if (delta) yield { delta, done: false };
    }
    yield { delta: '', done: true };
  }

  async embed(texts: string[], model?: string): Promise<EmbeddingResult> {
    const res = await this.client.embeddings.create({
      model: model ?? env.OPENAI_EMBEDDING_MODEL,
      input: texts,
    });
    return {
      vectors: res.data.map((d) => d.embedding),
      usage: { input: res.usage?.prompt_tokens ?? 0, output: 0 },
      model: res.model,
    };
  }

  private toOpenAIMessages(
    messages: ChatMessage[],
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool',
          content: m.content,
          tool_call_id: m.toolCallId ?? '',
        };
      }
      return { role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam;
    });
  }
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
