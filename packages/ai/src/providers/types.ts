import { z } from 'zod';

/**
 * Provider-agnostic chat interface. Both OpenAI and Anthropic implementations
 * conform to this, so agents and the orchestration engine never depend on a
 * specific vendor SDK. Switching/blending models is a config decision.
 */

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Present on assistant messages that requested tool calls. */
  toolCalls?: ToolCall[];
  /** Present on tool-result messages. */
  toolCallId?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** A callable tool exposed to the model. */
export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON schema (zod-derived) for the arguments. */
  parameters: Record<string, unknown>;
}

export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  /** Force JSON output conforming to a schema, when the provider supports it. */
  responseSchema?: z.ZodTypeAny;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface CompletionResult {
  content: string;
  toolCalls: ToolCall[];
  usage: TokenUsage;
  model: string;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

export interface StreamChunk {
  delta: string;
  done: boolean;
}

export interface EmbeddingResult {
  vectors: number[][];
  usage: TokenUsage;
  model: string;
}

/** The contract every model provider implements. */
export interface ModelProvider {
  readonly id: 'openai' | 'anthropic';
  complete(req: CompletionRequest): Promise<CompletionResult>;
  stream(req: CompletionRequest): AsyncIterable<StreamChunk>;
}

export interface EmbeddingProvider {
  embed(texts: string[], model?: string): Promise<EmbeddingResult>;
}
