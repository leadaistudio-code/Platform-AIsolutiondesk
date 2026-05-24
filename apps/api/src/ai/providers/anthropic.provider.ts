import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '@aisolutiondesk/config';
import type {
  ChatMessage,
  CompletionRequest,
  CompletionResult,
  ModelProvider,
  StreamChunk,
  ToolCall,
} from '@aisolutiondesk/ai';

/**
 * Anthropic (Claude) implementation of our ModelProvider. Claude takes the
 * system prompt as a separate field (not a message), so we split it out here.
 */
@Injectable()
export class AnthropicProvider implements ModelProvider {
  readonly id = 'anthropic' as const;
  private readonly client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const { system, messages } = this.split(req.messages);

    const res = await this.client.messages.create({
      model: req.model,
      system,
      messages,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.2,
      tools: req.tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters as Anthropic.Tool.InputSchema,
      })),
    });

    let content = '';
    const toolCalls: ToolCall[] = [];
    for (const block of res.content) {
      if (block.type === 'text') content += block.text;
      if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: (block.input as Record<string, unknown>) ?? {},
        });
      }
    }

    return {
      content,
      toolCalls,
      usage: {
        input: res.usage.input_tokens,
        output: res.usage.output_tokens,
      },
      model: res.model,
      finishReason: res.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
    };
  }

  async *stream(req: CompletionRequest): AsyncIterable<StreamChunk> {
    const { system, messages } = this.split(req.messages);
    const stream = this.client.messages.stream({
      model: req.model,
      system,
      messages,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.2,
    });
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { delta: event.delta.text, done: false };
      }
    }
    yield { delta: '', done: true };
  }

  /** Pull system messages out; map the rest to Claude's user/assistant turns. */
  private split(messages: ChatMessage[]): {
    system: string;
    messages: Anthropic.MessageParam[];
  } {
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    const mapped: Anthropic.MessageParam[] = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    return { system, messages: mapped };
  }
}
